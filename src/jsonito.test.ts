import { expect, test } from "bun:test"
import {
  // decoder functions
  stringify,
  encodeBigB36,
  encodeSignedBigB36,
  splitDecimal,
  // encoder functions
  skipWhitespace,
  skipB36,
  parseBigB36,
  parse,
  type EncodeOptions,
} from "./jsonito.ts"

test("splitDecimal", () => {
  expect(splitDecimal(0.1)).toEqual({ base: 1, exp: -1 })
  expect(splitDecimal(-0.1)).toEqual({ base: -1, exp: -1 })
  expect(splitDecimal(10.1)).toEqual({ base: 101, exp: -1 })
  expect(splitDecimal(-10.1)).toEqual({ base: -101, exp: -1 })
  expect(splitDecimal(10)).toEqual({ base: 1, exp: 1 })
  expect(splitDecimal(-10)).toEqual({ base: -1, exp: 1 })
  expect(splitDecimal(5e4)).toEqual({ base: 5, exp: 4 })
  expect(splitDecimal(9e8)).toEqual({ base: 9, exp: 8 })
  expect(splitDecimal(123e56)).toEqual({ base: 123, exp: 56 })
  expect(splitDecimal(-321e54)).toEqual({ base: -321, exp: 54 })
  expect(splitDecimal(-321e-54)).toEqual({ base: -321, exp: -54 })
  expect(splitDecimal(1.3310393152443792e308)).toEqual({ base: 13310393152443792, exp: 292 })
  expect(splitDecimal(1.797693134862298e308)).toEqual({ base: 1797693134862298, exp: 293 })
  expect(splitDecimal(7.29112201955639e-304)).toEqual({ base: 729112201955639, exp: -318 })
  expect(() => splitDecimal(1 / 0)).toThrow()
  expect(() => splitDecimal(-1 / 0)).toThrow()
  expect(() => splitDecimal(0 / 0)).toThrow()
})

