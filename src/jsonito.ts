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

const B36_STR = /^([1-9a-z][0-9a-z]{0,10})$/

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
      if (!B36_STR.test(key)) {
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
    return parts.push(encodeB36(BigInt(index)), "*")
  }
  return writeString(key, parts)
}

function writeAny(val: unknown, parts: string[], known: Known) {
  const index = known.get(val)
  if (index !== undefined) {
    return parts.push(encodeB36(BigInt(index)), "*")
  }
  if (val === null) {
    return parts.push("N")
  }
  if (typeof val === "boolean") {
    return parts.push(val ? "T" : "F")
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

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz"

export function encodeB36(num: bigint) {
  if (num === 0n) {
    return ""
  }
  return num.toString(36)
}

export function encodeSignedB36(num: bigint) {
  return encodeB36(num < 0n ? -num * 2n - 1n : num * 2n)
}

function writeNumber(num: number, parts: string[]) {
  const { base, exp } = splitDecimal(num)
  if (exp >= 0 && exp <= 4) {
    return writeInteger(BigInt(num), parts)
  }
  return parts.push(encodeSignedB36(BigInt(exp)), ":", encodeSignedB36(BigInt(base)), ".")
}

function writeInteger(num: bigint, parts: string[]) {
  return parts.push(encodeSignedB36(num), ".")
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

function writeString(str: string, parts: string[]) {
  if (B36_STR.test(str)) {
    return parts.push(str, "'")
  }
  return parts.push(encodeB36(BigInt(str.length)), "~", str)
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
    const refCost = encodeB36(BigInt(known.size)).length + 1
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
    const value = parseAny()
    offset = skipWhitespace(jito, offset)
    seen.push(value)
  }
  return seen.pop()

  function parseList(): unknown[] {
    const list: unknown[] = []
    const len = jito.length
    offset = skipWhitespace(jito, offset)
    while (offset < len) {
      if (jito[offset] === "]") {
        offset++
        return list
      }
      const value = parseAny()
      list.push(value)
      offset = skipWhitespace(jito, offset)
    }
    throw jitoSyntaxError(jito, offset)
  }

  function parseObject(): Record<string, unknown> {
    const entries: [unknown, unknown][] = []
    let allStringKeys = true
    const len = jito.length
    offset = skipWhitespace(jito, offset)
    while (offset < len) {
      if (jito[offset] === "}") {
        offset++
        return allStringKeys ? Object.fromEntries(entries) : new Map(entries)
      }
      const key = parseAny()
      if (typeof key !== "string") {
        allStringKeys = false
      }
      offset = skipWhitespace(jito, offset)
      const value = parseAny()
      entries.push([key, value])
      offset = skipWhitespace(jito, offset)
    }
    throw jitoSyntaxError(jito, offset)
  }

  function parseAny(): unknown {
    offset = skipWhitespace(jito, offset)
    let tag = jito[offset]
    if (tag === "[") {
      offset++
      return parseList()
    }
    if (tag === "{") {
      offset++
      return parseObject()
    }
    let start = offset
    offset = skipB36(jito, offset)
    tag = jito[offset]
    if (tag === "'") {
      return jito.slice(start, offset++)
    }
    if (tag === "@") {
      const dictionaryName = jito.slice(start, offset++)
      const dict = seen.dictionaries[dictionaryName]
      if (!dict) {
        throw new Error(`Unknown dictionary: ${dictionaryName}`)
      }
      for (const value of dict) {
        seen.push(value)
      }
      return parseAny()
    }

    if (tag === ".") {
      if (offset - start <= 10) {
        return zigzagDecode(parseB36(jito, start, offset++))
      }
      return toNumberMaybe(zigzagDecodeBig(parseBigB36(jito, start, offset++)))
    }
    if (tag === "~") {
      const len = parseB36(jito, start, offset++)
      start = offset
      offset += len
      return jito.slice(start, offset)
    }
    if (tag === ":") {
      const exp = zigzagDecode(parseB36(jito, start, offset++))
      start = offset
      offset = skipB36(jito, offset)
      if (jito[offset] === ".") {
        const base = zigzagDecodeBig(parseBigB36(jito, start, offset++))
        return Number.parseFloat(`${base}e${exp}`)
      }
    }
    if (tag === "T") {
      offset++
      return true
    }
    if (tag === "F") {
      offset++
      return false
    }
    if (tag === "N") {
      offset++
      return null
    }
    if (tag === "*") {
      const index = parseB36(jito, start, offset++)
      if (index in seen) {
        return seen[index]
      }
    }

    throw jitoSyntaxError(jito, offset)
  }
}

function jitoSyntaxError(jito: string, offset: number) {
  return new SyntaxError(`Invalid JSONito at offset ${offset}: ${JSON.stringify(jito.slice(offset, offset + 10))}`)
}

function zigzagDecodeBig(num: bigint) {
  return num % 2n === 0n ? num / 2n : -(num + 1n) / 2n
}

function zigzagDecode(num: number) {
  return num % 2 === 0 ? num / 2 : -(num + 1) / 2
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

const inB36 = new Set(BASE36)

export function skipB36(str: string, offset: number): number {
  const len = str.length
  let o = offset
  while (o < len) {
    const c = str.charCodeAt(o)
    if (c < 0x30 || (c > 0x39 && c < 0x61) || c > 0x7a) {
      break
    }
    o++
  }
  return o
}

const fromB36 = new Map<string, number>([...BASE36].map((c, i) => [c, i]))

export function parseB36(jito: string, start: number, end: number): number {
  if (end === start) {
    return 0
  }
  return Number.parseInt(jito.substring(start, end), 36)
}

export function parseBigB36(jito: string, start: number, end: number): bigint {
  if (end === start) {
    return 0n
  }
  if (end - start <= 10) {
    return BigInt(Number.parseInt(jito.substring(start, end), 36))
  }
  let num = 0n
  for (let i = start; i < end; i++) {
    const digit = fromB36.get(jito[i])
    if (digit === undefined) {
      throw new Error(`Invalid base36 digit: ${jito[i]}`)
    }
    num = num * 36n + BigInt(digit)
  }
  return num
}
