export interface EncodeOptions {
  // Do a scan on the value and inject an outer scope to factor our common values.
  findDuplicates?: boolean
}

const UNKNOWN = new Map<unknown, number>()

// Encode any arbitrary value as JSONito
export function stringify(rootValue: unknown, options: EncodeOptions = {}): string {
  const parts: string[] = []
  if (options.findDuplicates ?? true) {
    const { known, encoded } = findDuplicates(rootValue)
    if (encoded.length > 0) {
      return stringifyWithDuplicates(rootValue, known, encoded)
    }
  }
  writeAny(rootValue, parts, UNKNOWN)
  return parts.join('')
}

function stringifyWithDuplicates(rootValue: unknown, known: Map<unknown, number>, encoded: string[]) {
  const parts: string[] = []
  parts.push('(', ...encoded)
  writeAny(rootValue, parts, known)
  parts.push(')')
  return parts.join('')
}

function writeKey(key: string, parts: string[], known: Map<unknown, number>) {
  if (known.has(key)) {
    const index = known.get(key)
    return parts.push(encodeVarint(index), '&')
  }
  return writeString(key, parts)
}

function writeAny(val: unknown, parts: string[], known: Map<unknown, number>) {
  if (known.has(val)) {
    const index = known.get(val)
    return parts.push(encodeVarint(index), '&')
  }
  if (val === null) {
    return parts.push('?')
  }
  if (typeof val === 'boolean') {
    return parts.push(val ? '!' : '~')
  }
  if (typeof val === 'number') {
    return writeNumber(val, parts)
  }
  if (typeof val === 'string') {
    return writeString(val, parts)
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return writeArray(val, parts, known)
    }
    if (val instanceof Map) {
      return writeMap(val, parts, known)
    }
    return writeObject(val, parts, known)
  }
  throw new Error(`TODO: implement writeAny for ${typeof val}`)
}

const BASE64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

export function encodeVarint(num: number) {
  const digits: string[] = []
  let n = num
  while (n > 0) {
    const digit = n % 64
    n = Math.floor(n / 64)
    digits.push(BASE64[digit])
  }
  return digits.reverse().join('')
}

export function encodeSignedVarint(num: number) {
  return encodeVarint(num < 0 ? -num * 2 - 1 : num * 2)
}

function writeNumber(num: number, parts: string[]) {
  if (Number.isSafeInteger(num)) {
    return parts.push(encodeSignedVarint(num), '+')
  }
  const { base, exp } = splitDecimal(num)
  return parts.push(encodeSignedVarint(base), '|', encodeSignedVarint(exp), '.')
}

const DEC_PARTS = /^(-?\d+)(?:\.(\d+))?e[+]?([-]?\d+)$/

export function splitDecimal(num: number) {
  const match = num.toExponential().match(DEC_PARTS)
  if (!match) {
    throw new Error(`Failed to split decimal for ${num}`)
  }
  const [, b1, b2 = '', e1] = match
  const base = Number.parseInt(b1 + b2, 10)
  const exp = Number.parseInt(e1, 10) - b2.length
  return { base, exp }
}

const B64_STR = /^([a-zA-Z0-9_-]+)$/

function writeString(str: string, parts: string[]) {
  if (B64_STR.test(str)) {
    return parts.push(str, ':')
  }
  const len = new TextEncoder().encode(str).length
  return parts.push(encodeVarint(len), '$', str)
}

function writeArray(arr: unknown[], parts: string[], known: Map<unknown, number>) {
  parts.push('[')
  for (const v of arr) {
    writeAny(v, parts, known)
  }
  parts.push(']')
}

