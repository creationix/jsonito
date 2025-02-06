import { expect, test } from "bun:test"
import { parse, stringify } from "./jsonito.ts"

test("benchmark pokemon", async () => {
  const pokemon: unknown[] = []
  for (let i = 1; i <= 10; i++) {
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
  for (let i = 0; i < 10; i++) {
    let before = performance.now()
    JSON.parse(json)
    let after = performance.now()
    let delta = after - before
    totals.json.parse += delta
    console.log("JSON.parse", delta)
    before = performance.now()
    parse(jito)
    after = performance.now()
    delta = after - before
    totals.jito.parse += delta
    console.log("JSONito.parse", delta)
    before = performance.now()
    JSON.stringify(pokemon)
    after = performance.now()
    delta = after - before
    totals.json.stringify += delta
    console.log("JSON.stringify", delta)
    before = performance.now()
    stringify(pokemon)
    after = performance.now()
    delta = after - before
    totals.jito.stringify += delta
    console.log("JSONito.stringify", delta)
  }
  console.log("TOTALS")
  console.log("JSON.parse", totals.json.parse)
  console.log("JSONito.parse", totals.jito.parse)
  console.log("JSON.stringify", totals.json.stringify)
  console.log("JSONito.stringify", totals.jito.stringify)
  if (totals.jito.parse > totals.json.parse) {
    console.log(`JSONito.parse is slower by a multiple of ${totals.jito.parse / totals.json.parse}`)
  } else {
    console.log(`JSONito.parse is faster by a multiple of ${totals.json.parse / totals.jito.parse}`)
  }
  if (totals.jito.stringify > totals.json.stringify) {
    console.log(`JSONito.stringify is slower by a multiple of ${totals.jito.stringify / totals.json.stringify}`)
  } else {
    console.log(`JSONito.stringify is faster by a multiple of ${totals.json.stringify / totals.jito.stringify}`)
  }
})