test("encode B36 digits", () => {
  expect(encodeBigB36(0n)).toEqual("")
  expect(encodeBigB36(1n)).toEqual("1")
  expect(encodeBigB36(9n)).toEqual("9")
  expect(encodeBigB36(10n)).toEqual("a")
  expect(encodeBigB36(35n)).toEqual("z")
  expect(encodeBigB36(36n)).toEqual("10")
  expect(encodeBigB36(1375732n)).toEqual("this")
  expect(encodeBigB36(676n)).toEqual("is")
  expect(encodeBigB36(62749271102n)).toEqual("strange")
  expect(encodeBigB36(1767707668033969n)).toEqual("helloworld")
  expect(encodeBigB36(BigInt(Number.MAX_SAFE_INTEGER))).toEqual("2gosa7pa2gv")
  expect(encodeBigB36(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toEqual("2gosa7pa2gw")
  expect(encodeBigB36(BigInt(Number.MAX_SAFE_INTEGER) - 1n)).toEqual("2gosa7pa2gu")
  expect(encodeSignedBigB36(0n)).toEqual("")
  expect(encodeSignedBigB36(-1n)).toEqual("1")
  expect(encodeSignedBigB36(1n)).toEqual("2")
  expect(encodeSignedBigB36(-9n)).toEqual("h")
  expect(encodeSignedBigB36(9n)).toEqual("i")
  expect(encodeSignedBigB36(-10n)).toEqual("j")
  expect(encodeSignedBigB36(10n)).toEqual("k")
  expect(encodeSignedBigB36(-35n)).toEqual("1x")
  expect(encodeSignedBigB36(35n)).toEqual("1y")
  expect(encodeSignedBigB36(-64n)).toEqual("3j")
  expect(encodeSignedBigB36(64n)).toEqual("3k")
  expect(encodeSignedBigB36(687866n)).toEqual("this")
  expect(encodeSignedBigB36(338n)).toEqual("is")
  expect(encodeSignedBigB36(31374635551n)).toEqual("strange")
  expect(encodeSignedBigB36(100683761859705616735460904644n)).toEqual("jitolovesbignumbers")
})

test("encode integers", () => {
  expect(stringify(0)).toEqual(".")
  expect(stringify(1)).toEqual("2.")
  expect(stringify(12)).toEqual("o.")
  expect(stringify(123)).toEqual("6u.")
  expect(stringify(1234)).toEqual("1wk.")
  expect(stringify(12345)).toEqual("j1u.")
  expect(stringify(123456)).toEqual("5aio.")
  expect(stringify(1234567)).toEqual("1gx72.")
  expect(stringify(12345678)).toEqual("ep7z0.")
  expect(stringify(123456789)).toEqual("4307qi.")
  expect(stringify(1234567890)).toEqual("14u25d0.")
  expect(stringify(-1)).toEqual("1.")
  expect(stringify(-12)).toEqual("n.")
  expect(stringify(-123)).toEqual("6t.")
  expect(stringify(-1234)).toEqual("1wj.")
  expect(stringify(-12345)).toEqual("j1t.")
  expect(stringify(-123456)).toEqual("5ain.")
  expect(stringify(-1234567)).toEqual("1gx71.")
  expect(stringify(-12345678)).toEqual("ep7yz.")
  expect(stringify(-123456789)).toEqual("4307qh.")
  expect(stringify(-1234567890)).toEqual("14u25cz.")
  expect(stringify(1e10 - 1)).toEqual("96rheri.")
  expect(stringify(1e11 - 1)).toEqual("2jvmu3ni.")
  expect(stringify(1e12 - 1)).toEqual("piscd0ji.")
  expect(stringify(1e13 - 1)).toEqual("737vfm5fi.")
  expect(stringify(36n ** 1n)).toEqual("20.")
  expect(stringify(36n ** 2n)).toEqual("200.")
  expect(stringify(36n ** 3n)).toEqual("2000.")
  expect(stringify(36n ** 4n)).toEqual("20000.")
  expect(stringify(36n ** 5n)).toEqual("200000.")
  expect(stringify(36n ** 6n)).toEqual("2000000.")
  expect(stringify(36n ** 7n)).toEqual("20000000.")
  expect(stringify(36n ** 8n)).toEqual("200000000.")
  expect(stringify(36n ** 9n)).toEqual("2000000000.")
  expect(stringify(36n ** 10n)).toEqual("20000000000.")
  expect(stringify(36n ** 11n)).toEqual("200000000000.")
  expect(stringify(36n ** 12n)).toEqual("2000000000000.")
  expect(stringify(36n ** 13n)).toEqual("20000000000000.")
  expect(stringify(36n ** 14n)).toEqual("200000000000000.")
  expect(stringify(36n ** 15n)).toEqual("2000000000000000.")
  expect(stringify(36n ** 16n)).toEqual("20000000000000000.")
  expect(stringify(36n ** 17n)).toEqual("200000000000000000.")
  expect(stringify(36n ** 18n)).toEqual("2000000000000000000.")
  expect(stringify(36n ** 19n)).toEqual("20000000000000000000.")
  expect(stringify(36n ** 20n)).toEqual("200000000000000000000.")
  expect(stringify(36n ** 20n / -2n)).toEqual("zzzzzzzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 19n / -2n)).toEqual("zzzzzzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 18n / -2n)).toEqual("zzzzzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 17n / -2n)).toEqual("zzzzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 16n / -2n)).toEqual("zzzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 15n / -2n)).toEqual("zzzzzzzzzzzzzzz.")
  expect(stringify(36n ** 14n / -2n)).toEqual("zzzzzzzzzzzzzz.")
  expect(stringify(36n ** 13n / -2n)).toEqual("zzzzzzzzzzzzz.")
  expect(stringify(36n ** 12n / -2n)).toEqual("zzzzzzzzzzzz.")
  expect(stringify(36n ** 11n / -2n)).toEqual("zzzzzzzzzzz.")
  expect(stringify(36n ** 10n / -2n)).toEqual("zzzzzzzzzz.")
  expect(stringify(Number.MIN_SAFE_INTEGER)).toEqual("4xdkkfek4xp.")
  expect(stringify(Number.MIN_SAFE_INTEGER / 2 - 1)).toEqual("2gosa7pa2gv.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 2)).toEqual("18ce53un18f.")
  expect(stringify(Number.MAX_SAFE_INTEGER)).toEqual("4xdkkfek4xq.")
  expect(stringify(Number.MAX_SAFE_INTEGER / 2 + 1)).toEqual("2gosa7pa2gw.")
  expect(stringify(-1229782938247303441n)).toEqual("iopvc537u71d.")
  expect(stringify(1229782938247303441n)).toEqual("iopvc537u71e.")
  expect(stringify(-2459565876494606882n)).toEqual("11dfqoa6foe2r.")
  expect(stringify(2459565876494606882n)).toEqual("11dfqoa6foe2s.")
  expect(stringify(-4919131752989213764n)).toEqual("22qvhckcvcs5j.")
  expect(stringify(4919131752989213764n)).toEqual("22qvhckcvcs5k.")
  expect(stringify(-9223372036854775807n)).toEqual("3w5e11264sgsd.")
  expect(stringify(9223372036854775807n)).toEqual("3w5e11264sgse.")
  expect(stringify(-9223372036854775808n)).toEqual("3w5e11264sgsf.")
  expect(stringify(0xfn)).toEqual("u.")
  expect(stringify(0xffn)).toEqual("e6.")
  expect(stringify(0xfffn)).toEqual("6bi.")
  expect(stringify(100683761859705616735460904644n)).toEqual("jitolovesbignumbers.")
})

test("smart decimal integers", () => {
  expect(stringify(1)).toEqual("2.")
  expect(stringify(10)).toEqual("k.")
  expect(stringify(100)).toEqual("5k.")
  expect(stringify(1000)).toEqual("1jk.")
  expect(stringify(10000)).toEqual("ffk.")
  expect(stringify(100000)).toEqual("a:2.")
  expect(stringify(1000000)).toEqual("c:2.")
  expect(stringify(10000000)).toEqual("e:2.")
  expect(stringify(100000000)).toEqual("g:2.")
  expect(stringify(1000000000)).toEqual("i:2.")
  expect(stringify(10000000000)).toEqual("k:2.")
  expect(stringify(100000000000)).toEqual("m:2.")
  expect(stringify(1000000000000)).toEqual("o:2.")
  expect(stringify(10000000000000)).toEqual("q:2.")
  expect(stringify(100000000000000)).toEqual("s:2.")
  expect(stringify(1000000000000000)).toEqual("u:2.")
  expect(stringify(0.0000000000001)).toEqual("p:2.")
  expect(stringify(0.000000000001)).toEqual("n:2.")
  expect(stringify(0.00000000001)).toEqual("l:2.")
  expect(stringify(0.0000000001)).toEqual("j:2.")
  expect(stringify(0.000000001)).toEqual("h:2.")
  expect(stringify(0.00000001)).toEqual("f:2.")
  expect(stringify(0.0000001)).toEqual("d:2.")
  expect(stringify(0.000001)).toEqual("b:2.")
  expect(stringify(0.00001)).toEqual("9:2.")
  expect(stringify(0.0001)).toEqual("7:2.")
  expect(stringify(0.001)).toEqual("5:2.")
  expect(stringify(0.01)).toEqual("3:2.")
  expect(stringify(0.1)).toEqual("1:2.")
  expect(stringify(9)).toEqual("i.")
  expect(stringify(90)).toEqual("50.")
  expect(stringify(900)).toEqual("1e0.")
  expect(stringify(9000)).toEqual("dw0.")
  expect(stringify(90000)).toEqual("3uw0.")
  expect(stringify(900000)).toEqual("a:i.")
  expect(stringify(9000000)).toEqual("c:i.")
  expect(stringify(90000000)).toEqual("e:i.")
  expect(stringify(900000000)).toEqual("g:i.")
  expect(stringify(9000000000)).toEqual("i:i.")
  expect(stringify(90000000000)).toEqual("k:i.")
  expect(stringify(900000000000)).toEqual("m:i.")
  expect(stringify(9000000000000)).toEqual("o:i.")
  expect(stringify(90000000000000)).toEqual("q:i.")
  expect(stringify(900000000000000)).toEqual("s:i.")
  expect(stringify(9000000000000000)).toEqual("u:i.")
  expect(stringify(0.0000000000009)).toEqual("p:i.")
  expect(stringify(0.000000000009)).toEqual("n:i.")
  expect(stringify(0.00000000009)).toEqual("l:i.")
  expect(stringify(0.0000000009)).toEqual("j:i.")
  expect(stringify(0.000000009)).toEqual("h:i.")
  expect(stringify(0.00000009)).toEqual("f:i.")
  expect(stringify(0.0000009)).toEqual("d:i.")
  expect(stringify(0.000009)).toEqual("b:i.")
  expect(stringify(0.00009)).toEqual("9:i.")
  expect(stringify(0.0009)).toEqual("7:i.")
  expect(stringify(0.009)).toEqual("5:i.")
  expect(stringify(0.09)).toEqual("3:i.")
  expect(stringify(0.9)).toEqual("1:i.")
})

test("encode decimals", () => {
  expect(stringify(0.1)).toEqual("1:2.")
  expect(stringify(-0.1)).toEqual("1:1.")
  expect(stringify(10.1)).toEqual("1:5m.")
  expect(stringify(-10.1)).toEqual("1:5l.")
  expect(stringify(1e-10)).toEqual("j:2.")
  expect(stringify(-1e-10)).toEqual("j:1.")
  expect(stringify(0.123)).toEqual("5:6u.")
  expect(stringify(0.123456)).toEqual("b:5aio.")
  expect(stringify(0.123456789)).toEqual("h:4307qi.")
  expect(stringify(123.456789)).toEqual("b:4307qi.")
  expect(stringify(123456.789)).toEqual("5:4307qi.")
  expect(stringify(123456789e9)).toEqual("i:4307qi.")
  expect(stringify(123456789e-20)).toEqual("13:4307qi.")
  expect(stringify(123456789e20)).toEqual("14:4307qi.")
  expect(stringify(123456789e-40)).toEqual("27:4307qi.")
  expect(stringify(123456789e40)).toEqual("28:4307qi.")
  expect(stringify(123456789e-80)).toEqual("4f:4307qi.")
  expect(stringify(123456789e80)).toEqual("4g:4307qi.")
  expect(stringify(123456789e-160)).toEqual("8v:4307qi.")
  expect(stringify(123456789e160)).toEqual("8w:4307qi.")
  expect(stringify(123456789e-320)).toEqual("hr:4307qi.")
  expect(stringify(10000 / 10001)).toEqual("v:5gwp6gq0540.")
  expect(stringify(10000 / 10003)).toEqual("v:5gva5mhkitc.")
  expect(stringify(10000 / 10007)).toEqual("v:5gsg65bcv6o.")
  expect(stringify(Math.PI)).toEqual("t:1pv7bhcuvcy.") // 3.141592653589793
  expect(stringify(-Math.PI)).toEqual("t:1pv7bhcuvcx.") // -3.141592653589793
  expect(stringify(Math.E)).toEqual("t:1hj3mv5exxm.") // 2.718281828459045
  expect(stringify(-Math.E)).toEqual("t:1hj3mv5exxl.") // -2.718281828459045
  expect(stringify(Math.SQRT2)).toEqual("v:7qhxqtyhv68.") // 1.4142135623730951
  expect(stringify(-Math.SQRT2)).toEqual("v:7qhxqtyhv67.") // -1.4142135623730951
  expect(stringify(-Number.MAX_VALUE)).toEqual("g8:9u0kwi4pqhz.")
  expect(stringify(Number.MAX_VALUE)).toEqual("g8:9u0kwi4pqi0.")
  expect(stringify(-Number.MIN_VALUE)).toEqual("hz:9.")
  expect(stringify(Number.MIN_VALUE)).toEqual("hz:a.")
})

test("encode primitives", () => {
  expect(stringify(true)).toEqual("T")
  expect(stringify(false)).toEqual("F")
  expect(stringify(null)).toEqual("N")
  expect(() => stringify(undefined)).toThrow()
})

test("encode b36 strings", () => {
  expect(stringify("short")).toEqual("short'")
  expect(stringify("1234")).toEqual("1234'")
  // Leading zeros aren't supported
  expect(stringify("01234")).toEqual("5~01234")
  // strings longer than 10 chars aren't encoded in this version
  expect(stringify("12345678")).toEqual("12345678'")
  expect(stringify("123456789")).toEqual("123456789'")
  expect(stringify("1234567890")).toEqual("1234567890'")
  expect(stringify("1234567890a")).toEqual("1234567890a'")
  expect(stringify("1234567890ab")).toEqual("c~1234567890ab")
  expect(stringify("thisisverylong")).toEqual("e~thisisverylong")
})

test("encode strings", () => {
  expect(stringify("")).toEqual("~")
  expect(stringify(" ")).toEqual("1~ ")
  expect(stringify("Hi!")).toEqual("3~Hi!")
  expect(stringify("Goodbye.")).toEqual("8~Goodbye.")
  expect(stringify("1 2 3")).toEqual("5~1 2 3")
  expect(stringify("𐐡𐐰𐑌𐐼o")).toEqual("9~𐐡𐐰𐑌𐐼o")
  expect(stringify("🚀🎲")).toEqual("4~🚀🎲")
  expect(stringify("👶OM🍼")).toEqual("6~👶OM🍼")
  expect(stringify(" ".repeat(10))).toEqual(`a~${" ".repeat(10)}`)
  expect(stringify(" ".repeat(100))).toEqual(`2s~${" ".repeat(100)}`)
  expect(stringify(" ".repeat(1000))).toEqual(`rs~${" ".repeat(1000)}`)
})

test("encode lists", () => {
  // First encode non-counted lists
  expect(stringify([])).toEqual("[]")
  expect(stringify([0])).toEqual("[.]")
  expect(stringify([0, true])).toEqual("[.T]")
  expect(stringify([0, true, false])).toEqual("[.TF]")
  expect(stringify([1, 2, 3])).toEqual("[2.4.6.]")
  expect(stringify(["🚀🎲"])).toEqual("[4~🚀🎲]")
  expect(stringify([[]])).toEqual("[[]]")
  expect(stringify([[[]]])).toEqual("[[[]]]")
  expect(stringify([[[]], [[], []], [[], [], []]])).toEqual("[[[]][[][]][[][][]]]")
})

test("encode objects and maps", () => {
  const complexMap = new Map<unknown, unknown>([
    [true, 0],
    [false, 1],
    [null, 2],
    [[], 3],
    [{}, 4],
    [5, "five"],
  ])
  // First encode non-counted objects
  expect(stringify({})).toEqual("{}")
  expect(stringify({ a: 0 })).toEqual("{a'.}")
  expect(stringify({ a: 0, b: true })).toEqual("{a'.b'T}")
  expect(stringify({ a: 0, b: true, c: {} })).toEqual("{a'.b'Tc'{}}")
  expect(stringify({ a: "🚀🎲" })).toEqual("{a'4~🚀🎲}")
  expect(stringify(new Map())).toEqual("{}")
  expect(stringify(new Map([[1, 2]]))).toEqual("{2.4.}")
  expect(stringify(complexMap)).toEqual("{T.F2.N4.[]6.{}8.a.five'}")
})

const fruit = [
  { color: "red", fruits: ["apple", "strawberry"] },
  { color: "green", fruits: ["apple"] },
  { color: "yellow", fruits: ["apple", "banana"] },
  { color: "orange", fruits: ["orange"] },
]

test("encode duplicate values", () => {
  const l = new Array(35).fill(-2048)
  expect(stringify(l)).toEqual("35r.[***********************************]")

  expect(stringify(fruit)).toEqual(
    "color'fruits'apple'orange'[{*red'1*[2*strawberry']}{*green'1*[2*]}{*yellow'1*[2*banana']}{*3*1*[3*]}]",
  )
})

test("skip whitespace", () => {
  expect(skipWhitespace("  \t\n\r", 0)).toEqual(5)
  expect(skipWhitespace("  {  }  ", 0)).toEqual(2)
  expect(skipWhitespace("  {  }  ", 2)).toEqual(2)
  expect(skipWhitespace("  {  }  ", 3)).toEqual(5)
  expect(skipWhitespace("  {  }  ", 5)).toEqual(5)
  expect(skipWhitespace("  {  }  ", 6)).toEqual(8)
  expect(skipWhitespace("  /*{  }*/  ", 0)).toEqual(12)
  expect(skipWhitespace("  /*{  }*/X ", 0)).toEqual(10)
  expect(skipWhitespace("  /*{  }*/X ", 10)).toEqual(10)
  expect(skipWhitespace("  /*{  }*/X ", 11)).toEqual(12)
  expect(skipWhitespace(" X/*{  }*/  ", 0)).toEqual(1)
  expect(skipWhitespace(" X/*{  }*/  ", 1)).toEqual(1)
  expect(skipWhitespace(" X/*{  }*/  ", 2)).toEqual(12)
  expect(skipWhitespace(" X/*{  }*/X ", 2)).toEqual(10)
  expect(skipWhitespace(" X/*{  }*/X ", 10)).toEqual(10)
  expect(skipWhitespace(" X/*{  }*/X ", 11)).toEqual(12)
  expect(skipWhitespace(" X/*{  }*/X ", 12)).toEqual(12)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 0)).toEqual(8)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 8)).toEqual(8)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 9)).toEqual(10)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 16)).toEqual(16)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 17)).toEqual(18)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 18)).toEqual(18)
  expect(skipWhitespace("// test\n{ colors' [ red' green' blue ] }", 19)).toEqual(20)
})

