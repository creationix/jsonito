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
    parts.push(...encoded)
    writeAny(rootValue, parts, known)
  } else {
    writeAny(rootValue, parts, UNKNOWN)
  }
  return parts.join("")
}

function writeKey(key: string, parts: string[], known: Map<unknown, number>) {
  if (known.has(key)) {
    const index = known.get(key)
    return parts.push(encodeB64(BigInt(index)), "&")
  }
  return writeString(key, parts)
}

function writeAny(val: unknown, parts: string[], known: Map<unknown, number>) {
  if (known.has(val)) {
    const index = known.get(val)
    return parts.push(encodeB64(BigInt(index)), "&")
  }
  if (val === null) {
    return parts.push("N!")
  }
  if (typeof val === "boolean") {
    return parts.push(val ? "!" : "F!")
  }
  if (typeof val === "number") {
    return writeNumber(val, parts)
  }
  if (typeof val === "bigint") {
    return writeInteger(val, parts)
  }
  if (typeof val === "string") {
    return writeString(val, parts)
  }
  if (typeof val === "object") {
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

const BASE64 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"

export function encodeB64(num: bigint) {
  const digits: string[] = []
  let n = num
  while (n > 0n) {
    const digit = Number(n % 64n)
    n /= 64n
    digits.push(BASE64[digit])
  }
  return digits.reverse().join("")
}

export function encodeSignedB64(num: bigint) {
  return encodeB64(num < 0n ? -num * 2n - 1n : num * 2n)
}

function writeNumber(num: number, parts: string[]) {
  const { base, exp } = splitDecimal(num)
  if (exp >= 0 && exp <= 4) {
    return writeInteger(BigInt(num), parts)
  }
  return parts.push(encodeSignedB64(BigInt(exp)), ":", encodeSignedB64(BigInt(base)), ".")
}

function writeInteger(num: bigint, parts: string[]) {
  return parts.push(encodeSignedB64(num), ".")
}

const DEC_PARTS = /^(-?\d+)(?:\.(\d+))?e[+]?([-]?\d+)$/

export function splitDecimal(num: number) {
  const match = num.toExponential().match(DEC_PARTS)
  if (!match) {
    throw new Error(`Failed to split decimal for ${num}`)
  }
  const [, b1, b2 = "", e1] = match
  const base = Number.parseInt(b1 + b2, 10)
  const exp = Number.parseInt(e1, 10) - b2.length
  return { base, exp }
}

const B64_STR = /^([1-9a-zA-Z_-][0-9a-zA-Z_-]{0,7})$/

function writeString(str: string, parts: string[]) {
  if (B64_STR.test(str)) {
    return parts.push(str, "'")
  }
  const len = new TextEncoder().encode(str).length
  return parts.push(encodeB64(BigInt(len)), "~", str)
}

function writeArray(arr: unknown[], parts: string[], known: Map<unknown, number>) {
  parts.push("[")
  for (const v of arr) {
    writeAny(v, parts, known)
  }
  parts.push("]")
}

function writeMap(map: Map<unknown, unknown>, parts: string[], known: Map<unknown, number>) {
  parts.push("{")
  for (const [k, v] of map) {
    writeAny(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push("}")
}

function writeObject(obj: object, parts: string[], known: Map<unknown, number>) {
  parts.push("{")
  for (const [k, v] of Object.entries(obj)) {
    writeKey(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push("}")
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
  walk(rootVal, seen)

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
    const refCost = encodeB64(BigInt(index)).length + 1
    const encodedCost = enc.length
    if (encodedCost <= refCost) {
      continue
    }
    known.set(val, index)
    index = encoded.push(enc)
  }

  return { known, encoded }
}

function walk(val: unknown, seen: Map<unknown, number>) {
  if (!val) {
    return
  }
  if (typeof val === "string" || typeof val === "number" || typeof val === "bigint") {
    seen.set(val, (seen.get(val) || 0) + 1)
  } else if (Array.isArray(val)) {
    for (const v of val) {
      walk(v, seen)
    }
  } else if (val instanceof Map) {
    for (const [k, v] of val) {
      walk(k, seen)
      walk(v, seen)
    }
  } else if (typeof val === "object") {
    for (const [k, v] of Object.entries(val)) {
      walk(k, seen)
      walk(v, seen)
    }
  }
}
