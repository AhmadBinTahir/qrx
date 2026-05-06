import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createGenerator } from "../../dist/index.js";

const generator = createGenerator();
const jobs = JSON.parse(await readFile(new URL("./batch-jobs.json", import.meta.url), "utf8"));
const outDir = new URL("./output", import.meta.url);
mkdirSync(outDir, { recursive: true });

const results = await generator.batch(jobs, { concurrency: 4 });
results.forEach((result, idx) => {
  const file = join(fileURLToPath(outDir), `${idx + 1}.svg`);
  writeFileSync(file, result.svg ?? "", "utf8");
});

console.log("examples/batch/output");
