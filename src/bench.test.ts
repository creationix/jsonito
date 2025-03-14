import { expect, test } from "bun:test"
import { parse, stringify } from "./jsonito.ts"

test.skip("benchmark pokemon", async () => {
  const pokemon: unknown[] = []
  const num = 4
  const start = Math.floor(Math.random() * 100 - num) + 1
  const end = start + num
  for (let i = start; i <= end; i++) {
    const url = `https://pokeapi.co/api/v2/pokemon/${i}/`
    console.log("Ingesting", url)
    const res = await fetch(url)
    const data = await res.json()
    const json = JSON.stringify(data)
    const jito = stringify(data)
    const jsonParsed = JSON.parse(json)
    const jitoParsed = parse(jito)
    expect(jitoParsed).toEqual(jsonParsed)
    pokemon.push(data)
  }
  const json = JSON.stringify(pokemon)
  const jito = stringify(pokemon)
  const jsonParsed = JSON.parse(json)
  const jitoParsed = parse(jito)
  expect(jsonParsed).toEqual(pokemon)
  expect(jitoParsed).toEqual(pokemon)
  expect(jitoParsed).toEqual(jsonParsed)
  const totals = {
    json: { parse: 0, stringify: 0 },
    jito: { parse: 0, stringify: 0 },
  }
  console.log("Benchmarking...")
  const count = 100
  for (let i = 0; i < count; i++) {
    let before = performance.now()
    JSON.parse(json)
    let after = performance.now()
    let delta = after - before
    totals.json.parse += delta
    before = performance.now()
    parse(jito)
    after = performance.now()
    delta = after - before
    totals.jito.parse += delta
    before = performance.now()
    JSON.stringify(pokemon)
    after = performance.now()
    delta = after - before
    totals.json.stringify += delta
    before = performance.now()
    stringify(pokemon)
    after = performance.now()
    delta = after - before
    totals.jito.stringify += delta
  }
  const jsonSize = new TextEncoder().encode(json).length
  const jitoSize = new TextEncoder().encode(jito).length

  const table = [
    ["Metric", "JSON", "JSONito", "Relative Comparison"],
    [
      "Parse Time",
      ms(totals.json.parse / count),
      ms(totals.jito.parse / count),
      compareMs("JSONito.parse", totals.jito.parse, totals.json.parse),
    ],
    [
      "Stringify Time",
      ms(totals.json.stringify / count),
      ms(totals.jito.stringify / count),
      compareMs("JSONito.stringify", totals.jito.stringify, totals.json.stringify),
    ],
    ["Encoded Size", bytes(jsonSize), bytes(jitoSize), compareBytes("JSONito encoded", jitoSize, jsonSize)],
  ]

  console.log(printTable(table))

  // Ensure at least 50% size savings
  expect(jsonSize / jitoSize).toBeGreaterThan(2)
  // Ensure no more than 5x slower decode
  expect(totals.jito.parse / totals.json.parse).toBeLessThan(6)
  // Ensure no more then 30x slower encode
  expect(totals.jito.stringify / totals.json.stringify).toBeLessThan(30)
})

function ms(n: number) {
  return `${n.toFixed(2)} ms`
}

function bytes(n: number) {
  if (n < 1024) {
    return `${n} bytes`
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(2)} KiB`
  }
  return `${(n / 1024 / 1024).toFixed(2)} MiB`
}

function compareMs(name: string, self: number, other: number) {
  return compare(name, self, other, "slower", "faster")
}
function compareBytes(name: string, self: number, other: number) {
  return compare(name, self, other, "larger", "smaller")
}

function compare(name: string, self: number, other: number, higher: string, lower: string) {
  if (self > other) {
    return `${name} is ${(self / other).toFixed(2)}x ${higher}`
  }
  return `${name} is ${(other / self).toFixed(2)}x ${lower}`
}

function printTable(table: string[][]) {
  const columnWidths: number[] = []
  for (const row of table) {
    for (const [col, cell] of row.entries()) {
      columnWidths[col] = Math.max(columnWidths[col] ?? 0, cell.length)
    }
  }
  const lines: string[] = []
  lines.push("\n")
  for (const [y, row] of table.entries()) {
    const line: string[] = []
    for (const [x, cell] of row.entries()) {
      const width = columnWidths[x]
      if (y === 0) {
        line.push(boldBlue(cell.padEnd(width)))
      } else if (x === 0) {
        line.push(boldYellow(cell.padEnd(width)))
      } else {
        line.push(cell.padEnd(width))
      }
    }
    if (y === 0) {
      lines.push(` ┌─${columnWidths.map((w) => "─".repeat(w)).join("─┬─")}─┐`)
    } else {
      lines.push(` ├─${columnWidths.map((w) => "─".repeat(w)).join("─┼─")}─┤`)
    }
    lines.push(` │ ${line.join(" │ ")} │`)
  }
  lines.push(` └─${columnWidths.map((w) => "─".repeat(w)).join("─┴─")}─┘`)
  lines.push("\n")
  return lines
    .join("\n")
    .replace(/\b(slower|larger)\b/g, boldRed)
    .replace(/\b(faster|smaller)\b/g, boldGreen)
    .replace(/\b\d+\.\d+x\b/g, boldWhite)
}

function boldBlue(str: string) {
  return `\x1b[34;1m${str}\x1b[0m`
}
function boldYellow(str: string) {
  return `\x1b[33;1m${str}\x1b[0m`
}
function boldRed(str: string) {
  return `\x1b[31;1m${str}\x1b[0m`
}
function boldGreen(str: string) {
  return `\x1b[32;1m${str}\x1b[0m`
}
function boldWhite(str: string) {
  return `\x1b[37;1m${str}\x1b[0m`
}
