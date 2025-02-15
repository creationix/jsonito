import { runBench } from "./bench.ts"

async function loop() {
    await runBench()
    setTimeout(loop, 500)
}
loop()