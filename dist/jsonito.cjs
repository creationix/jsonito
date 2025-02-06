"use strict"
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Tim Caswell
Object.defineProperty(exports, "__esModule", { value: true })
exports.stringify = stringify
exports.encodeB64 = encodeB64
exports.encodeSignedB64 = encodeSignedB64
exports.splitDecimal = splitDecimal
exports.writeDuplicates = writeDuplicates
exports.parse = parse
exports.parseAny = parseAny
exports.skipWhitespace = skipWhitespace
exports.skipB64 = skipB64
exports.parseB64 = parseB64
const B64_STR = /^([1-9a-zA-Z_-][0-9a-zA-Z_-]{0,7})$/
// Encode any arbitrary value as JSONito
function stringify(rootValue, options = {}) {
  const parts = []
  const known = new Map()
  const willKnow = new Set()
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
function writeKey(key, parts, known) {
  const index = known.get(key)
  if (index !== undefined) {
    return parts.push(encodeB64(BigInt(index)), "*")
  }
  return writeString(key, parts)
}
function writeAny(val, parts, known) {
  const index = known.get(val)
  if (index !== undefined) {
    return parts.push(encodeB64(BigInt(index)), "*")
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
function encodeB64(num) {
  const digits = []
  let n = num
  while (n > 0n) {
    const digit = Number(n % 64n)
    n /= 64n
    digits.push(BASE64[digit])
  }
  return digits.reverse().join("")
}
function encodeSignedB64(num) {
  return encodeB64(num < 0n ? -num * 2n - 1n : num * 2n)
}
function writeNumber(num, parts) {
  const { base, exp } = splitDecimal(num)
  if (exp >= 0 && exp <= 4) {
    return writeInteger(BigInt(num), parts)
  }
  return parts.push(encodeSignedB64(BigInt(exp)), ":", encodeSignedB64(BigInt(base)), ".")
}
function writeInteger(num, parts) {
  return parts.push(encodeSignedB64(num), ".")
}
const DEC_PARTS = /^(-?\d+)(?:\.(\d+))?e[+]?([-]?\d+)$/
function splitDecimal(num) {
  const match = num.toExponential().match(DEC_PARTS)
  if (!match) {
    throw new Error(`Failed to split decimal for ${num}`)
  }
  const [, b1, b2 = "", e1] = match
  const base = Number.parseInt(b1 + b2, 10)
  const exp = Number.parseInt(e1, 10) - b2.length
  return { base, exp }
}
function writeString(str, parts) {
  if (B64_STR.test(str)) {
    return parts.push(str, "'")
  }
  const len = new TextEncoder().encode(str).length
  return parts.push(encodeB64(BigInt(len)), "~", str)
}
function writeArray(arr, parts, known) {
  parts.push("[")
  for (const v of arr) {
    writeAny(v, parts, known)
  }
  parts.push("]")
}
function writeMap(map, parts, known) {
  parts.push("{")
  for (const [k, v] of map) {
    writeAny(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push("}")
}
function writeObject(obj, parts, known) {
  parts.push("{")
  for (const [k, v] of Object.entries(obj)) {
    writeKey(k, parts, known)
    writeAny(v, parts, known)
  }
  parts.push("}")
}
function removeSingletons([_, count]) {
  return count > 1
}
function repeatOrder([_val1, count1], [_val2, count2]) {
  return count2 - count1
}
function writeDuplicates(rootVal, parts, known, willKnow) {
  // Record a count of seen values
  const seen = new Map()
  walk(rootVal, seen)
  // Filter to only repeated values
  const repeats = [...seen.entries()].filter(removeSingletons)
  // Sort by frequency descending and then by JSONito length ascending
  const sorted = [...repeats].sort(repeatOrder)
  const subParts = []
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
    const refCost = encodeB64(BigInt(known.size)).length + 1
    const encodedCost = enc.length
    if (encodedCost <= refCost) {
      continue
    }
    known.set(val, known.size)
    parts.push(enc)
  }
}
function walk(val, seen) {
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
function parse(jito, opts = {}) {
  const seen = []
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
function parseList(jito, offset, seen) {
  const list = []
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
function parseObject(jito, offset, seen) {
  const entries = []
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
function parseAny(jito, offset, seen) {
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
  const b64 = parseB64(jito, start, end)
  if (tag === ".") {
    return { value: toNumberMaybe(zigzagDecode(b64)), offset: end + 1 }
  }
  if (tag === "~") {
    const len = Number(b64)
    return { value: jito.slice(end + 1, end + 1 + len), offset: end + 1 + len }
  }
  if (tag === ":") {
    const end2 = skipB64(jito, end + 1)
    if (jito[end2] === ".") {
      const exp = zigzagDecode(b64)
      const base = zigzagDecode(parseB64(jito, end + 1, end2))
      return { value: Number.parseFloat(`${base}e${exp}`), offset: end2 + 1 }
    }
  }
  if (tag === "!") {
    if (b64 === 0n) {
      return { value: true, offset: end + 1 }
    }
    if (b64 === 41n) {
      return { value: false, offset: end + 1 }
    }
    if (b64 === 49n) {
      return { value: null, offset: end + 1 }
    }
  }
  if (tag === "*") {
    const value = seen[Number(b64)]
    if (value !== undefined) {
      return { value, offset: end + 1 }
    }
  }
  throw jitoSyntaxError(jito, offset)
}
function jitoSyntaxError(jito, offset) {
  return new SyntaxError(`Invalid JSONito at offset ${offset}: ${JSON.stringify(jito.slice(offset, offset + 10))}`)
}
function zigzagDecode(num) {
  return num % 2n === 0n ? num / 2n : -(num + 1n) / 2n
}
function toNumberMaybe(num) {
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return num
  }
  return Number(num)
}
function skipWhitespace(str, offset) {
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
function skipB64(str, offset) {
  const len = str.length
  let o = offset
  while (o < len && inB64.has(str[o])) {
    o++
  }
  return o
}
const fromB64 = new Map([...BASE64].map((c, i) => [c, i]))
function parseB64(jito, start, end) {
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
