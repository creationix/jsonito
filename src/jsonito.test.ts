import { expect, test } from "bun:test"
import {
  // decoder functions
  stringify,
  encodeB64,
  encodeSignedB64,
  splitDecimal,
  // encoder functions
  skipWhitespace,
  skipB64,
  parseB64,
  parse,
  EncodeOptions,
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

test("encode B64 digits", () => {
  expect(encodeB64(0n)).toEqual("")
  expect(encodeB64(1n)).toEqual("1")
  expect(encodeB64(9n)).toEqual("9")
  expect(encodeB64(10n)).toEqual("a")
  expect(encodeB64(35n)).toEqual("z")
  expect(encodeB64(64n)).toEqual("10")
  expect(encodeB64(14488732n)).toEqual("This")
  expect(encodeB64(1180n)).toEqual("is")
  expect(encodeB64(1955739563022n)).toEqual("strange")
  expect(encodeB64(BigInt(Number.MAX_SAFE_INTEGER))).toEqual("v________")
  expect(encodeB64(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toEqual("w00000000")
  expect(encodeB64(BigInt(Number.MAX_SAFE_INTEGER) - 1n)).toEqual("v_______-")
  expect(encodeSignedB64(0n)).toEqual("")
  expect(encodeSignedB64(-1n)).toEqual("1")
  expect(encodeSignedB64(1n)).toEqual("2")
  expect(encodeSignedB64(-9n)).toEqual("h")
  expect(encodeSignedB64(9n)).toEqual("i")
  expect(encodeSignedB64(-10n)).toEqual("j")
  expect(encodeSignedB64(10n)).toEqual("k")
  expect(encodeSignedB64(-35n)).toEqual("15")
  expect(encodeSignedB64(35n)).toEqual("16")
  expect(encodeSignedB64(-64n)).toEqual("1_")
  expect(encodeSignedB64(64n)).toEqual("20")
  expect(encodeSignedB64(7244366n)).toEqual("This")
  expect(encodeSignedB64(590n)).toEqual("is")
  expect(encodeSignedB64(977869781511n)).toEqual("strange")
})

test("encode integers", () => {
  expect(stringify(0)).toEqual(".")
  expect(stringify(1)).toEqual("2.")
  expect(stringify(12)).toEqual("o.")
  expect(stringify(123)).toEqual("3S.")
  expect(stringify(1234)).toEqual("CA.")
  expect(stringify(12345)).toEqual("61O.")
  expect(stringify(123456)).toEqual("Yi0.")
  expect(stringify(1234567)).toEqual("9qQe.")
  expect(stringify(12345678)).toEqual("1ucas.")
  expect(stringify(123456789)).toEqual("eJVEG.")
  expect(stringify(1234567890)).toEqual("2jb0mA.")
  expect(stringify(-1)).toEqual("1.")
  expect(stringify(-12)).toEqual("n.")
  expect(stringify(-123)).toEqual("3R.")
  expect(stringify(-1234)).toEqual("Cz.")
  expect(stringify(-12345)).toEqual("61N.")
  expect(stringify(-123456)).toEqual("Yh_.")
  expect(stringify(-1234567)).toEqual("9qQd.")
  expect(stringify(-12345678)).toEqual("1ucar.")
  expect(stringify(-123456789)).toEqual("eJVEF.")
  expect(stringify(-1234567890)).toEqual("2jb0mz.")
  expect(stringify(1e10 - 1)).toEqual("iE5Yv-.")
  expect(stringify(1e11 - 1)).toEqual("2WgXs_-.")
  expect(stringify(1e12 - 1)).toEqual("t6Fix_-.")
  expect(stringify(1e13 - 1)).toEqual("4z2sVj_-.")
  expect(stringify(64n ** 1n)).toEqual("20.")
  expect(stringify(64n ** 2n)).toEqual("200.")
  expect(stringify(64n ** 3n)).toEqual("2000.")
  expect(stringify(64n ** 4n)).toEqual("20000.")
  expect(stringify(64n ** 5n)).toEqual("200000.")
  expect(stringify(64n ** 6n)).toEqual("2000000.")
  expect(stringify(64n ** 7n)).toEqual("20000000.")
  expect(stringify(64n ** 8n)).toEqual("200000000.")
  expect(stringify(64n ** 9n)).toEqual("2000000000.")
  expect(stringify(64n ** 10n)).toEqual("20000000000.")
  expect(stringify(64n ** 11n)).toEqual("200000000000.")
  expect(stringify(64n ** 12n)).toEqual("2000000000000.")
  expect(stringify(64n ** 13n)).toEqual("20000000000000.")
  expect(stringify(64n ** 14n)).toEqual("200000000000000.")
  expect(stringify(64n ** 15n)).toEqual("2000000000000000.")
  expect(stringify(64n ** 16n)).toEqual("20000000000000000.")
  expect(stringify(64n ** 17n)).toEqual("200000000000000000.")
  expect(stringify(64n ** 18n)).toEqual("2000000000000000000.")
  expect(stringify(64n ** 19n)).toEqual("20000000000000000000.")
  expect(stringify(64n ** 20n)).toEqual("200000000000000000000.")
  expect(stringify(64n ** 20n / -2n)).toEqual("____________________.")
  expect(stringify(64n ** 19n / -2n)).toEqual("___________________.")
  expect(stringify(64n ** 18n / -2n)).toEqual("__________________.")
  expect(stringify(64n ** 17n / -2n)).toEqual("_________________.")
  expect(stringify(64n ** 16n / -2n)).toEqual("________________.")
  expect(stringify(64n ** 15n / -2n)).toEqual("_______________.")
  expect(stringify(64n ** 14n / -2n)).toEqual("______________.")
  expect(stringify(64n ** 13n / -2n)).toEqual("_____________.")
  expect(stringify(64n ** 12n / -2n)).toEqual("____________.")
  expect(stringify(64n ** 11n / -2n)).toEqual("___________.")
  expect(stringify(64n ** 10n / -2n)).toEqual("__________.")
  expect(stringify(Number.MIN_SAFE_INTEGER)).toEqual("________Z.")
  expect(stringify(Number.MIN_SAFE_INTEGER / 2 - 1)).toEqual("v________.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 2)).toEqual("f________.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 4)).toEqual("7________.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 8)).toEqual("3________.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 16)).toEqual("1________.")
  expect(stringify((Number.MIN_SAFE_INTEGER / 2 - 1) / 32)).toEqual("________.")
  expect(stringify(Number.MAX_SAFE_INTEGER)).toEqual("________-.")
  expect(stringify(Number.MAX_SAFE_INTEGER / 2 + 1)).toEqual("w00000000.")
  expect(stringify((Number.MAX_SAFE_INTEGER / 2 + 1) / 2)).toEqual("g00000000.")
  expect(stringify((Number.MAX_SAFE_INTEGER / 2 + 1) / 4)).toEqual("800000000.")
  expect(stringify((Number.MAX_SAFE_INTEGER / 2 + 1) / 8)).toEqual("400000000.")
  expect(stringify((Number.MAX_SAFE_INTEGER / 2 + 1) / 16)).toEqual("200000000.")
  expect(stringify((Number.MAX_SAFE_INTEGER / 2 + 1) / 32)).toEqual("100000000.")
  expect(stringify(-1229782938247303441n)).toEqual("28y8y8y8y8x.")
  expect(stringify(1229782938247303441n)).toEqual("28y8y8y8y8y.")
  expect(stringify(-2459565876494606882n)).toEqual("4h4h4h4h4h3.")
  expect(stringify(2459565876494606882n)).toEqual("4h4h4h4h4h4.")
  expect(stringify(-4919131752989213764n)).toEqual("8y8y8y8y8y7.")
  expect(stringify(4919131752989213764n)).toEqual("8y8y8y8y8y8.")
  expect(stringify(-9223372036854775807n)).toEqual("f_________Z.")
  expect(stringify(9223372036854775807n)).toEqual("f_________-.")
  expect(stringify(-9223372036854775808n)).toEqual("f__________.")
  expect(stringify(0xfn)).toEqual("u.")
  expect(stringify(0xffn)).toEqual("7-.")
  expect(stringify(0xfffn)).toEqual("1_-.")
  expect(stringify(1926356574933776746956696518896066655086n)).toEqual("Jito_Loves_Big_Numbers.")
  expect(stringify(44955042304169399691320774807464170904322762751n)).toEqual("-_Jito_Loves_Big_Numbers_-.")
})

test("smart decimal integers", () => {
  expect(stringify(1)).toEqual("2.")
  expect(stringify(10)).toEqual("k.")
  expect(stringify(100)).toEqual("38.")
  expect(stringify(1000)).toEqual("vg.")
  expect(stringify(10000)).toEqual("4Uw.")
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
  expect(stringify(90)).toEqual("2Q.")
  expect(stringify(900)).toEqual("s8.")
  expect(stringify(9000)).toEqual("4pg.")
  expect(stringify(90000)).toEqual("HYw.")
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
  expect(stringify(10.1)).toEqual("1:3a.")
  expect(stringify(-10.1)).toEqual("1:39.")
  expect(stringify(1e-10)).toEqual("j:2.")
  expect(stringify(-1e-10)).toEqual("j:1.")
  expect(stringify(0.123)).toEqual("5:3S.")
  expect(stringify(0.123456)).toEqual("b:Yi0.")
  expect(stringify(0.123456789)).toEqual("h:eJVEG.")
  expect(stringify(123.456789)).toEqual("b:eJVEG.")
  expect(stringify(123456.789)).toEqual("5:eJVEG.")
  expect(stringify(123456789e9)).toEqual("i:eJVEG.")
  expect(stringify(123456789e-20)).toEqual("D:eJVEG.")
  expect(stringify(123456789e20)).toEqual("E:eJVEG.")
  expect(stringify(123456789e-40)).toEqual("1f:eJVEG.")
  expect(stringify(123456789e40)).toEqual("1g:eJVEG.")
  expect(stringify(123456789e-80)).toEqual("2v:eJVEG.")
  expect(stringify(123456789e80)).toEqual("2w:eJVEG.")
  expect(stringify(123456789e-160)).toEqual("4_:eJVEG.")
  expect(stringify(123456789e160)).toEqual("50:eJVEG.")
  expect(stringify(123456789e-320)).toEqual("9_:eJVEG.")
  expect(stringify(10000 / 10001)).toEqual("v:1731d28Rfw.")
  expect(stringify(10000 / 10003)).toEqual("v:17271eVjl0.")
  expect(stringify(10000 / 10007)).toEqual("v:170iK6cGvw.")
  expect(stringify(Math.PI)).toEqual("t:mkEokiJF2.") // 3.141592653589793
  expect(stringify(-Math.PI)).toEqual("t:mkEokiJF1.") // -3.141592653589793
  expect(stringify(Math.E)).toEqual("t:jk8qtAsha.") // 2.718281828459045
  expect(stringify(-Math.E)).toEqual("t:jk8qtAsh9.") // -2.718281828459045
  expect(stringify(Math.SQRT2)).toEqual("v:1Av6kkrUUg.") // 1.4142135623730951
  expect(stringify(-Math.SQRT2)).toEqual("v:1Av6kkrUUf.") // -1.4142135623730951
  expect(stringify(-Number.MAX_VALUE)).toEqual("98:1_KZz-nRVD.")
  expect(stringify(Number.MAX_VALUE)).toEqual("98:1_KZz-nRVE.")
  expect(stringify(-Number.MIN_VALUE)).toEqual("a7:9.")
  expect(stringify(Number.MIN_VALUE)).toEqual("a7:a.")
})

test("encode primitives", () => {
  expect(stringify(true)).toEqual("!")
  expect(stringify(false)).toEqual("F!")
  expect(stringify(null)).toEqual("N!")
  expect(() => stringify(undefined)).toThrow()
})

test("encode b64 strings", () => {
  expect(stringify("short")).toEqual("short'")
  expect(stringify("Dash-it")).toEqual("Dash-it'")
  expect(stringify("CAP_CASE")).toEqual("CAP_CASE'")
  expect(stringify("1234")).toEqual("1234'")
  // Leading zeros aren't supported
  expect(stringify("01234")).toEqual("5~01234")
  // strings longer than 8 chars aren't encoded in this version
  expect(stringify("12345678")).toEqual("12345678'")
  expect(stringify("123456789")).toEqual("9~123456789")
  expect(stringify("ThisIsLong")).toEqual("a~ThisIsLong")
})

test("encode strings", () => {
  expect(stringify("")).toEqual("~")
  expect(stringify(" ")).toEqual("1~ ")
  expect(stringify("Hi!")).toEqual("3~Hi!")
  expect(stringify("Goodbye.")).toEqual("8~Goodbye.")
  expect(stringify("1 2 3")).toEqual("5~1 2 3")
  expect(stringify("𐐡𐐰𐑌𐐼o")).toEqual("h~𐐡𐐰𐑌𐐼o")
  expect(stringify("🚀🎲")).toEqual("8~🚀🎲")
  expect(stringify("👶OM🍼")).toEqual("a~👶OM🍼")
  expect(stringify(" ".repeat(10))).toEqual(`a~${" ".repeat(10)}`)
  expect(stringify(" ".repeat(100))).toEqual(`1A~${" ".repeat(100)}`)
  expect(stringify(" ".repeat(1000))).toEqual(`fE~${" ".repeat(1000)}`)
})

test("encode lists", () => {
  // First encode non-counted lists
  expect(stringify([])).toEqual("[]")
  expect(stringify([0])).toEqual("[.]")
  expect(stringify([0, true])).toEqual("[.!]")
  expect(stringify([0, true, false])).toEqual("[.!F!]")
  expect(stringify([1, 2, 3])).toEqual("[2.4.6.]")
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
  expect(stringify({ a: 0, b: true })).toEqual("{a'.b'!}")
  expect(stringify({ a: 0, b: true, c: {} })).toEqual("{a'.b'!c'{}}")
  expect(stringify(new Map())).toEqual("{}")
  expect(stringify(new Map([[1, 2]]))).toEqual("{2.4.}")
  expect(stringify(complexMap)).toEqual("{!.F!2.N!4.[]6.{}8.a.five'}")
})

const fruit = [
  { color: "red", fruits: ["apple", "strawberry"] },
  { color: "green", fruits: ["apple"] },
  { color: "yellow", fruits: ["apple", "banana"] },
  { color: "orange", fruits: ["orange"] },
]

test("encode duplicate values", () => {
  const l = new Array(35).fill(-2048)
  expect(stringify(l)).toEqual("__.[***********************************]")

  expect(stringify(fruit)).toEqual(
    "color'fruits'apple'orange'[{*red'1*[2*a~strawberry]}{*green'1*[2*]}{*yellow'1*[2*banana']}{*3*1*[3*]}]",
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

test("skip B64", () => {
  expect(skipB64("dead", 0)).toEqual(4)
  expect(skipB64("dead ", 0)).toEqual(4)
  expect(skipB64("dead'", 0)).toEqual(4)
  expect(skipB64(" dead'", 0)).toEqual(0)
  expect(skipB64(" dead'", 1)).toEqual(5)
})

test("decode B64 strings", () => {
  expect(parseB64("0", 0, 0)).toEqual(0n)
  expect(parseB64("0", 0, 1)).toEqual(0n)
  expect(parseB64("1", 0, 1)).toEqual(1n)
  expect(parseB64("9", 0, 1)).toEqual(9n)
  expect(parseB64("a", 0, 1)).toEqual(10n)
  expect(parseB64("z", 0, 1)).toEqual(35n)
  expect(parseB64("A", 0, 1)).toEqual(36n)
  expect(parseB64("Z", 0, 1)).toEqual(61n)
  expect(parseB64("-", 0, 1)).toEqual(62n)
  expect(parseB64("_", 0, 1)).toEqual(63n)
  expect(parseB64("10", 0, 2)).toEqual(64n)
  expect(parseB64("This", 0, 4)).toEqual(14488732n)
  expect(parseB64("is", 0, 2)).toEqual(1180n)
  expect(parseB64("strange", 0, 7)).toEqual(1955739563022n)
  expect(parseB64("HelloWorld", 0, 10)).toEqual(778653614416704845n)
})

test("decode integers", () => {
  expect(parse(".")).toEqual(0)
  expect(parse("2.")).toEqual(1)
  expect(parse("o.")).toEqual(12)
  expect(parse("3S.")).toEqual(123)
  expect(parse("CA.")).toEqual(1234)
  expect(parse("61O.")).toEqual(12345)
  expect(parse("Yi0.")).toEqual(123456)
  expect(parse("9qQe.")).toEqual(1234567)
  expect(parse("1ucas.")).toEqual(12345678)
  expect(parse("eJVEG.")).toEqual(123456789)
  expect(parse("2jb0mA.")).toEqual(1234567890)
  expect(parse("This.")).toEqual(7244366)
  expect(parse("is.")).toEqual(590)
  expect(parse("strange.")).toEqual(977869781511)
  expect(parse("HelloWorld.")).toEqual(-389326807208352423n)
  expect(parse("Content-Type.")).toEqual(1415998886219925623591n)
  expect(parse("Accept-Encoding.")).toEqual(350012890167708495916995304n)
  expect(parse("Jito_Loves_Big_Numbers.")).toEqual(1926356574933776746956696518896066655086n)
  expect(parse("-_Jito_Loves_Big_Numbers_-.")).toEqual(44955042304169399691320774807464170904322762751n)
  expect(parse("____________________.")).toEqual(64n ** 20n / -2n)
  expect(parse("___________________.")).toEqual(64n ** 19n / -2n)
  expect(parse("__________________.")).toEqual(64n ** 18n / -2n)
  expect(parse("_________________.")).toEqual(64n ** 17n / -2n)
  expect(parse("________________.")).toEqual(64n ** 16n / -2n)
  expect(parse("_______________.")).toEqual(64n ** 15n / -2n)
  expect(parse("______________.")).toEqual(64n ** 14n / -2n)
  expect(parse("_____________.")).toEqual(64n ** 13n / -2n)
  expect(parse("____________.")).toEqual(64n ** 12n / -2n)
  expect(parse("___________.")).toEqual(64n ** 11n / -2n)
  expect(parse("__________.")).toEqual(64n ** 10n / -2n)
  expect(parse("_________.")).toEqual(64n ** 9n / -2n)
  expect(parse("________.")).toEqual(64 ** 8 / -2)
  expect(parse("_______.")).toEqual(64 ** 7 / -2)
  expect(parse("______.")).toEqual(64 ** 6 / -2)
  expect(parse("_____.")).toEqual(64 ** 5 / -2)
  expect(parse("____.")).toEqual(64 ** 4 / -2)
  expect(parse("___.")).toEqual(64 ** 3 / -2)
  expect(parse("__.")).toEqual(64 ** 2 / -2)
  expect(parse("_.")).toEqual(64 / -2)
  expect(parse(".")).toEqual(0)
  expect(parse("________Z.")).toEqual(Number.MIN_SAFE_INTEGER)
  expect(parse("v________.")).toEqual(Number.MIN_SAFE_INTEGER / 2 - 1)
  expect(parse("f________.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 2)
  expect(parse("7________.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 4)
  expect(parse("3________.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 8)
  expect(parse("1________.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 16)
  expect(parse("________.")).toEqual((Number.MIN_SAFE_INTEGER / 2 - 1) / 32)
  expect(parse("________-.")).toEqual(Number.MAX_SAFE_INTEGER)
  expect(parse("w00000000.")).toEqual(Number.MAX_SAFE_INTEGER / 2 + 1)
  expect(parse("g00000000.")).toEqual((Number.MAX_SAFE_INTEGER / 2 + 1) / 2)
  expect(parse("800000000.")).toEqual((Number.MAX_SAFE_INTEGER / 2 + 1) / 4)
  expect(parse("400000000.")).toEqual((Number.MAX_SAFE_INTEGER / 2 + 1) / 8)
  expect(parse("200000000.")).toEqual((Number.MAX_SAFE_INTEGER / 2 + 1) / 16)
  expect(parse("100000000.")).toEqual((Number.MAX_SAFE_INTEGER / 2 + 1) / 32)
})

test("decode b64 strings", () => {
  expect(parse("short'")).toEqual("short")
  expect(parse("Dash-it'")).toEqual("Dash-it")
  expect(parse("CAP_CASE'")).toEqual("CAP_CASE")
  expect(parse("1234'")).toEqual("1234")
  // Leading zeroes are preserved
  expect(parse("01234'")).toEqual("01234")
  expect(parse("12345678'")).toEqual("12345678")
  expect(parse("9~123456789")).toEqual("123456789")
  expect(parse("a~ThisIsLong")).toEqual("ThisIsLong")
})

test("decode decimals", () => {
  expect(parse("1:2.")).toEqual(0.1)
  expect(parse("1:1.")).toEqual(-0.1)
  expect(parse("1:3a.")).toEqual(10.1)
  expect(parse("1:39.")).toEqual(-10.1)
  expect(parse("k:2.")).toEqual(1e10)
  expect(parse("k:1.")).toEqual(-1e10)
  expect(parse("j:2.")).toEqual(1e-10)
  expect(parse("j:1.")).toEqual(-1e-10)
  expect(parse("5:3S.")).toEqual(0.123)
  expect(parse("b:Yi0.")).toEqual(0.123456)
  expect(parse("h:eJVEG.")).toEqual(0.123456789)
  expect(parse("b:eJVEG.")).toEqual(123.456789)
  expect(parse("5:eJVEG.")).toEqual(123456.789)
  expect(parse("c:eJVEG.")).toEqual(123456789e6)
  expect(parse("i:eJVEG.")).toEqual(123456789e9)
  expect(parse("D:eJVEG.")).toEqual(123456789e-20)
  expect(parse("E:eJVEG.")).toEqual(123456789e20)
  expect(parse("1f:eJVEG.")).toEqual(123456789e-40)
  expect(parse("1g:eJVEG.")).toEqual(123456789e40)
  expect(parse("2v:eJVEG.")).toEqual(123456789e-80)
  expect(parse("2w:eJVEG.")).toEqual(123456789e80)
  expect(parse("4_:eJVEG.")).toEqual(123456789e-160)
  expect(parse("50:eJVEG.")).toEqual(123456789e160)
  expect(parse("9_:eJVEG.")).toEqual(123456789e-320)
  expect(parse("v:1731d28Rfy.")).toEqual(10000 / 10001)
  expect(parse("v:17271eVjl2.")).toEqual(10000 / 10003)
  expect(parse("v:170iK6cGvu.")).toEqual(10000 / 10007)
  expect(parse("t:mkEokiJF2.")).toEqual(Math.PI)
  expect(parse("t:mkEokiJF1.")).toEqual(-Math.PI)
  expect(parse("t:jk8qtAsha.")).toEqual(Math.E)
  expect(parse("t:jk8qtAsh9.")).toEqual(-Math.E)
  expect(parse("v:1Av6kkrUUe.")).toEqual(Math.SQRT2)
  expect(parse("v:1Av6kkrUUd.")).toEqual(-Math.SQRT2)
  expect(parse("98:1_KZz-nRVF.")).toEqual(-Number.MAX_VALUE)
  expect(parse("98:1_KZz-nRVI.")).toEqual(Number.MAX_VALUE)
  expect(parse("a7:9.")).toEqual(-Number.MIN_VALUE)
  expect(parse("a7:a.")).toEqual(Number.MIN_VALUE)
})

test("decode primitives", () => {
  expect(parse("!")).toEqual(true)
  expect(parse("F!")).toEqual(false)
  expect(parse("N!")).toBeNull()
})

test("decode strings", () => {
  expect(parse("~")).toEqual("")
  expect(parse("1~a")).toEqual("a")
  expect(parse("2~ab")).toEqual("ab")
  expect(parse("3~abc")).toEqual("abc")
  expect(parse(`a~${" ".repeat(10)}`)).toEqual(" ".repeat(10))
  expect(parse(`1A~${" ".repeat(100)}`)).toEqual(" ".repeat(100))
  expect(parse(`fE~${" ".repeat(1000)}`)).toEqual(" ".repeat(1000))
})

test("decode lists", () => {
  expect(parse("[]")).toEqual([])
  expect(parse("[.]")).toEqual([0])
  expect(parse("[.!]")).toEqual([0, true])
  expect(parse("[.!F!]")).toEqual([0, true, false])
  expect(parse("[2.4.6.]")).toEqual([1, 2, 3])
  expect(parse("[[]]")).toEqual([[]])
  expect(parse("[[[]]]")).toEqual([[[]]])
  expect(parse("[[[]][[][]][[][][]]]")).toEqual([[[]], [[], []], [[], [], []]])
})

test("decode lists with whitespace", () => {
  expect(parse(" [ . ] ")).toEqual([0])
  expect(parse(" [ . ! ] ")).toEqual([0, true])
  expect(parse(" [ . ! F! ] ")).toEqual([0, true, false])
  expect(parse(" [ 2. 4. 6. ] ")).toEqual([1, 2, 3])
  expect(parse("[\n  [ ]\n]")).toEqual([[]])
  expect(parse("// nested arrays\n[\n  [\n    [ ]\n  ]\n]\n")).toEqual([[[]]])
})

test("decode maps", () => {
  expect(parse("{}")).toEqual({})
  expect(parse("{a'.}")).toEqual({ a: 0 })
  expect(parse("{a'.b'!}")).toEqual({ a: 0, b: true })
  expect(parse("{a'.b'!c'{}}")).toEqual({ a: 0, b: true, c: {} })
  expect(parse("{2.4.}")).toEqual(new Map([[1, 2]]))
  expect(parse("{!.F!2.N!4.[]6.{}8.a.five'}")).toEqual(
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
  expect(parse("One'Two'Three'")).toEqual("Three")
  // Grab the first value
  expect(parse("One'Two'*")).toEqual("One")
  // Grab the second value
  expect(parse("One'Two'1*")).toEqual("Two")
  // Each value can reference the value before it
  expect(parse("[One'][*Two'][1*Three'][2*1**]")).toEqual([[[["One"], "Two"], "Three"], [["One"], "Two"], ["One"]])
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
    "name'age'fruits'apple'banana'cherry'{people'{xx12'{*Alice'1*Y.2*[3*4*]}xx34'{*Bob'1*1g.2*[4*5*]}xx56'{*Eve'1*1A.2*[5*3*peach']}}}",
  )
  expect(parse(encoded)).toEqual(doc)

  const encodedWithNames = stringify(doc, { dictionaries: { names } })
  expect(encodedWithNames).toEqual(
    "name'age'fruits'apple'banana'cherry'names@{people'{xx12'{*6*1*Y.2*[3*4*]}xx34'{*7*1*1g.2*[4*5*]}xx56'{*8*1*1A.2*[5*3*peach']}}}",
  )
  expect(parse(encodedWithNames, { dictionaries: { names } })).toEqual(doc)

  const encodedWithFruits = stringify(doc, { dictionaries: { fruits } })
  expect(encodedWithFruits).toEqual(
    "name'age'fruits'fruits@{people'{xx12'{*Alice'1*Y.2*[3*4*]}xx34'{*Bob'1*1g.2*[4*5*]}xx56'{*Eve'1*1A.2*[5*3*peach']}}}",
  )
  expect(parse(encodedWithFruits, { dictionaries: { fruits } })).toEqual(doc)

  const encodedWithBoth = stringify(doc, { dictionaries: { names, fruits } })
  expect(encodedWithBoth).toEqual(
    "name'age'fruits'names@fruits@{people'{xx12'{*3*1*Y.2*[6*7*]}xx34'{*4*1*1g.2*[7*8*]}xx56'{*5*1*1A.2*[8*6*peach']}}}",
  )
  expect(parse(encodedWithBoth, { dictionaries: { names, fruits } })).toEqual(doc)
})

test("encode README values", () => {
  expect(stringify("Banana")).toEqual("Banana'")
  expect(stringify("Hi, World")).toEqual("9~Hi, World")
  expect(stringify("🍌")).toEqual("4~🍌")
  expect(stringify([1, 2, 3])).toEqual("[2.4.6.]")
  expect(stringify([100, 100, 100])).toEqual("38.[***]")
  expect(stringify({ a: 1, b: 2, c: 3 })).toEqual("{a'2.b'4.c'6.}")
  expect(stringify([{ name: "Alice" }, { name: "Bob" }])).toEqual("name'[{*Alice'}{*Bob'}]")

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
    "nested'key'value'{person'{name'8~John Doeage'Y.id'61O.c~ai-generated!}list'[2.4.6.8.a.]*{1*2**{1*2*}}}",
  )

  const decoded1 = parse(encoded1)
  expect(decoded1).toEqual(sampleDoc)

  expect(stringify([100, 100, 100])).toEqual("38.[***]")

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
    ["'Banana'", "B64 String"],
    ["'Hi, World'", "String"],
    ["'🍌'", "UTF-8 String"],
    ["[ 1, 2, 3] ", "Lists"],
    ["[ 100, 100, 100 ]", "Lists with Pointers"],
    ["{ a: 1, b: 2, c: 3 }", "Maps"],
    ["[ { name: 'Alice' }, { name: 'Bob' } ]", "Repeated Keys"],
    ["new Map([[1,2],[3,4]])", "Non-string Keys"],
    ["new Uint8Array([213,231,187])", "Bytes"],
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
