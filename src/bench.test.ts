// import { expect, test } from "bun:test"
import { runBench } from "./bench.ts"

test("bench", async () => {
    const { totals, jsonSize, jitoSize, jsonParsed, jitoParsed, pokemon } = await runBench()

    // Basic sanity check for correctness on this large dataset
    expect(jsonParsed).toEqual(pokemon)
    expect(jitoParsed).toEqual(pokemon)
    expect(jitoParsed).toEqual(jsonParsed)

    // Ensure at least 50% size savings
    expect(jsonSize / jitoSize).toBeGreaterThan(2)
    // Ensure no more than 5x slower decode
    expect(totals.jito.parse / totals.json.parse).toBeLessThan(5)
    // Ensure no more then 30x slower encode
    expect(totals.jito.stringify / totals.json.stringify).toBeLessThan(30)

})