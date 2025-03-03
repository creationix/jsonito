// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Tim Caswell
// https://github.com/creationix/jsonito

export interface EncodeOptions {
  // Do a scan on the value and inject an outer scope to factor our common values.
  findDuplicates?: boolean
  // Optional dictionaries to use for encoding
  dictionaries?: Record<string, unknown[]>
}

export interface DecodeOptions {
  // Optional dictionaries to use for decoding
  dictionaries?: Record<string, unknown[]>
}

const B64_STR = /^([1-9a-zA-Z_-][0-9a-zA-Z_-]{0,7})$/

type Known = Map<unknown, number>

// Encode any arbitrary value as JSONito
export function stringify(rootValue: unknown, options: EncodeOptions = {}): string {
  const parts: string[] = []
  const known: Known = new Map()
  const willKnow = new Set<unknown>()
  if (options.findDuplicates ?? true) {
    if (options.dictionaries) {
      for (const [_, values] of Object.entries(options.dictionaries)) {
        for (const value of values) {
          willKnow.add(value)
        }
      }
    }
    writeDuplicates(rootValue, parts, known, willKnow)
  }
  if (options.dictionaries) {
    for (const [key, values] of Object.entries(options.dictionaries)) {
      if (!B64_STR.test(key)) {
        throw new Error(`Invalid dictionary key: ${key}`)
      }
      parts.push(key, "@")
      for (const value of values) {
        known.set(value, known.size)
      }
    }
  }
  writeAny(rootValue, parts, known)

  return parts.join("")
}

function writeKey(key: string, parts: string[], known: Known) {
  const index = known.get(key)
  if (index !== undefined) {
    return parts.push(encodeB64(index), "*")
  }
  return writeString(key, parts)
}