test("skip B36", () => {
  expect(skipB36("dead", 0)).toEqual(4)
  expect(skipB36("dead ", 0)).toEqual(4)
  expect(skipB36("dead'", 0)).toEqual(4)
  expect(skipB36(" dead'", 0)).toEqual(0)
  expect(skipB36(" dead'", 1)).toEqual(5)
})

test("decode B36 strings", () => {
  expect(parseBigB36("0", 0, 0)).toEqual(0n)
  expect(parseBigB36("0", 0, 1)).toEqual(0n)
  expect(parseBigB36("1", 0, 1)).toEqual(1n)
  expect(parseBigB36("9", 0, 1)).toEqual(9n)
  expect(parseBigB36("a", 0, 1)).toEqual(10n)
  expect(parseBigB36("z", 0, 1)).toEqual(35n)
  expect(parseBigB36("10", 0, 2)).toEqual(36n)
  expect(parseBigB36("this", 0, 4)).toEqual(1375732n)
  expect(parseBigB36("is", 0, 2)).toEqual(676n)
  expect(parseBigB36("strange", 0, 7)).toEqual(62749271102n)
  expect(parseBigB36("helloworld", 0, 10)).toEqual(1767707668033969n)
})

test("decode integers", () => {
  expect(parse(".")).toEqual(0)
  expect(parse("2.")).toEqual(1)
  expect(parse("o.")).toEqual(12)
  expect(parse("6u.")).toEqual(123)
  expect(parse("1wk.")).toEqual(1234)
  expect(parse("j1u.")).toEqual(12345)
  expect(parse("5aio.")).toEqual(123456)
  expect(parse("1gx72.")).toEqual(1234567)
  expect(parse("ep7z0.")).toEqual(12345678)
  expect(parse("4307qi.")).toEqual(123456789)
  expect(parse("14u25d0.")).toEqual(1234567890)
  expect(parse("this.")).toEqual(687866)
  expect(parse("is.")).toEqual(338)
  expect(parse("strange.")).toEqual(31374635551)
  expect(parse("helloworld.")).toEqual(-883853834016985)
  expect(parse("jitolovesbignumbers.")).toEqual(100683761859705616735460904644n)
  expect(parse("zzzzzzzzzzzzzzzzzzzz.")).toEqual(36n ** 20n / -2n)
  expect(parse("zzzzzzzzzzzzzzzzzzz.")).toEqual(36n ** 19n / -2n)
  expect(parse("zzzzzzzzzzzzzzzzzz.")).toEqual(36n ** 18n / -2n)
  expect(parse("zzzzzzzzzzzzzzzzz.")).toEqual(36n ** 17n / -2n)
  expect(parse("zzzzzzzzzzzzzzzz.")).toEqual(36n ** 16n / -2n)
  expect(parse("zzzzzzzzzzzzzzz.")).toEqual(36n ** 15n / -2n)
  expect(parse("zzzzzzzzzzzzzz.")).toEqual(36n ** 14n / -2n)
  expect(parse("zzzzzzzzzzzzz.")).toEqual(36n ** 13n / -2n)
  expect(parse("zzzzzzzzzzzz.")).toEqual(36n ** 12n / -2n)
  expect(parse("zzzzzzzzzzz.")).toEqual(36n ** 11n / -2n)
  expect(parse("zzzzzzzzzz.")).toEqual(36 ** 10 / -2)
  expect(parse("zzzzzzzzz.")).toEqual(36 ** 9 / -2)
  expect(parse("zzzzzzzz.")).toEqual(36 ** 8 / -2)
  expect(parse("zzzzzzz.")).toEqual(36 ** 7 / -2)
  expect(parse("zzzzzz.")).toEqual(36 ** 6 / -2)
  expect(parse("zzzzz.")).toEqual(36 ** 5 / -2)
  expect(parse("zzzz.")).toEqual(36 ** 4 / -2)
  expect(parse("zzz.")).toEqual(36 ** 3 / -2)
  expect(parse("zz.")).toEqual(36 ** 2 / -2)
  expect(parse("z.")).toEqual(36 / -2)
  expect(parse(".")).toEqual(0)
  expect(parse("4xdkkfek4xp.")).toEqual(Number.MIN_SAFE_INTEGER)
  expect(parse("2gosa7pa2gv.")).toEqual(Number.MIN_SAFE_INTEGER / 2 - 1)
  expect(parse("18ce53un18f.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 2)
  expect(parse("4xdkkfek4xq.")).toEqual(Number.MAX_SAFE_INTEGER)
  expect(parse("2gosa7pa2gw.")).toEqual(Number.MAX_SAFE_INTEGER / 2 + 1)
})

test("decode b36 strings", () => {
  expect(parse("short'")).toEqual("short")
  expect(parse("1234'")).toEqual("1234")
  // Leading zeroes are preserved
  expect(parse("01234'")).toEqual("01234")
  expect(parse("12345678'")).toEqual("12345678")
  expect(parse("123456789'")).toEqual("123456789")
  expect(parse("thisislong'")).toEqual("thisislong")
})

test("decode decimals", () => {
  expect(parse("1:2.")).toEqual(0.1)
  expect(parse("1:1.")).toEqual(-0.1)
  expect(parse("1:5m.")).toEqual(10.1)
  expect(parse("1:5l.")).toEqual(-10.1)
  expect(parse("k:2.")).toEqual(1e10)
  expect(parse("k:1.")).toEqual(-1e10)
  expect(parse("j:2.")).toEqual(1e-10)
  expect(parse("j:1.")).toEqual(-1e-10)
  expect(parse("5:6u.")).toEqual(0.123)
  expect(parse("b:5aio.")).toEqual(0.123456)
  expect(parse("h:4307qi.")).toEqual(0.123456789)
  expect(parse("b:4307qi.")).toEqual(123.456789)
  expect(parse("5:4307qi.")).toEqual(123456.789)
  expect(parse("c:4307qi.")).toEqual(123456789e6)
  expect(parse("i:4307qi.")).toEqual(123456789e9)
  expect(parse("13:4307qi.")).toEqual(123456789e-20)
  expect(parse("14:4307qi.")).toEqual(123456789e20)
  expect(parse("27:4307qi.")).toEqual(123456789e-40)
  expect(parse("28:4307qi.")).toEqual(123456789e40)
  expect(parse("4f:4307qi.")).toEqual(123456789e-80)
  expect(parse("4g:4307qi.")).toEqual(123456789e80)
  expect(parse("8v:4307qi.")).toEqual(123456789e-160)
  expect(parse("8w:4307qi.")).toEqual(123456789e160)
  expect(parse("hr:4307qi.")).toEqual(123456789e-320)
  expect(parse("v:5gwp6gq0542.")).toEqual(10000 / 10001)
  expect(parse("v:5gva5mhkite.")).toEqual(10000 / 10003)
  expect(parse("v:5gsg65bcv6m.")).toEqual(10000 / 10007)
  expect(parse("t:1pv7bhcuvcy.")).toEqual(Math.PI)
  expect(parse("t:1pv7bhcuvcx.")).toEqual(-Math.PI)
  expect(parse("t:1hj3mv5exxm.")).toEqual(Math.E)
  expect(parse("t:1hj3mv5exxl.")).toEqual(-Math.E)
  expect(parse("v:7qhxqtyhv68.")).toEqual(Math.SQRT2)
  expect(parse("v:7qhxqtyhv67.")).toEqual(-Math.SQRT2)
  expect(parse("g8:9u0kwi4pqi1.")).toEqual(-Number.MAX_VALUE)
  expect(parse("g8:9u0kwi4pqi2.")).toEqual(Number.MAX_VALUE)
  expect(parse("hz:9.")).toEqual(-Number.MIN_VALUE)
  expect(parse("hz:a.")).toEqual(Number.MIN_VALUE)
})

test("decode primitives", () => {
  expect(parse("T")).toEqual(true)
  expect(parse("F")).toEqual(false)
  expect(parse("N")).toBeNull()
})

test("decode strings", () => {
  expect(parse("~")).toEqual("")
  expect(parse("1~a")).toEqual("a")
  expect(parse("2~ab")).toEqual("ab")
  expect(parse("3~abc")).toEqual("abc")
  expect(parse("4~🚀🎲")).toEqual("🚀🎲")
  expect(parse("6~👶OM🍼")).toEqual("👶OM🍼")
  expect(parse(`a~${" ".repeat(10)}`)).toEqual(" ".repeat(10))
  expect(parse(`2s~${" ".repeat(100)}`)).toEqual(" ".repeat(100))
  expect(parse(`rs~${" ".repeat(1000)}`)).toEqual(" ".repeat(1000))
})

test("decode lists", () => {
  expect(parse("[]")).toEqual([])
  expect(parse("[.]")).toEqual([0])
  expect(parse("[.T]")).toEqual([0, true])
  expect(parse("[.TF]")).toEqual([0, true, false])
  expect(parse("[2.4.6.]")).toEqual([1, 2, 3])
  expect(parse("[4~🚀🎲]")).toEqual(["🚀🎲"])
  expect(parse("[[]]")).toEqual([[]])
  expect(parse("[[[]]]")).toEqual([[[]]])
  expect(parse("[[[]][[][]][[][][]]]")).toEqual([[[]], [[], []], [[], [], []]])
})

test("decode lists with whitespace", () => {
  expect(parse(" [ . ] ")).toEqual([0])
  expect(parse(" [ . T ] ")).toEqual([0, true])
  expect(parse(" [ . T F ] ")).toEqual([0, true, false])
  expect(parse(" [ 2. 4. 6. ] ")).toEqual([1, 2, 3])
  expect(parse("[\n  [ ]\n]")).toEqual([[]])
  expect(parse("// nested arrays\n[\n  [\n    [ ]\n  ]\n]\n")).toEqual([[[]]])
})

test("decode maps", () => {
  expect(parse("{}")).toEqual({})
  expect(parse("{a'.}")).toEqual({ a: 0 })
  expect(parse("{a'.b'T}")).toEqual({ a: 0, b: true })
  expect(parse("{a'.b'Tc'{}}")).toEqual({ a: 0, b: true, c: {} })
  expect(parse("{2.4.}")).toEqual(new Map([[1, 2]]))
  expect(parse("{T.F2.N4.[]6.{}8.a.five'}")).toEqual(
    new Map([
      [true, 0],
      [false, 1],
      [null, 2],
      [[], 3],
      [{}, 4],
      [5, "five"],
    ]),
  )
})

test("decode references", () => {
  // Only return the last value
  expect(parse("one'two'three'")).toEqual("three")
  // Grab the first value
  expect(parse("one'two'*")).toEqual("one")
  // Grab the second value
  expect(parse("one'two'1*")).toEqual("two")
  // Each value can reference the value before it
  expect(parse("[one'][*two'][1*three'][2*1**]")).toEqual([[[["one"], "two"], "three"], [["one"], "two"], ["one"]])
})

test("encode and decode with external dictionaries", () => {
  // Define some shared datasets
  const names = ["Alice", "Bob", "Eve"]
  const fruits = ["apple", "banana", "cherry"]

  // Create a large sample doc that uses these and has other duplicated values apart from these.
  const doc = {
    people: {
      xx12: { name: "Alice", age: 30, fruits: ["apple", "banana"] },
      xx34: { name: "Bob", age: 40, fruits: ["banana", "cherry"] },
      xx56: { name: "Eve", age: 50, fruits: ["cherry", "apple", "peach"] },
    },
  }

  const encoded = stringify(doc)
  expect(encoded).toEqual(
    "name'age'fruits'apple'banana'cherry'{people'{xx12'{*5~Alice1*1o.2*[3*4*]}xx34'{*3~Bob1*28.2*[4*5*]}xx56'{*3~Eve1*2s.2*[5*3*peach']}}}",
  )
  expect(parse(encoded)).toEqual(doc)

  const encodedWithNames = stringify(doc, { dictionaries: { names } })
  expect(encodedWithNames).toEqual(
    "name'age'fruits'apple'banana'cherry'names@{people'{xx12'{*6*1*1o.2*[3*4*]}xx34'{*7*1*28.2*[4*5*]}xx56'{*8*1*2s.2*[5*3*peach']}}}",
  )
  expect(parse(encodedWithNames, { dictionaries: { names } })).toEqual(doc)

  const encodedWithFruits = stringify(doc, { dictionaries: { fruits } })
  expect(encodedWithFruits).toEqual(
    "name'age'fruits'fruits@{people'{xx12'{*5~Alice1*1o.2*[3*4*]}xx34'{*3~Bob1*28.2*[4*5*]}xx56'{*3~Eve1*2s.2*[5*3*peach']}}}",
  )
  expect(parse(encodedWithFruits, { dictionaries: { fruits } })).toEqual(doc)

  const encodedWithBoth = stringify(doc, { dictionaries: { names, fruits } })
  expect(encodedWithBoth).toEqual(
    "name'age'fruits'names@fruits@{people'{xx12'{*3*1*1o.2*[6*7*]}xx34'{*4*1*28.2*[7*8*]}xx56'{*5*1*2s.2*[8*6*peach']}}}",
  )
  expect(parse(encodedWithBoth, { dictionaries: { names, fruits } })).toEqual(doc)
})

test("encode README values", () => {
  expect(stringify("banana")).toEqual("banana'")
  expect(stringify("Hi, World")).toEqual("9~Hi, World")
  expect(stringify("🍌")).toEqual("2~🍌")
  expect(stringify([1, 2, 3])).toEqual("[2.4.6.]")
  expect(stringify([100, 100, 100])).toEqual("5k.[***]")
  expect(stringify({ a: 1, b: 2, c: 3 })).toEqual("{a'2.b'4.c'6.}")
  expect(stringify([{ name: "Alice" }, { name: "Bob" }])).toEqual("name'[{*5~Alice}{*3~Bob}]")
  expect(
    stringify({
      name: "JSONito",
      nickname: "Little Jito",
      new: true,
      magic: 42,
      colors: [..."🟥🟧🟨🟩🟦🟪"],
    }),
  ).toEqual("{name'7~JSONitonickname'b~Little Jitonew'Tmagic'2c.colors'[2~🟥2~🟧2~🟨2~🟩2~🟦2~🟪]}")

  const sampleDoc = {
    person: {
      name: "John Doe",
      age: 30,
      id: 12345,
      "ai-generated": true,
    },
    list: [1, 2, 3, 4, 5],
    nested: {
      key: "value",
      nested: {
        key: "value",
      },
    },
  }

  const encoded1 = stringify(sampleDoc)
  expect(encoded1).toEqual(
    "nested'key'value'{person'{name'8~John Doeage'1o.id'j1u.c~ai-generatedT}list'[2.4.6.8.a.]*{1*2**{1*2*}}}",
  )

  const decoded1 = parse(encoded1)
  expect(decoded1).toEqual(sampleDoc)

  expect(stringify([100, 100, 100])).toEqual("5k.[***]")

  const doc = {
    method: "GET",
    scheme: "https",
    host: "example.com",
    port: 443,
    path: "/",
    headers: [
      ["accept", "application/json"],
      ["user-agent", "Mozilla/5.0"],
    ],
  }
  const basic = [
    "method",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "scheme",
    "http",
    "https",
    "host",
    "port",
    "path",
    "/",
    80,
    443,
    "headers",
    "accept",
    "user-agent",
    "application/json",
  ]

  expect(stringify(doc, { dictionaries: { basic } })).toEqual(
    "basic@{*1*5*7*8*b~example.com9*d*a*b*e*[[f*h*][g*b~Mozilla/5.0]]}",
  )

  // Some common values in an http response that
  // both sides know about (similar to HTTP2 HPACK)
  const opts: EncodeOptions = {
    dictionaries: {
      http: [
        "headers",
        "body",
        "Content-Length",
        "Content-Type",
        "application/json",
        "application/json; charset=utf-8",
        // Common status codes
        "status",
        200,
        404,
        308,
      ],
    },
  }

  const body = JSON.stringify({ hello: "world" })
  const httpResponse = {
    status: 200,
    headers: [
      ["Content-Type", "application/json"],
      ["Content-Length", body.length],
    ],
    body,
  }
  const encoded = stringify(httpResponse, opts)
  expect(encoded).toEqual('http@{6*7**[[3*4*][2*y.]]1*h~{"hello":"world"}}')
  const decoded = parse(encoded, opts)
  expect(decoded).toEqual(httpResponse)
})

test("encode README tables", () => {
  const samples: [string, string?, EncodeOptions?][] = [
    ["0", "Integers"],
    ["-1"],
    ["1"],
    ["-25"],
    ["2000"],
    ["-125000"],
    ["8654321"],
    ["20.24", "Decimal"],
    ["1e100"],
    ["-1e-200"],
    ["Math.PI"],
    ["Math.sqrt(3)"],
    ["true", "True"],
    ["false", "False"],
    ["null", "Null"],
    ["''", "Empty String"],
    ["'banana'", "B36 String"],
    ["'Hi, World'", "String"],
    ["'🍌'", "Unicode String"],
    ["[ 1, 2, 3 ] ", "Lists"],
    ["[ 100, 100, 100 ]", "Lists with Pointers"],
    ["{ a: 1, b: 2, c: 3 }", "Maps"],
    ["[ { name: 'Alice' }, { name: 'Bob' } ]", "Repeated Keys"],
    ["new Map([[1,2],[3,4]])", "Non-string Keys"],
  ]
  const table: string[] = []
  const opts: EncodeOptions = {}
  for (const [js, desc, newOpts] of samples) {
    if (newOpts) {
      Object.assign(opts, newOpts)
    }
    let json: string
    let val: unknown
    try {
      val = JSON.parse(js)
      json = js
    } catch (_) {
      // biome-ignore lint/security/noGlobalEval: <explanation>
      val = eval(`(${js})`)
      if (
        (typeof val === "number" && !Number.isFinite(val)) ||
        (val && typeof val === "object" && (val instanceof Map || ArrayBuffer.isView(val)))
      ) {
        json = ""
      } else {
        json = JSON.stringify(val)
      }
    }
    const encoded = stringify(val, opts)
    const input = `\`${js}\``
    const inter = json ? `\`${json}\`` : "N/A"
    const output = `\`${encoded}\``
    table.push(
      `| ${input.padStart(10)} |${inter.padStart(28)} | ${output.replace(/\|/g, "\\|").padEnd(28)} | ${(desc ?? "").padEnd(30)} |`,
    )
  }
  // biome-ignore lint/suspicious/noConsoleLog: Printed on purpose
  // biome-ignore lint/suspicious/noConsole: so that we can copy-paste into the README
  console.log(table.join("\n"))
  // biome-ignore lint/suspicious/noConsoleLog: Printed on purpose
  // biome-ignore lint/suspicious/noConsole: so that we can copy-paste into the README
  console.log(
    stringify({
      person: {
        name: "John Doe",
        age: 30,
        id: 12345,
        "ai-generated": true,
      },
      list: [1, 2, 3, 4, 5],
      nested: {
        key: "value",
        nested: {
          key: "value",
        },
      },
    }),
  )
})