function writeMap(map: Map<unknown, unknown>, parts: string[], known: Map<unknown, number>) {
  parts.push('{')
  for (const [k, v] of map) {
    writeAny(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push('}')
}

function writeObject(obj: object, parts: string[], known: Map<unknown, number>) {
  parts.push('{')
  for (const [k, v] of Object.entries(obj)) {
    writeKey(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push('}')
}

function removeSingletons([_, count]: [unknown, number]) {
  return count > 1
}

function addEncoding([val, count]: [unknown, number]): [unknown, number, string] {
  return [val, count, stringify(val)]
}

function repeatOrder(
  [_val1, count1, enc1]: [unknown, number, string],
  [_val2, count2, enc2]: [unknown, number, string],
) {
  if (count1 !== count2) {
    return count2 - count1
  }
  return enc1.length - enc2.length
}

export function findDuplicates(rootVal: unknown) {
  // Record a count of seen values
  const seen = new Map<unknown, number>()
  walk(rootVal)

  const repeats = seen
    .entries()
    // Filter to only repeated values
    .filter(removeSingletons)
    // Encode each value as JSONito
    .map(addEncoding)

  // Sort by frequency descending and then by JSONito length ascending
  const sorted = [...repeats].sort(repeatOrder)

  const known = new Map<unknown, number>()
  const encoded: string[] = []
  let index = 0
  for (const [val, _count, enc] of sorted) {
    // Filter out any values that are cheaper to encode directly
    const refCost = encodeVarint(index).length + 1
    const encodedCost = enc.length
    if (encodedCost <= refCost) {
      continue
    }
    known.set(val, index)
    index = encoded.push(enc)
  }

  return { known, encoded }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  function walk(val: unknown) {
    // Fast skip values that are cheaper to encode directly
    if (!val || val === true || (typeof val === 'number' && Math.abs(val) < 64)) {
      return
    }
    seen.set(val, (seen.get(val) || 0) + 1)
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        for (const v of val) {
          walk(v)
        }
      } else if (val instanceof Map) {
        for (const [k, v] of val) {
          walk(k)
          walk(v)
        }
      } else {
        for (const [k, v] of Object.entries(val)) {
          walk(k)
          walk(v)
        }
      }
    }
  }
}

console.log(stringify(123))
console.log(stringify(123456))
console.log(stringify(123.456))
console.log(stringify(Math.PI))

console.log(stringify('hello'))
console.log(stringify('hello world'))

console.log(stringify(true))
console.log(stringify(false))
console.log(stringify(null))

// Test arrays
console.log(stringify([1, 2, 3]))
console.log(stringify([1, 2, 3, 4, 5]))
// Test nested arrays
console.log(
  stringify([
    [1, 2],
    [3, 4],
  ]),
)
// test objects
console.log(stringify({ a: 1, b: 2 }))
// test nested objects
console.log(stringify({ a: { b: { c: 1 } } }))
// test maps
console.log(
  stringify(
    new Map([
      ['a', 1],
      ['b', 2],
    ]),
  ),
)
// test nested maps
console.log(stringify(new Map([['a', new Map([['b', 1]])]])))
// test nested arrays, objects, and maps
console.log(
  stringify({
    a: [1, 2, 3],
    b: { c: 4, d: 5 },
    e: new Map([
      ['f', 6],
      ['g', 7],
    ]),
  }),
)
// test mixed types
console.log(stringify([1, 'hello', true, null, { a: 1 }, new Map([['b', 2]])]))

// Test duplicate detection
console.log(
  stringify(
    [
      { color: 'red', fruits: ['apple', 'strawberry'] },
      { color: 'green', fruits: ['apple'] },
      { color: 'yellow', fruits: ['apple', 'banana'] },
      { color: 'orange', fruits: ['orange', 'bell pepper'] },
    ],
    { findDuplicates: true },
  ),
)

const clone = [1, 2, 3]
console.log(stringify([[1, 2, 3], clone, clone], { findDuplicates: true }))

console.log(stringify(['🟥🟧🟨🟩🟦🟪', '🏵ROSETTE', '👶WH', '🟥🟧🟨🟩🟦🟪']))

console.log(
  stringify({
    pathology: {
      groupings: [
        {
          level: 'table',
          order: 'alpha',
          orientation: 'horizontal',
        },
        {
          level: 'field',
          order: 'alpha',
          orientation: 'horizontal',
        },
      ],
      tables: [
        {
          table: 'EngineReportInfo',
          fields: [
            {
              field: 'ClassifiedDiseaseGroup',
              datatype: 'string',
              closedClass: 'False',
              diseaseProperties: [{ diseaseGroup: ['*'], values: ['disease1', 'disease2', 'disease3'] }],
            },
          ],
        },
        {
          table: 'Table1',
          fields: [
            {
              field: 'Field1',
              datatype: 'string',
              closedClass: 'True',
              diseaseProperties: [{ diseaseGroup: ['*'], values: ['Yes', 'No'] }],
            },
          ],
        },
      ],
    },
  }),
)

console.log(
  stringify({
    $id: 'https://example.com/conditional-validation-if-else.schema.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Conditional Validation with If-Else',
    type: 'object',
    properties: {
      isMember: {
        type: 'boolean',
      },
      membershipNumber: {
        type: 'string',
      },
    },
    required: ['isMember'],
    if: {
      properties: {
        isMember: {
          const: true,
        },
      },
    },
    // biome-ignore lint/suspicious/noThenProperty: <explanation>
    then: {
      properties: {
        membershipNumber: {
          type: 'string',
          minLength: 10,
          maxLength: 10,
        },
      },
    },
    else: {
      properties: {
        membershipNumber: {
          type: 'string',
          minLength: 15,
        },
      },
    },
  }),
)
console.log(
  stringify({
    $id: 'https://example.com/complex-object.schema.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Complex Object',
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
        minimum: 0,
      },
      address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
          state: {
            type: 'string',
          },
          postalCode: {
            type: 'string',
            pattern: '\\d{5}',
          },
        },
        required: ['street', 'city', 'state', 'postalCode'],
      },
      hobbies: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: ['name', 'age'],
  }),
)
