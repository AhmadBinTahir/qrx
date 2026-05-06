import { performance } from "node:perf_hooks";
import { createGenerator } from "../generator.js";
import type { GenerateQROptions } from "../types.js";

const generator = createGenerator();

async function run(): Promise<void> {
  const total = 500;
  const jobs: GenerateQROptions[] = Array.from({ length: total }, (_, i) => ({
    type: "url",
    data: { url: `https://example.com/${i}` },
    format: "svg"
  }));
  const start = performance.now();
  await generator.batch(jobs, { concurrency: 16 });
  const elapsed = performance.now() - start;
  process.stdout.write(JSON.stringify({
    total,
    elapsedMs: Number(elapsed.toFixed(2)),
    qps: Number((total / (elapsed / 1000)).toFixed(2))
  }, null, 2));
}

run();