function writeAny(val: unknown, parts: string[], known: Known) {
  const index = known.get(val)
  if (index !== undefined) {
    return parts.push(encodeB64(index), "*")
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
    return writeBigint(val, parts)
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

export function encodeB64(num: number) {
  if (num === 0) {
    return ""
  }
  const digits: string[] = []
  let n = num
  while (n > 0) {
    const digit = n % 64
    n = Math.floor(n / 64)
    digits.push(BASE64[digit])
  }
  return digits.reverse().join("")
}

export function encodeBigB64(num: bigint) {
  const digits: string[] = []
  let n = num
  while (n > 0n) {
    const digit = Number(n % 64n)
    n /= 64n
    digits.push(BASE64[digit])
  }
  return digits.reverse().join("")
}

export function encodeSignedB64(num: number) {
  // For numbers in the i32 range, we can use fast zigzag
  if (num >= -2147483648 && num < 2147483648) {
    // zigzag encode the i32 value
    return encodeB64(((num >> 31) ^ (num << 1)) >>> 0)
  }
  // For numbers in the i52 range, we can still use zigzag
  if (num >= -4503599627370495 && num <= 4503599627370495) {
    return encodeB64(num < 0 ? num * -2 - 1 : num * 2)
  }
  // For numbers outside the i52 range, we need to use bigints
  return encodeSignedBigB64(BigInt(num))
}

export function encodeSignedBigB64(num: bigint) {
  return encodeBigB64(num < 0n ? num * -2n - 1n : num * 2n)
}

export function parseSignedB64(jito: string, start: number, end: number): number {
  // For numbers in the i32 range, we can use fast zigzag
  if (end - start <= 5) {
    const b64 = parseB64(jito, start, end)
    return (b64 >> 1) ^ -(b64 & 1)
  }
  // For numbers in the i52 range, we can still use zigzag
  if (end - start <= 8) {
    const b64 = parseB64(jito, start, end)
    return b64 % 2 === 0 ? b64 / 2 : -(b64 + 1) / 2
  }
  // For numbers outside the i52 range, we need to use bigints
  return Number(parseSignedBigB64(jito, start, end))
}

export function parseSignedBigB64(jito: string, start: number, end: number): bigint {
  const b64 = parseBigB64(jito, start, end)
  return b64 % 2n === 0n ? b64 / 2n : -(b64 + 1n) / 2n
}

export function decodeSignedB64(jito: string): number {
  return parseSignedB64(jito, 0, jito.length)
}

export function decodeSignedBigB64(jito: string): bigint {
  const num = parseBigB64(jito, 0, jito.length)
  return num % 2n === 0n ? num / 2n : -(num + 1n) / 2n
}

export function decodeBigB64(jito: string): bigint {
  return parseBigB64(jito, 0, jito.length)
}

export function decodeB64(jito: string): number {
  return parseB64(jito, 0, jito.length)
}

function writeNumber(num: number, parts: string[]) {
  if (Number.isNaN(num)) {
    return parts.push("n!")
  }
  if (num === 1 / 0) {
    return parts.push("I!")
  }
  if (num === -1 / 0) {
    return parts.push("i!")
  }
  const { base, exp } = splitDecimal(num)
  if (exp >= 0 && exp <= 4) {
    return writeInteger(num, parts)
  }
  return parts.push(
    encodeSignedB64(exp),
    ":",
    typeof base === "bigint" ? encodeSignedBigB64(base) : encodeSignedB64(base),
    ".",
  )
}

function writeInteger(num: number | bigint, parts: string[]) {
  return parts.push(typeof num === "bigint" ? encodeSignedBigB64(num) : encodeSignedB64(num), ".")
}

function writeBigint(num: bigint, parts: string[]) {
  return parts.push(encodeSignedBigB64(num), ".")
}

const DEC_PARTS = /^(-?\d+)(?:\.(\d+))?e[+]?([-]?\d+)$/

export function splitDecimal(num: number) {
  const match = num.toExponential().match(DEC_PARTS)
  if (!match) {
    throw new Error(`Failed to split decimal for ${num}`)
  }
  const [, b1, b2 = "", e1] = match
  const baseStr = b1 + b2
  const base = baseStr.length < 16 ? Number.parseInt(baseStr, 10) : toNumberMaybe(BigInt(baseStr))
  const exp = Number.parseInt(e1, 10) - b2.length
  return { base, exp }
}

function writeString(str: string, parts: string[]) {
  if (B64_STR.test(str)) {
    return parts.push(str, "'")
  }
  return parts.push(encodeB64(str.length), "~", str)
}

function writeArray(arr: unknown[], parts: string[], known: Known) {
  parts.push("[")
  for (const v of arr) {
    writeAny(v, parts, known)
  }
  parts.push("]")
}

function writeMap(map: Map<unknown, unknown>, parts: string[], known: Known) {
  parts.push("{")
  for (const [k, v] of map) {
    writeAny(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push("}")
}

function writeObject(obj: object, parts: string[], known: Known) {
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

function repeatOrder([_val1, count1]: [unknown, number], [_val2, count2]: [unknown, number]) {
  return count2 - count1
}

export function writeDuplicates(rootVal: unknown, parts: string[], known: Known, willKnow: Set<unknown>) {
  // Record a count of seen values
  const seen = new Map<unknown, number>()
  walk(rootVal, seen)

  // Filter to only repeated values
  const repeats = [...seen.entries()].filter(removeSingletons)

  // Sort by frequency descending and then by JSONito length ascending
  const sorted = [...repeats].sort(repeatOrder)

  const subParts: string[] = []
  for (const [val, _count] of sorted) {
    // Skip values we have already
    if (known.has(val) || willKnow.has(val)) {
      continue
    }
    // Encode the value to calculate the cost
    writeAny(val, subParts, known)
    const enc = subParts.join("")
    subParts.length = 0
    // Filter out any values that are cheaper to encode directly
    const refCost = encodeB64(known.size).length + 1
    const encodedCost = enc.length
    if (encodedCost <= refCost) {
      continue
    }
    known.set(val, known.size)
    parts.push(enc)
  }
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

type Seen = unknown[] & { dictionaries: Record<string, unknown[]> }

export function parse(jito: string, opts: DecodeOptions = {}): unknown {
  const seen: Seen = [] as unknown as Seen
  seen.dictionaries = opts.dictionaries || {}
  const len = jito.length
  let offset = skipWhitespace(jito, 0)
  while (offset < len) {
    const { value, offset: newOffset } = parseAny(jito, offset, seen)
    offset = skipWhitespace(jito, newOffset)
    seen.push(value)
  }
  return seen.pop()
}

function parseList(jito: string, offset: number, seen: Seen): { value: unknown[]; offset: number } {
  const list: unknown[] = []
  const len = jito.length
  let o = skipWhitespace(jito, offset)
  while (o < len) {
    if (jito[o] === "]") {
      return { value: list, offset: o + 1 }
    }
    const { value, offset: newOffset } = parseAny(jito, o, seen)
    list.push(value)
    o = skipWhitespace(jito, newOffset)
  }
  throw jitoSyntaxError(jito, o)
}

function parseObject(jito: string, offset: number, seen: Seen): { value: Record<string, unknown>; offset: number } {
  const entries: [unknown, unknown][] = []
  let allStringKeys = true
  const len = jito.length
  let o = skipWhitespace(jito, offset)
  while (o < len) {
    if (jito[o] === "}") {
      return { value: allStringKeys ? Object.fromEntries(entries) : new Map(entries), offset: o + 1 }
    }
    const { value: key, offset: o2 } = parseAny(jito, o, seen)
    if (typeof key !== "string") {
      allStringKeys = false
    }
    const { value, offset: o3 } = parseAny(jito, skipWhitespace(jito, o2), seen)
    entries.push([key, value])
    o = skipWhitespace(jito, o3)
  }
  throw jitoSyntaxError(jito, o)
}

export function parseAny(jito: string, offset: number, seen: Seen): { value: unknown; offset: number } {
  const start = skipWhitespace(jito, offset)
  let tag = jito[start]
  if (tag === "[") {
    return parseList(jito, start + 1, seen)
  }
  if (tag === "{") {
    return parseObject(jito, start + 1, seen)
  }
  const end = skipB64(jito, start)
  tag = jito[end]
  if (tag === "'") {
    return { value: jito.slice(start, end), offset: end + 1 }
  }
  if (tag === "@") {
    const dictionaryName = jito.slice(start, end)
    const dict = seen.dictionaries[dictionaryName]
    if (!dict) {
      throw new Error(`Unknown dictionary: ${dictionaryName}`)
    }
    for (const value of dict) {
      seen.push(value)
    }
    return parseAny(jito, end + 1, seen)
  }

  if (tag === ".") {
    if (end - start <= 8) {
      return { value: parseSignedB64(jito, start, end), offset: end + 1 }
    }
    return { value: toNumberMaybe(parseSignedBigB64(jito, start, end)), offset: end + 1 }
  }
  if (tag === "~") {
    const len = parseB64(jito, start, end)
    return { value: jito.slice(end + 1, end + 1 + len), offset: end + 1 + len }
  }
  if (tag === ":") {
    const end2 = skipB64(jito, end + 1)
    if (jito[end2] === ".") {
      const exp = parseSignedB64(jito, start, end)
      let base: number | bigint
      if (end2 - end - 1 <= 8) {
        base = parseSignedB64(jito, end + 1, end2)
      }
      base = parseSignedBigB64(jito, end + 1, end2)
      return { value: Number.parseFloat(`${base}e${exp}`), offset: end2 + 1 }
    }
  }
  if (tag === "!") {
    const b64 = parseB64(jito, start, end)
    if (b64 === 0) {
      // ""
      return { value: true, offset: end + 1 }
    }
    if (b64 === 41) {
      // "F"
      return { value: false, offset: end + 1 }
    }
    if (b64 === 49) {
      // "N"
      return { value: null, offset: end + 1 }
    }
    if (b64 === 44) {
      // "I"
      return { value: 1 / 0, offset: end + 1 }
    }
    if (b64 === 18) {
      // "i"
      return { value: -1 / 0, offset: end + 1 }
    }
    if (b64 === 23) {
      // "n"
      return { value: 0 / 0, offset: end + 1 }
    }
  }
  if (tag === "*") {
    const value = seen[parseB64(jito, start, end)]
    if (value !== undefined) {
      return { value, offset: end + 1 }
    }
  }

  throw jitoSyntaxError(jito, offset)
}

function jitoSyntaxError(jito: string, offset: number) {
  return new SyntaxError(`Invalid JSONito at offset ${offset}: ${JSON.stringify(jito.slice(offset, offset + 10))}`)
}

function toNumberMaybe(num: bigint) {
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return num
  }
  return Number(num)
}

export function skipWhitespace(str: string, offset: number): number {
  const len = str.length
  let o = offset
  while (o < len) {
    const char = str[o]
    // Skip whitespace
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      o++
      continue
    }
    // Skip C style comments
    if (char === "/") {
      if (str[o + 1] === "/") {
        o += 2
        while (o < len && str[o] !== "\n") {
          o++
        }
        o++
        continue
      }
      if (str[o + 1] === "*") {
        o += 2
        while (o < len && str[o] !== "*" && str[o + 1] !== "/") {
          o++
        }
        o += 2
        continue
      }
    }
    break
  }
  return o
}

const inB64 = new Set(BASE64)

export function skipB64(str: string, offset: number): number {
  const len = str.length
  let o = offset
  while (o < len && inB64.has(str[o])) {
    o++
  }
  return o
}

export function parseB64(jito: string, start: number, end: number): number {
  let num = 0
  for (let i = start; i < end; i++) {
    const digit = fromB64.get(jito[i])
    if (digit === undefined) {
      throw new Error(`Invalid base64 digit: ${jito[i]}`)
    }
    num = num * 64 + digit
  }
  return num
}

const fromB64 = new Map<string, number>([...BASE64].map((c, i) => [c, i]))

export function parseBigB64(jito: string, start: number, end: number): bigint {
  let num = 0n
  for (let i = start; i < end; i++) {
    const digit = fromB64.get(jito[i])
    if (digit === undefined) {
      throw new Error(`Invalid base64 digit: ${jito[i]}`)
    }
    num = num * 64n + BigInt(digit)
  }
  return num
}
