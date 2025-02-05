import { expect, test } from 'bun:test'
import { encodeVarint, encodeSignedVarint, splitDecimal } from './jsonito.ts'

test('splitDecimal', () => {
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

test('encode B64 digits', () => {
  expect(encodeVarint(0)).toEqual('')
  expect(encodeVarint(1)).toEqual('1')
  expect(encodeVarint(9)).toEqual('9')
  expect(encodeVarint(10)).toEqual('a')
  expect(encodeVarint(35)).toEqual('z')
  expect(encodeVarint(64)).toEqual('10')
  expect(encodeVarint(14488732)).toEqual('This')
  expect(encodeVarint(1180)).toEqual('is')
  expect(encodeVarint(1955739563022)).toEqual('strange')
  expect(encodeSignedVarint(0)).toEqual('')
  expect(encodeSignedVarint(-1)).toEqual('1')
  expect(encodeSignedVarint(1)).toEqual('2')
  expect(encodeSignedVarint(-9)).toEqual('h')
  expect(encodeSignedVarint(9)).toEqual('i')
  expect(encodeSignedVarint(-10)).toEqual('j')
  expect(encodeSignedVarint(10)).toEqual('k')
  expect(encodeSignedVarint(-35)).toEqual('15')
  expect(encodeSignedVarint(35)).toEqual('16')
  expect(encodeSignedVarint(-64)).toEqual('1_')
  expect(encodeSignedVarint(64)).toEqual('20')
  expect(encodeSignedVarint(7244366)).toEqual('This')
  expect(encodeSignedVarint(590)).toEqual('is')
  expect(encodeSignedVarint(977869781511)).toEqual('strange')
})

// test('decode B64 fixed-width', () => {
//   const input2 = new TextEncoder().encode('00010203102030')
//   expect(decodeB64(input2, 0, 2)).toEqual([0, 2])
//   expect(decodeB64(input2, 2, 4)).toEqual([1, 4])
//   expect(decodeB64(input2, 4, 6)).toEqual([2, 6])
//   expect(decodeB64(input2, 6, 8)).toEqual([3, 8])
//   expect(decodeB64(input2, 8, 10)).toEqual([64, 10])
//   expect(decodeB64(input2, 10, 12)).toEqual([128, 12])
//   expect(decodeB64(input2, 12, 14)).toEqual([192, 14])
//   expect(decodeB64(input2, 0, 4)).toEqual([1, 4])
// })

// test('encode integers', () => {
//   expect(stringify(0)).toEqual('+')
//   expect(stringify(1)).toEqual('2+')
//   expect(stringify(12)).toEqual('o+')
//   expect(stringify(123)).toEqual('3S+')
//   expect(stringify(1234)).toEqual('CA+')
//   expect(stringify(12345)).toEqual('61O+')
//   expect(stringify(123456)).toEqual('Yi0+')
//   expect(stringify(1234567)).toEqual('9qQe+')
//   expect(stringify(12345678)).toEqual('1ucas+')
//   expect(stringify(123456789)).toEqual('eJVEG+')
//   expect(stringify(1234567890)).toEqual('2jb0mA+')
//   expect(stringify(-1)).toEqual('1+')
//   expect(stringify(-12)).toEqual('n+')
//   expect(stringify(-123)).toEqual('3R+')
//   expect(stringify(-1234)).toEqual('Cz+')
//   expect(stringify(-12345)).toEqual('61N+')
//   expect(stringify(-123456)).toEqual('Yh_+')
//   expect(stringify(-1234567)).toEqual('9qQd+')
//   expect(stringify(-12345678)).toEqual('1ucar+')
//   expect(stringify(-123456789)).toEqual('eJVEF+')
//   expect(stringify(-1234567890)).toEqual('2jb0mz+')
//   expect(stringify(1e10 - 1)).toEqual('iE5Yv-+')
//   expect(stringify(1e11 - 1)).toEqual('2WgXs_-+')
//   expect(stringify(1e12 - 1)).toEqual('t6Fix_-+')
//   expect(stringify(1e13 - 1)).toEqual('4z2sVj_-+')
//   expect(stringify(64n ** 1n)).toEqual('20+')
//   expect(stringify(64n ** 2n)).toEqual('200+')
//   expect(stringify(64n ** 3n)).toEqual('2000+')
//   expect(stringify(64n ** 4n)).toEqual('20000+')
//   expect(stringify(64n ** 5n)).toEqual('200000+')
//   expect(stringify(64n ** 6n)).toEqual('2000000+')
//   expect(stringify(64n ** 7n)).toEqual('20000000+')
//   expect(stringify(64n ** 8n)).toEqual('200000000+')
//   expect(stringify(64n ** 9n)).toEqual('2000000000+')
//   expect(stringify(64n ** 10n)).toEqual('20000000000+')
//   expect(stringify(64n ** 11n)).toEqual('200000000000+')
//   expect(stringify(64n ** 12n)).toEqual('2000000000000+')
//   expect(stringify(64n ** 13n)).toEqual('20000000000000+')
//   expect(stringify(64n ** 14n)).toEqual('200000000000000+')
//   expect(stringify(64n ** 15n)).toEqual('2000000000000000+')
//   expect(stringify(64n ** 16n)).toEqual('20000000000000000+')
//   expect(stringify(64n ** 17n)).toEqual('200000000000000000+')
//   expect(stringify(64n ** 18n)).toEqual('2000000000000000000+')
//   expect(stringify(64n ** 19n)).toEqual('20000000000000000000+')
//   expect(stringify(64n ** 20n)).toEqual('200000000000000000000+')
// })

// test('encode rationals', () => {
//   expect(stringify(1 / 3)).toEqual('2|3/') // 0.3333333333333333
//   expect(stringify(-1 / 3)).toEqual('1|3/') // -0.3333333333333333
//   expect(stringify(1 / 7)).toEqual('2|7/') // 0.14285714285714285
//   expect(stringify(-1 / 7)).toEqual('1|7/') // -0.14285714285714285
//   expect(stringify(6 / 7)).toEqual('c|7/') // 0.8571428571428571
//   expect(stringify(-6 / 7)).toEqual('b|7/') // -0.8571428571428571
//   expect(stringify(22 / 7)).toEqual('I|7/') // 3.142857142857143
//   expect(stringify(12347 / 1234)).toEqual('61S|ji/') // 10.005672609400325
//   expect(stringify(1000 / 1001)).toEqual('vg|fF/')
//   expect(stringify(1 / 0)).toEqual('2|/') // Infinity
//   expect(stringify(-1 / 0)).toEqual('1|/') // -Infinity
//   expect(stringify(0 / 0)).toEqual('|/') // NaN
// })

// test('encode decimals', () => {
//   expect(stringify(0.1)).toEqual('2|1.')
//   expect(stringify(-0.1)).toEqual('1|1.')
//   expect(stringify(10.1)).toEqual('3a|1.')
//   expect(stringify(-10.1)).toEqual('39|1.')
//   expect(stringify(1e10)).toEqual('2|k.')
//   expect(stringify(-1e10)).toEqual('1|k.')
//   expect(stringify(1e-10)).toEqual('2|j.')
//   expect(stringify(-1e-10)).toEqual('1|j.')
//   expect(stringify(0.123)).toEqual('3S|5.')
//   expect(stringify(0.123456)).toEqual('Yi0|b.')
//   expect(stringify(0.123456789)).toEqual('eJVEG|h.')
//   expect(stringify(123.456789)).toEqual('eJVEG|b.')
//   expect(stringify(123456.789)).toEqual('eJVEG|5.')
//   expect(stringify(123456789e6)).toEqual('eJVEG|c.')
//   expect(stringify(123456789e9)).toEqual('eJVEG|i.')
//   expect(stringify(123456789e-20)).toEqual('eJVEG|D.')
//   expect(stringify(123456789e20)).toEqual('eJVEG|E.')
//   expect(stringify(123456789e-40)).toEqual('eJVEG|1f.')
//   expect(stringify(123456789e40)).toEqual('eJVEG|1g.')
//   expect(stringify(123456789e-80)).toEqual('eJVEG|2v.')
//   expect(stringify(123456789e80)).toEqual('eJVEG|2w.')
//   expect(stringify(123456789e-160)).toEqual('eJVEG|4_.')
//   expect(stringify(123456789e160)).toEqual('eJVEG|50.')
//   expect(stringify(123456789e-320)).toEqual('eJVEG|9_.')
//   expect(stringify(10000 / 10001)).toEqual('1731d28Rfy|v.')
//   expect(stringify(10000 / 10003)).toEqual('17271eVjl2|v.')
//   expect(stringify(10000 / 10007)).toEqual('170iK6cGvu|v.')
//   expect(stringify(Math.PI)).toEqual('mkEokiJF2|t.') // 3.141592653589793
//   expect(stringify(-Math.PI)).toEqual('mkEokiJF1|t.') // -3.141592653589793
//   expect(stringify(Math.E)).toEqual('jk8qtAsha|t.') // 2.718281828459045
//   expect(stringify(-Math.E)).toEqual('jk8qtAsh9|t.') // -2.718281828459045
//   expect(stringify(Math.SQRT2)).toEqual('1Av6kkrUUe|v.') // 1.4142135623730951
//   expect(stringify(-Math.SQRT2)).toEqual('1Av6kkrUUd|v.') // -1.4142135623730951
// })

// test('encode primitives', () => {
//   expect(stringify(true)).toEqual('!')
//   expect(stringify(false)).toEqual('~')
//   expect(stringify(null)).toEqual('?')
//   expect(() => stringify(undefined)).toThrow()
// })

// test('encode b64 strings', () => {
//   expect(stringify('short')).toEqual('short@')
//   expect(stringify('Dash-it')).toEqual('Dash-it@')
//   expect(stringify('CAP_CASE')).toEqual('CAP_CASE@')
//   expect(stringify('1234')).toEqual('1234@')
//   // Leading zeros aren't supported
//   expect(stringify('01234')).toEqual('5$01234')
//   // strings longer than 8 chars aren't encoded in this version
//   expect(stringify('12345678')).toEqual('12345678@')
//   expect(stringify('123456789')).toEqual('9$123456789')
//   expect(stringify('ThisIsLong')).toEqual('a$ThisIsLong')
// })

// test('encode strings', () => {
//   expect(stringify('')).toEqual('$')
//   expect(stringify(' ')).toEqual('1$ ')
//   expect(stringify('Hi!')).toEqual('3$Hi!')
//   expect(stringify('Goodbye.')).toEqual('8$Goodbye.')
//   expect(stringify('1 2 3')).toEqual('5$1 2 3')
//   expect(stringify('𐐡𐐰𐑌𐐼o')).toEqual('h$𐐡𐐰𐑌𐐼o')
//   expect(stringify('🚀🎲')).toEqual('8$🚀🎲')
//   expect(stringify(' '.repeat(10))).toEqual(`a$${' '.repeat(10)}`)
//   expect(stringify(' '.repeat(100))).toEqual(`1A$${' '.repeat(100)}`)
//   expect(stringify(' '.repeat(1000))).toEqual(`fE$${' '.repeat(1000)}`)
// })
// test('encode bytes', () => {
//   expect(stringify(new Uint8Array([]))).toEqual('=')
//   expect(stringify(new Uint8Array([0]))).toEqual('2=AA')
//   expect(stringify(new Uint8Array([0, 0]))).toEqual('3=AAA')
//   expect(stringify(new Uint8Array([0, 0, 0]))).toEqual('4=AAAA')
//   expect(stringify(new Uint8Array([0b00000100, 0b00100000, 0b11000100]))).toEqual('4=BCDE')
//   expect(stringify(new Uint8Array([0b00010000, 0b00110000, 0b10000001]))).toEqual('4=EDCB')
//   expect(stringify(new Uint8Array([1, 2, 3, 4]))).toEqual('6=AQIDBA')
//   expect(stringify(new Uint8Array(10).fill(32))).toEqual('e=ICAgICAgICAgIA')
//   expect(stringify(new Uint8Array(10).fill(127))).toEqual('e=f39_f39_f39_fw')
//   expect(stringify(new Uint8Array(1).fill(255))).toEqual('2=_w')
//   expect(stringify(new Uint8Array(2).fill(255))).toEqual('3=__8')
//   expect(stringify(new Uint8Array(3).fill(255))).toEqual('4=____')
//   expect(stringify(new Uint8Array(10).fill(255))).toEqual('e=_____________w')
//   expect(stringify(new Uint8Array(11).fill(255))).toEqual('f=______________8')
//   expect(stringify(new Uint8Array(12).fill(255))).toEqual('g=________________')
//   expect(stringify(new Uint8Array([0xde, 0xad, 0xbe, 0xef]).fill(32))).toEqual('6=ICAgIA')
//   expect(
//     stringify(
//       new Uint8Array([
//         104, 150, 20, 118, 229, 193, 27, 106, 101, 107, 122, 106, 221, 206, 20, 235, 28, 61, 49, 193, 234, 46, 2, 132,
//         197, 10, 144, 173, 173, 57, 118, 240, 212, 161, 41, 122, 139, 95, 121, 181, 175, 184, 89, 128, 29, 67, 179, 185,
//         183, 101, 162, 178, 149, 24, 37, 145, 110, 217, 231, 226, 192, 144, 240, 238, 68, 195, 180, 161, 60, 186, 45,
//         87, 48, 149, 213, 204, 145, 171, 130, 92, 191, 67, 28, 250, 12, 151, 167, 82, 30, 199, 213, 235, 12, 231, 90,
//         166, 242, 157, 87, 37,
//       ]),
//     ),
//   ).toEqual(
//     '26=aJYUduXBG2pla3pq3c4U6xw9McHqLgKExQqQra05dvDUoSl6i195ta-4WYAdQ7O5t2WispUYJZFu2efiwJDw7kTDtKE8ui1XMJXVzJGrgly_Qxz6DJenUh7H1esM51qm8p1XJQ',
//   )
// })

// test('encode lists', () => {
//   // First encode non-counted lists
//   const opts: EncodeOptions = { listCountedLimit: Infinity }
//   expect(stringify([], opts)).toEqual(';')
//   expect(stringify([0], opts)).toEqual('1;+')
//   expect(stringify([0, true], opts)).toEqual('2;+!')
//   expect(stringify([0, true, false], opts)).toEqual('3;+!~')
//   expect(stringify([1, 2, 3], opts)).toEqual('6;2+4+6+')
//   expect(stringify([[]], opts)).toEqual('1;;')
//   expect(stringify([[[]]], opts)).toEqual('3;1;;')
//   expect(stringify([[[]], [[], []], [[], [], []]], opts)).toEqual('c;1;;2;;;3;;;;')
//   // Then encode as counted lists
//   opts.listCountedLimit = -1
//   expect(stringify([], opts)).toEqual('|;')
//   expect(stringify([0], opts)).toEqual('1|1;+')
//   expect(stringify([0, true], opts)).toEqual('2|2;+!')
//   expect(stringify([0, true, false], opts)).toEqual('3|3;+!~')
//   expect(stringify([1, 2, 3], opts)).toEqual('6|3;2+4+6+')
//   expect(stringify([[]], opts)).toEqual('2|1;|;')
//   expect(stringify([[[]]], opts)).toEqual('6|1;2|1;|;')
//   expect(stringify([[[]], [[], []], [[], [], []]], opts)).toEqual('o|3;2|1;|;4|2;|;|;6|3;|;|;|;')
//   // Then encode with a partial limit
//   opts.listCountedLimit = 2
//   expect(stringify([], opts)).toEqual(';')
//   expect(stringify([0], opts)).toEqual('1;+')
//   expect(stringify([0, true], opts)).toEqual('2;+!')
//   expect(stringify([0, true, false], opts)).toEqual('3|3;+!~')
//   expect(stringify([1, 2, 3], opts)).toEqual('6|3;2+4+6+')
//   expect(stringify([[]], opts)).toEqual('1;;')
//   expect(stringify([[[]]], opts)).toEqual('3;1;;')
//   expect(stringify([[[]], [[], []], [[], [], []]], opts)).toEqual('e|3;1;;2;;;3|3;;;;')
//   // Encode pretty-printed
//   opts.prettyPrint = true
//   expect(stringify([], opts)).toEqual(';')
//   expect(stringify([0], opts)).toEqual('3;\n +')
//   expect(stringify([0, true], opts)).toEqual('6;\n +\n !')
//   expect(stringify([0, true, false], opts)).toEqual('9|3;\n +\n !\n ~')
//   expect(stringify([1, 2, 3], opts)).toEqual('c|3;\n 2+\n 4+\n 6+')
//   expect(stringify([[]], opts)).toEqual('3;\n ;')
//   expect(stringify([[[]]], opts)).toEqual('8;\n 4;\n  ;')
//   expect(stringify([[[]], [[], []], [[], [], []]], opts)).toEqual('C|3;\n 4;\n  ;\n 8;\n  ;\n  ;\n c|3;\n  ;\n  ;\n  ;')
// })

// test('encode objects and maps', () => {
//   const complexMap = new Map<unknown, unknown>([
//     [true, 0],
//     [false, 1],
//     [null, 2],
//     [[], 3],
//     [{}, 4],
//     [5, 'five'],
//   ])
//   // First encode non-counted objects
//   const opts: EncodeOptions = { mapCountedLimit: Infinity }
//   expect(stringify({}, opts)).toEqual(':')
//   expect(stringify({ a: 0 }, opts)).toEqual('3:a@+')
//   expect(stringify({ a: 0, b: true }, opts)).toEqual('6:a@+b@!')
//   expect(stringify({ a: 0, b: true, c: {} }, opts)).toEqual('9:a@+b@!c@:')
//   expect(stringify(new Map(), opts)).toEqual(':')
//   expect(stringify(new Map([[1, 2]]), opts)).toEqual('4:2+4+')
//   expect(stringify(complexMap, opts)).toEqual('l:!+~2+?4+;6+:8+a+five@')
//   // Then encode as counted (keys should come grouped together first)
//   opts.mapCountedLimit = -1
//   expect(stringify({}, opts)).toEqual('|:')
//   expect(stringify({ a: 0 }, opts)).toEqual('3|1:a@+')
//   expect(stringify({ a: 0, b: true }, opts)).toEqual('6|2:a@b@+!')
//   expect(stringify({ a: 0, b: true, c: {} }, opts)).toEqual('a|3:a@b@c@+!|:')
//   expect(stringify(new Map(), opts)).toEqual('|:')
//   expect(stringify(new Map([[1, 2]]), opts)).toEqual('4|1:2+4+')
//   expect(stringify(complexMap, opts)).toEqual('m|6:!~?;|:a++2+4+6+8+five@')
//   // Then encode with a sane limit
//   opts.mapCountedLimit = 1
//   expect(stringify({}, opts)).toEqual(':')
//   expect(stringify({ a: 0 }, opts)).toEqual('3:a@+')
//   expect(stringify({ a: 0, b: true }, opts)).toEqual('6|2:a@b@+!')
//   expect(stringify({ a: 0, b: true, c: {} }, opts)).toEqual('9|3:a@b@c@+!:')
//   expect(stringify(new Map(), opts)).toEqual(':')
//   expect(stringify(new Map([[1, 2]]), opts)).toEqual('4:2+4+')
//   expect(stringify(complexMap, opts)).toEqual('l|6:!~?;:a++2+4+6+8+five@')
//   // Encode pretty-printed
//   opts.prettyPrint = true
//   expect(stringify({}, opts)).toEqual(':')
//   expect(stringify({ a: 0 }, opts)).toEqual('6:\n a@ +')
//   expect(stringify({ a: 0, b: true }, opts)).toEqual('f|2:\n a@\n b@\n\n +\n !')
//   expect(stringify({ a: 0, b: true }, { ...opts, mapCountedLimit: Infinity })).toEqual('c:\n a@ +\n b@ !')
//   expect(stringify({ a: 0, b: true, c: {} }, opts)).toEqual('m|3:\n a@\n b@\n c@\n\n +\n !\n :')
//   expect(stringify(new Map(), opts)).toEqual(':')
//   expect(stringify(new Map([[1, 2]]), opts)).toEqual('7:\n 2+ 4+')
//   expect(stringify(complexMap, opts)).toEqual('K|6:\n !\n ~\n ?\n ;\n :\n a+\n\n +\n 2+\n 4+\n 6+\n 8+\n five@')
// })

// test('encode string chains', () => {
//   const opts: EncodeOptions = {
//     chainMinChars: 7,
//     // biome-ignore lint/performance/useTopLevelRegex: <explanation>
//     chainSplitter: /([^a-zA-Z0-9-_]*[a-zA-Z0-9-_]+)/,
//   }
//   expect(stringify('/segment/segment/segment', opts)).toEqual('d,1**8$/segment')
//   expect(stringify('/segment/o/n/e/segment', opts)).toEqual('k,8*6$/o/n/e8$/segment')
// })

// test('encode repeated values', () => {
//   const l = new Array(35).fill(-2048)
//   // This is big enough that __+ is duplicated once the pointer cost gets over 2 bytes
//   // We only want to use pointers if they are actually smaller.
//   expect(stringify(l)).toEqual('17|z;__+_*Z*X*V*T*R*P*N*L*J*H*F*D*B*z*x*v*t*r*p*n*l*j*h*f*d*b*9*7*5*3*1**__+')
// })

// const fruit = [
//   { color: 'red', fruits: ['apple', 'strawberry'] },
//   { color: 'green', fruits: ['apple'] },
//   { color: 'yellow', fruits: ['apple', 'banana'] },
// ]

// test('encode known values', () => {
//   expect(stringify(fruit)).toEqual(
//     '1l;o|2:I*M*red@e;U*a$strawberrye|2:g*k*green@2;q*z|2:color@fruits@yellow@d;apple@banana@',
//   )
//   const options: EncodeOptions = {
//     knownValues: [
//       'color',
//       'red',
//       'orange',
//       'yellow',
//       'green',
//       'blue',
//       'violet',
//       'fruits',
//       'apple',
//       'banana',
//       'strawberry',
//     ],
//   }
//   expect(stringify(fruit, options)).toEqual('H;b|2:&7&1&4;8&a&9|2:&7&4&2;8&b|2:&7&3&4;8&9&')
// })

// test('encode pretty-print', () => {
//   const options: EncodeOptions = {
//     prettyPrint: true,
//   }
//   expect(stringify({ int: 123, rational: 1 / 3, decimal: 1.23 }, options)).toEqual(
//     'K|3:\n int@\n rational@\n decimal@\n\n 3S+\n 2|3/\n 3S|3.',
//   )
//   expect(stringify({ bool: true, bool2: false, nil: null }, options)).toEqual(
//     'v|3:\n bool@\n bool2@\n nil@\n\n !\n ~\n ?',
//   )
//   expect(stringify({ obj: {}, arr: [], chain: 'repeat/repeat/repeat' }, options)).toEqual(
//     'M|3:\n obj@\n arr@\n chain@\n\n :\n ;\n h,repeat@*7$/repeat',
//   )
//   expect(stringify({ string: 'Hello', bytes: new Uint8Array([1, 2, 3]) }, options)).toEqual(
//     'y|2:\n string@\n bytes@\n\n Hello@\n 4=AQID',
//   )
//   expect(stringify(fruit, options)).toEqual(
//     '2p;\n M|2:\n  1l*\n  1o*\n\n  red@\n  n;\n   1u*\n   a$strawberry\n v|2:\n  w*\n  A*\n\n  green@\n  6;\n   F*\n U|2:\n  color@\n  fruits@\n\n  yellow@\n  l;\n   apple@\n   banana@',
//   )
// })

// test('encode binary', () => {
//   expect(encodeBinary(null)).toEqual(new Uint8Array([0]))
//   expect(encodeBinary(false)).toEqual(new Uint8Array([1]))
//   expect(encodeBinary(true)).toEqual(new Uint8Array([2]))
//   expect(encodeBinary(0)).toEqual(new Uint8Array([5]))
//   expect(encodeBinary(-1)).toEqual(new Uint8Array([21]))
//   expect(encodeBinary(1)).toEqual(new Uint8Array([37]))
//   expect(encodeBinary(-2)).toEqual(new Uint8Array([53]))
//   expect(encodeBinary(2)).toEqual(new Uint8Array([69]))
//   expect(encodeBinary(-3)).toEqual(new Uint8Array([85]))
//   expect(encodeBinary(3)).toEqual(new Uint8Array([101]))
//   expect(encodeBinary(-4)).toEqual(new Uint8Array([117]))
//   expect(encodeBinary(4)).toEqual(new Uint8Array([133, 1]))
//   expect(encodeBinary(5)).toEqual(new Uint8Array([165, 1]))
//   expect(encodeBinary(12)).toEqual(new Uint8Array([133, 3]))
//   expect(encodeBinary(123)).toEqual(new Uint8Array([229, 30]))
//   expect(encodeBinary(1234)).toEqual(new Uint8Array([197, 180, 2]))
//   expect(encodeBinary('')).toEqual(new Uint8Array([9]))
//   expect(encodeBinary('H')).toEqual(new Uint8Array([25, 72]))
//   expect(encodeBinary('Hi')).toEqual(new Uint8Array([41, 72, 105]))
//   expect(encodeBinary('Hello')).toEqual(new Uint8Array([89, 72, 101, 108, 108, 111]))
//   expect(encodeBinary('Greetings')).toEqual(new Uint8Array([153, 1, 71, 114, 101, 101, 116, 105, 110, 103, 115]))
//   expect(encodeBinary([], { listCountedLimit: Infinity })).toEqual(new Uint8Array([12]))
//   expect(encodeBinary([], { listCountedLimit: -Infinity })).toEqual(new Uint8Array([15, 12]))
//   expect(encodeBinary([1, 2, 3], { listCountedLimit: Infinity })).toEqual(new Uint8Array([60, 37, 69, 101]))
//   expect(encodeBinary([1, 2, 3], { listCountedLimit: -Infinity })).toEqual(new Uint8Array([63, 60, 37, 69, 101]))
//   expect(encodeBinary({ a: 1, b: 2, c: 3 }, { mapCountedLimit: Infinity })).toEqual(
//     new Uint8Array([157, 1, 25, 97, 37, 25, 98, 69, 25, 99, 101]),
//   )
//   expect(encodeBinary({ a: 1, b: 2, c: 3 }, { mapCountedLimit: -Infinity })).toEqual(
//     new Uint8Array([159, 1, 61, 25, 97, 25, 98, 25, 99, 37, 69, 101]),
//   )
//   expect(encodeBinary(fruit)).toEqual(
//     new Uint8Array([
//       156, 10, 143, 3, 45, 148, 5, 212, 5, 57, 114, 101, 100, 236, 1, 212, 6, 169, 1, 115, 116, 114, 97, 119, 98, 101,
//       114, 114, 121, 223, 1, 45, 228, 1, 164, 2, 89, 103, 114, 101, 101, 110, 44, 148, 3, 191, 4, 45, 89, 99, 111, 108,
//       111, 114, 105, 102, 114, 117, 105, 116, 115, 105, 121, 101, 108, 108, 111, 119, 220, 1, 89, 97, 112, 112, 108,
//       101, 105, 98, 97, 110, 97, 110, 97,
//     ]),
//   )
//   expect(encodeBinary(new Uint8Array([1, 2, 3, 4]))).toEqual(new Uint8Array([74, 1, 2, 3, 4]))
// })

// test('decode B64', () => {
//   const input = new TextEncoder().encode('+1+9+a+z+A+Z+-+_+10+11')
//   expect(decodeB64(input, 0)).toEqual([0, 0])
//   expect(decodeB64(input, 1)).toEqual([1, 2])
//   expect(decodeB64(input, 3)).toEqual([9, 4])
//   expect(decodeB64(input, 5)).toEqual([10, 6])
//   expect(decodeB64(input, 7)).toEqual([35, 8])
//   expect(decodeB64(input, 9)).toEqual([36, 10])
//   expect(decodeB64(input, 11)).toEqual([61, 12])
//   expect(decodeB64(input, 13)).toEqual([62, 14])
//   expect(decodeB64(input, 15)).toEqual([63, 16])
//   expect(decodeB64(input, 17)).toEqual([64, 19])
//   expect(decodeB64(input, 20)).toEqual([65, 22])
//   expect(decodeB64(new TextEncoder().encode('This'))).toEqual([14488732, 4])
//   expect(decodeB64(new TextEncoder().encode('is'))).toEqual([1180, 2])
//   expect(decodeB64(new TextEncoder().encode('strange'))).toEqual([1955739563022, 7])
//   expect(decodeB64(new TextEncoder().encode('HelloWorld'))).toEqual([778653614416704845n, 10])
// })

// test('decode integers', () => {
//   expect(parse('+')).toEqual(0)
//   expect(parse('2+')).toEqual(1)
//   expect(parse('o+')).toEqual(12)
//   expect(parse('3S+')).toEqual(123)
//   expect(parse('CA+')).toEqual(1234)
//   expect(parse('61O+')).toEqual(12345)
//   expect(parse('Yi0+')).toEqual(123456)
//   expect(parse('9qQe+')).toEqual(1234567)
//   expect(parse('1ucas+')).toEqual(12345678)
//   expect(parse('eJVEG+')).toEqual(123456789)
//   expect(parse('2jb0mA+')).toEqual(1234567890)
//   expect(parse('1+')).toEqual(-1)
//   expect(parse('n+')).toEqual(-12)
//   expect(parse('3R+')).toEqual(-123)
//   expect(parse('Cz+')).toEqual(-1234)
//   expect(parse('61N+')).toEqual(-12345)
//   expect(parse('Yh_+')).toEqual(-123456)
//   expect(parse('9qQd+')).toEqual(-1234567)
//   expect(parse('1ucar+')).toEqual(-12345678)
//   expect(parse('eJVEF+')).toEqual(-123456789)
//   expect(parse('2jb0mz+')).toEqual(-1234567890)
//   expect(parse('iE5Yv-+')).toEqual(1e10 - 1)
//   expect(parse('2WgXs_-+')).toEqual(1e11 - 1)
//   expect(parse('t6Fix_-+')).toEqual(1e12 - 1)
//   expect(parse('4z2sVj_-+')).toEqual(1e13 - 1)
//   expect(parse('20+')).toEqual(64 ** 1)
//   expect(parse('200+')).toEqual(64 ** 2)
//   expect(parse('2000+')).toEqual(64 ** 3)
//   expect(parse('20000+')).toEqual(64 ** 4)
//   expect(parse('200000+')).toEqual(64 ** 5)
//   expect(parse('2000000+')).toEqual(64 ** 6)
//   expect(parse('20000000+')).toEqual(64 ** 7)
//   expect(parse('200000000+')).toEqual(64 ** 8)
//   expect(parse('2000000000+')).toEqual(64n ** 9n)
//   expect(parse('20000000000+')).toEqual(64n ** 10n)
//   expect(parse('200000000000+')).toEqual(64n ** 11n)
//   expect(parse('2000000000000+')).toEqual(64n ** 12n)
//   expect(parse('20000000000000+')).toEqual(64n ** 13n)
//   expect(parse('200000000000000+')).toEqual(64n ** 14n)
//   expect(parse('2000000000000000+')).toEqual(64n ** 15n)
//   expect(parse('20000000000000000+')).toEqual(64n ** 16n)
//   expect(parse('200000000000000000+')).toEqual(64n ** 17n)
//   expect(parse('2000000000000000000+')).toEqual(64n ** 18n)
//   expect(parse('20000000000000000000+')).toEqual(64n ** 19n)
//   expect(parse('200000000000000000000+')).toEqual(64n ** 20n)
// })

// test('decode rationals', () => {
//   expect(parse('2|3/')).toEqual(1 / 3)
//   expect(parse('1|3/')).toEqual(-1 / 3)
//   expect(parse('2|7/')).toEqual(1 / 7)
//   expect(parse('1|7/')).toEqual(-1 / 7)
//   expect(parse('c|7/')).toEqual(6 / 7)
//   expect(parse('b|7/')).toEqual(-6 / 7)
//   expect(parse('I|7/')).toEqual(22 / 7)
//   expect(parse('61S|ji/')).toEqual(12347 / 1234)
//   expect(parse('vg|fF/')).toEqual(1000 / 1001)
//   expect(parse('2|/')).toEqual(1 / 0)
//   expect(parse('1|/')).toEqual(-1 / 0)
//   expect(parse('|/')).toBeNaN()
//   expect(() => parse('2|0$')).toThrow()
// })

// test('decode decimals', () => {
//   expect(parse('2|1.')).toEqual(0.1)
//   expect(parse('1|1.')).toEqual(-0.1)
//   expect(parse('3a|1.')).toEqual(10.1)
//   expect(parse('39|1.')).toEqual(-10.1)
//   expect(parse('2|k.')).toEqual(1e10)
//   expect(parse('1|k.')).toEqual(-1e10)
//   expect(parse('2|j.')).toEqual(1e-10)
//   expect(parse('1|j.')).toEqual(-1e-10)
//   expect(parse('3S|5.')).toEqual(0.123)
//   expect(parse('Yi0|b.')).toEqual(0.123456)
//   expect(parse('eJVEG|h.')).toEqual(0.123456789)
//   expect(parse('eJVEG|b.')).toEqual(123.456789)
//   expect(parse('eJVEG|5.')).toEqual(123456.789)
//   expect(parse('eJVEG|c.')).toEqual(123456789e6)
//   expect(parse('eJVEG|i.')).toEqual(123456789e9)
//   expect(parse('eJVEG|D.')).toEqual(123456789e-20)
//   expect(parse('eJVEG|E.')).toEqual(123456789e20)
//   expect(parse('eJVEG|1f.')).toEqual(123456789e-40)
//   expect(parse('eJVEG|1g.')).toEqual(123456789e40)
//   expect(parse('eJVEG|2v.')).toEqual(123456789e-80)
//   expect(parse('eJVEG|2w.')).toEqual(123456789e80)
//   expect(parse('eJVEG|4_.')).toEqual(123456789e-160)
//   expect(parse('eJVEG|50.')).toEqual(123456789e160)
//   expect(parse('eJVEG|9_.')).toEqual(123456789e-320)
//   expect(parse('1731d28Rfy|v.')).toEqual(10000 / 10001)
//   expect(parse('17271eVjl2|v.')).toEqual(10000 / 10003)
//   expect(parse('170iK6cGvu|v.')).toEqual(10000 / 10007)
//   expect(parse('mkEokiJF2|t.')).toEqual(Math.PI)
//   expect(parse('mkEokiJF1|t.')).toEqual(-Math.PI)
//   expect(parse('jk8qtAsha|t.')).toEqual(Math.E)
//   expect(parse('jk8qtAsh9|t.')).toEqual(-Math.E)
//   expect(parse('1Av6kkrUUe|v.')).toEqual(Math.SQRT2)
//   expect(parse('1Av6kkrUUd|v.')).toEqual(-Math.SQRT2)
// })

// test('decode primitives', () => {
//   expect(parse('!')).toEqual(true)
//   expect(parse('~')).toEqual(false)
//   expect(parse('?')).toBeNull()
// })

// test('decode b64 strings', () => {
//   expect(parse('short@')).toEqual('short')
//   expect(parse('Dash-it@')).toEqual('Dash-it')
//   expect(parse('CAP_CASE@')).toEqual('CAP_CASE')
//   expect(parse('1234@')).toEqual('1234')
//   expect(parse('12345@')).toEqual('12345')
//   expect(parse('123456@')).toEqual('123456')
//   expect(parse('1234567@')).toEqual('1234567')
//   expect(parse('12345678@')).toEqual('12345678')
//   // Decoder accepts leading zeroes and large strings even though the encoder doesn't
//   expect(parse('01234@')).toEqual('01234')
//   expect(parse('123456789@')).toEqual('123456789')
//   expect(parse('ThisIsLong@')).toEqual('ThisIsLong')
// })

// test('decode strings', () => {
//   expect(parse('$')).toEqual('')
//   expect(parse('1$a')).toEqual('a')
//   expect(parse('2$ab')).toEqual('ab')
//   expect(parse('3$abc')).toEqual('abc')
//   expect(parse(`a$${' '.repeat(10)}`)).toEqual(' '.repeat(10))
//   expect(parse(`1A$${' '.repeat(100)}`)).toEqual(' '.repeat(100))
//   expect(parse(`fE$${' '.repeat(1000)}`)).toEqual(' '.repeat(1000))
// })

// test('decode bytes', () => {
//   expect(parse('=')).toEqual(new Uint8Array([]))
//   expect(parse('2=AA')).toEqual(new Uint8Array([0]))
//   expect(parse('3=AAA')).toEqual(new Uint8Array([0, 0]))
//   expect(parse('4=AAAA')).toEqual(new Uint8Array([0, 0, 0]))
//   expect(parse('4=BCDE')).toEqual(new Uint8Array([0b00000100, 0b00100000, 0b11000100]))
//   expect(parse('4=EDCB')).toEqual(new Uint8Array([0b00010000, 0b00110000, 0b10000001]))
//   expect(parse('6=AQIDBA')).toEqual(new Uint8Array([1, 2, 3, 4]))
//   expect(parse('e=ICAgICAgICAgIA')).toEqual(new Uint8Array(10).fill(32))
//   expect(parse('e=f39_f39_f39_fw')).toEqual(new Uint8Array(10).fill(127))
//   expect(parse('2=_w')).toEqual(new Uint8Array(1).fill(255))
//   expect(parse('3=__8')).toEqual(new Uint8Array(2).fill(255))
//   expect(parse('4=____')).toEqual(new Uint8Array(3).fill(255))
//   expect(parse('e=_____________w')).toEqual(new Uint8Array(10).fill(255))
//   expect(parse('f=______________8')).toEqual(new Uint8Array(11).fill(255))
//   expect(parse('g=________________')).toEqual(new Uint8Array(12).fill(255))
//   expect(parse('6=ICAgIA')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]).fill(32))
//   expect(
//     parse(
//       '26=aJYUduXBG2pla3pq3c4U6xw9McHqLgKExQqQra05dvDUoSl6i195ta-4WYAdQ7O5t2WispUYJZFu2efiwJDw7kTDtKE8ui1XMJXVzJGrgly_Qxz6DJenUh7H1esM51qm8p1XJQ',
//     ),
//   ).toEqual(
//     new Uint8Array([
//       104, 150, 20, 118, 229, 193, 27, 106, 101, 107, 122, 106, 221, 206, 20, 235, 28, 61, 49, 193, 234, 46, 2, 132,
//       197, 10, 144, 173, 173, 57, 118, 240, 212, 161, 41, 122, 139, 95, 121, 181, 175, 184, 89, 128, 29, 67, 179, 185,
//       183, 101, 162, 178, 149, 24, 37, 145, 110, 217, 231, 226, 192, 144, 240, 238, 68, 195, 180, 161, 60, 186, 45, 87,
//       48, 149, 213, 204, 145, 171, 130, 92, 191, 67, 28, 250, 12, 151, 167, 82, 30, 199, 213, 235, 12, 231, 90, 166,
//       242, 157, 87, 37,
//     ]),
//   )
// })

// test('decode lists', () => {
//   // Decode uncounted lists
//   expect(parse(';')).toEqual([])
//   expect(parse('1;+')).toEqual([0])
//   expect(parse('2;+!')).toEqual([0, true])
//   expect(parse('3;+!~')).toEqual([0, true, false])
//   expect(parse('6;2+4+6+')).toEqual([1, 2, 3])
//   expect(parse('1;;')).toEqual([[]])
//   expect(parse('3;1;;')).toEqual([[[]]])
//   expect(parse('c;1;;2;;;3;;;;')).toEqual([[[]], [[], []], [[], [], []]])

//   // Decode always counted lists
//   expect(parse('|;')).toEqual([])
//   expect(parse('1|1;+')).toEqual([0])
//   expect(parse('2|2;+!')).toEqual([0, true])
//   expect(parse('3|3;+!~')).toEqual([0, true, false])
//   expect(parse('6|3;2+4+6+')).toEqual([1, 2, 3])
//   expect(parse('2|1;|;')).toEqual([[]])
//   expect(parse('6|1;2|1;|;')).toEqual([[[]]])
//   expect(parse('o|3;2|1;|;4|2;|;|;6|3;|;|;|;')).toEqual([[[]], [[], []], [[], [], []]])

//   // decode partially counted lists
//   expect(parse('e|3;1;;2;;;3|3;;;;')).toEqual([[[]], [[], []], [[], [], []]])

//   // decode pretty-printed lists
//   expect(parse('3;\n +')).toEqual([0])
//   expect(parse('6;\n +\n !')).toEqual([0, true])
//   expect(parse('9|3;\n +\n !\n ~')).toEqual([0, true, false])
//   expect(parse('c|3;\n 2+\n 4+\n 6+')).toEqual([1, 2, 3])
//   expect(parse('3;\n ;')).toEqual([[]])
//   expect(parse('8;\n 4;\n  ;')).toEqual([[[]]])
//   expect(parse('C|3;\n 4;\n  ;\n 8;\n  ;\n  ;\n c|3;\n  ;\n  ;\n  ;')).toEqual([[[]], [[], []], [[], [], []]])
// })

// test('decode objects and maps', () => {
//   const complexMap = new Map<unknown, unknown>([
//     [true, 0],
//     [false, 1],
//     [null, 2],
//     [[], 3],
//     [{}, 4],
//     [5, 'five'],
//   ])
//   // decode non-counted objects
//   expect(parse(':')).toEqual({})
//   expect(parse('3:a@+')).toEqual({ a: 0 })
//   expect(parse('6:a@+b@!')).toEqual({ a: 0, b: true })
//   expect(parse('9:a@+b@!c@:')).toEqual({ a: 0, b: true, c: {} })
//   expect(parse('4:2+4+')).toEqual(new Map([[1, 2]]))
//   expect(parse('l:!+~2+?4+;6+:8+a+five@')).toEqual(complexMap)
//   // decode counted objects
//   expect(parse('|:')).toEqual({})
//   expect(parse('3|1:a@+')).toEqual({ a: 0 })
//   expect(parse('6|2:a@b@+!')).toEqual({ a: 0, b: true })
//   expect(parse('a|3:a@b@c@+!|:')).toEqual({ a: 0, b: true, c: {} })
//   expect(parse('4|1:2+4+')).toEqual(new Map([[1, 2]]))
//   expect(parse('m|6:!~?;|:a++2+4+6+8+five@')).toEqual(complexMap)
//   // Decode with mixed limits
//   expect(parse('9|3:a@b@c@+!:')).toEqual({ a: 0, b: true, c: {} })
//   // Decode pretty-printed
//   expect(parse(':')).toEqual({})
//   expect(parse('6:\n a@ +')).toEqual({ a: 0 })
//   expect(parse('f|2:\n a@\n b@\n\n +\n !')).toEqual({ a: 0, b: true })
//   expect(parse('m|3:\n a@\n b@\n c@\n\n +\n !\n :')).toEqual({ a: 0, b: true, c: {} })
//   expect(parse('7:\n 2+ 4+')).toEqual(new Map([[1, 2]]))
//   expect(parse('K|6:\n !\n ~\n ?\n ;\n :\n a+\n\n +\n 2+\n 4+\n 6+\n 8+\n five@')).toEqual(complexMap)
// })

// test('decode pointers', () => {
//   expect(parse('*+')).toEqual(0)
//   expect(parse('2*  1+')).toEqual(-1)
//   expect(parse('2*  10+')).toEqual(32)
//   expect(parse('4*___+10+')).toEqual(32)
//   expect(parse('17;__+_*Z*X*V*T*R*P*N*L*J*H*F*D*B*z*x*v*t*r*p*n*l*j*h*f*d*b*9*7*5*3*1**__+')).toEqual(
//     new Array(35).fill(-2048),
//   )
// })

// test('decode string chains', () => {
//   expect(parse('d,1**8$/segment')).toEqual('/segment/segment/segment')
//   expect(parse('k,8*6$/o/n/e8$/segment')).toEqual('/segment/o/n/e/segment')
// })

// test('decode known values', () => {
//   expect(parse('1m;p:G*3$redO*e;U*a$strawberryf:f*5$greenl*2;r*E:5$color6$yellow6$fruitsf;5$apple6$banana')).toEqual(
//     fruit,
//   )
//   const options: DecodeOptions = {
//     knownValues: [
//       'color',
//       'red',
//       'orange',
//       'yellow',
//       'green',
//       'blue',
//       'violet',
//       'fruits',
//       'apple',
//       'banana',
//       'strawberry',
//     ],
//   }
//   expect(parse('B;b:&1&7&4;8&a&9:&4&7&2;8&b:&3&7&4;8&9&', options)).toEqual(fruit)
// })

// test('decode values with whitespace', () => {
//   expect(
//     parse(
//       '2n;\n M:\n  1h*\n  3$red\n  1o*\n  n;\n   1s*\n   a$strawberry\n v:\n  u*\n  5$green\n  A*\n  6;\n   F*\n Y:\n  5$color\n  6$yellow\n  6$fruits\n  n;\n   5$apple\n   6$banana',
//     ),
//   ).toEqual(fruit)
// })

// test('encode README values', () => {
//   expect(stringify('Banana')).toEqual('Banana@')
//   expect(stringify('Hi, World')).toEqual('9$Hi, World')
//   expect(stringify('🍌')).toEqual('4$🍌')
//   expect(stringify([1, 2, 3])).toEqual('6;2+4+6+')
//   expect(stringify([100, 100, 100])).toEqual('6;1**38+')
//   expect(stringify({ a: 1, b: 2, c: 3 })).toEqual('c|3:a@b@c@2+4+6+')
//   expect(stringify([{ name: 'Alice' }, { name: 'Bob' }])).toEqual('l;8:8*Alice@9:name@Bob@')

//   const sampleDoc = {
//     person: {
//       name: 'John Doe',
//       age: 30,
//       id: 12345,
//       'ai-generated': true,
//     },
//     list: [1, 2, 3, 4, 5],
//     nested: {
//       key: 'value',
//       nested: {
//         key: 'value',
//       },
//     },
//   }

//   const encoded1 = stringify(sampleDoc)
//   expect(encoded1).toEqual(
//     '1B|3:person@list@11*H|4:name@age@id@c$ai-generated8$John DoeY+61O+!a;2+4+6+8+a+n|2:b*nested@6*a:key@value@',
//   )

//   const decoded1 = parse(encoded1)
//   expect(decoded1).toEqual(sampleDoc)

//   expect(stringify([100, 100, 100])).toEqual('6;1**38+')

//   const doc = {
//     method: 'GET',
//     scheme: 'https',
//     host: 'example.com',
//     port: 443,
//     path: '/',
//     headers: [
//       ['accept', 'application/json'],
//       ['user-agent', 'Mozilla/5.0'],
//     ],
//   }
//   const known = [
//     'method',
//     'GET',
//     'POST',
//     'PUT',
//     'DELETE',
//     'scheme',
//     'http',
//     'https',
//     'host',
//     'port',
//     'path',
//     '/',
//     80,
//     443,
//     'headers',
//     'accept',
//     'user-agent',
//     ['accept', 'application/json'],
//   ]
//   expect(stringify(doc, { knownValues: known })).toEqual('R|6:&5&8&9&a&e&1&7&b$example.comd&b&j;h&f;g&b$Mozilla/5.0')

//   // Some common values in an http response that
//   // both sides know about (similar to HTTP2 HPACK)
//   const opts = {
//     knownValues: [
//       'headers',
//       'body',
//       'Content-Length',
//       ['Content-Type', 'application/json'],
//       ['Content-Type', 'application/json; charset=utf-8'],
//       // Common status codes
//       'status',
//       200,
//       404,
//       308,
//     ],
//   }

//   const body = JSON.stringify({ hello: 'world' })
//   const httpResponse = {
//     status: 200,
//     headers: [
//       ['Content-Type', 'application/json'],
//       ['Content-Length', body.length],
//     ],
//     body,
//   }
//   const encoded = stringify(httpResponse, opts)
//   expect(encoded).toEqual('A|3:5&&1&6&8;3&4;2&y+h${"hello":"world"}')
//   const decoded = parse(encoded, opts)
//   expect(decoded).toEqual(httpResponse)
// })

// test('encode README tables', () => {
//   const samples: [string, string?, EncodeOptions?][] = [
//     ['0', 'Integers'],
//     ['-1'],
//     ['1'],
//     ['-25'],
//     ['2000'],
//     ['-125000'],
//     ['8654321'],
//     ['1/3', 'Rational'],
//     ['-13/7'],
//     ['1/0', 'Infinity'],
//     ['-1/0', '-Infinity'],
//     ['0/0', 'NaN'],
//     ['20.24', 'Decimal'],
//     ['1e100'],
//     ['-1e-200'],
//     ['Math.PI'],
//     ['Math.sqrt(3)'],
//     ['true', 'True'],
//     ['false', 'False'],
//     ['null', 'Null'],
//     ["''", 'Empty String'],
//     ["'Banana'", 'B64 String'],
//     ["'Hi, World'", 'String'],
//     ["'🍌'", 'UTF-8 String'],
//     ['[ 1, 2, 3] ', 'Lists', { listCountedLimit: Infinity }],
//     ['[ 100, 100, 100 ]', 'Lists with Pointers'],
//     ['[ 1, 2, 3 ]', 'Counted Lists', { listCountedLimit: 1 }],
//     ['{ a: 1, b: 2, c: 3 }', 'Maps', { mapCountedLimit: Infinity }],
//     ['{ a: 1, b: 2, c: 3 }', 'Counted Maps', { mapCountedLimit: 1 }],
//     ["[ { name: 'Alice' }, { name: 'Bob' } ]", 'Repeated Keys'],
//     ['new Map([[1,2],[3,4]])', 'Non-string Keys'],
//     ['new Uint8Array([213,231,187])', 'Bytes'],
//   ]
//   const table: string[] = []
//   const opts: EncodeOptions = {}
//   for (const [js, desc, newOpts] of samples) {
//     if (newOpts) {
//       Object.assign(opts, newOpts)
//     }
//     let json: string
//     let val: unknown
//     try {
//       val = JSON.parse(js)
//       json = js
//     } catch (_) {
//       // biome-ignore lint/security/noGlobalEval: <explanation>
//       val = eval(`(${js})`)
//       if (
//         (typeof val === 'number' && !Number.isFinite(val)) ||
//         (val && typeof val === 'object' && (val instanceof Map || ArrayBuffer.isView(val)))
//       ) {
//         json = ''
//       } else {
//         json = JSON.stringify(val)
//       }
//     }
//     const encoded = stringify(val, opts)
//     const input = `\`${js}\``
//     const inter = json ? `\`${json}\`` : 'N/A'
//     const output = `\`${encoded}\``
//     table.push(
//       `| ${input.padStart(10)} |${inter.padStart(28)} | ${output.replace(/\|/g, '\\|').padEnd(28)} | ${(desc ?? '').padEnd(30)} |`,
//     )
//   }
//   // biome-ignore lint/suspicious/noConsoleLog: Printed on purpose
//   // biome-ignore lint/suspicious/noConsole: so that we can copy-paste into the README
//   console.log(table.join('\n'))
//   // biome-ignore lint/suspicious/noConsoleLog: Printed on purpose
//   // biome-ignore lint/suspicious/noConsole: so that we can copy-paste into the README
//   console.log(
//     stringify({
//       person: {
//         name: 'John Doe',
//         age: 30,
//         id: 12345,
//         'ai-generated': true,
//       },
//       list: [1, 2, 3, 4, 5],
//       nested: {
//         key: 'value',
//         nested: {
//           key: 'value',
//         },
//       },
//     }),
//   )
// })
