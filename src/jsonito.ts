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
    return parts.push(encodeVarint(BigInt(index)), '&')
  }
  return writeString(key, parts)
}

function writeAny(val: unknown, parts: string[], known: Map<unknown, number>) {
  if (known.has(val)) {
    const index = known.get(val)
    return parts.push(encodeVarint(BigInt(index)), '&')
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
  if (typeof val === 'bigint') {
    return writeInteger(val, parts)
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

export function encodeVarint(num: bigint) {
  const digits: string[] = []
  let n = num
  while (n > 0n) {
    const digit = Number(n % 64n)
    n /= 64n
    digits.push(BASE64[digit])
  }
  return digits.reverse().join('')
}

export function encodeSignedVarint(num: bigint) {
  return encodeVarint(num < 0n ? -num * 2n - 1n : num * 2n)
}

function writeNumber(num: number, parts: string[]) {
  if (Number.isSafeInteger(num)) {
    return writeInteger(BigInt(num), parts)
  }
  return writeDecimal(num, parts)
}

function writeInteger(num: bigint, parts: string[]) {
  return parts.push(encodeSignedVarint(num), '+')
}

function writeDecimal(num: number, parts: string[]) {
  const { base, exp } = splitDecimal(num)
  return parts.push(encodeSignedVarint(BigInt(base)), '|', encodeSignedVarint(BigInt(exp)), '.')
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

const B64_STR = /^([1-9a-zA-Z_-][0-9a-zA-Z_-]{0,7})$/

function writeString(str: string, parts: string[]) {
  if (B64_STR.test(str)) {
    return parts.push(str, ':')
  }
  const len = new TextEncoder().encode(str).length
  return parts.push(encodeVarint(BigInt(len)), '$', str)
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
    const refCost = encodeVarint(BigInt(index)).length + 1
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
    if (typeof val !== 'object') {
      seen.set(val, (seen.get(val) || 0) + 1)
    }
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
