import pLimit from "p-limit";
import type { GenerateQROptions, QRArtifact } from "./types.js";

export interface BatchOptions {
  concurrency?: number;
}

export async function generateBatch(
  items: GenerateQROptions[],
  generate: (input: GenerateQROptions) => Promise<QRArtifact>,
  options?: BatchOptions
): Promise<QRArtifact[]> {
  const limit = pLimit(options?.concurrency ?? 8);
  return Promise.all(items.map((item) => limit(() => generate(item))));
}

export async function* streamBatch(
  items: AsyncIterable<GenerateQROptions> | Iterable<GenerateQROptions>,
  generate: (input: GenerateQROptions) => Promise<QRArtifact>,
  options?: BatchOptions
): AsyncGenerator<QRArtifact> {
  const limit = pLimit(options?.concurrency ?? 8);
  const queue: Promise<QRArtifact>[] = [];
  for await (const item of items) {
    queue.push(limit(() => generate(item)));
    if (queue.length >= (options?.concurrency ?? 8)) {
      yield await queue.shift()!;
    }
  }
  while (queue.length > 0) {
    yield await queue.shift()!;
  }
}
