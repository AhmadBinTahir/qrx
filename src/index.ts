import { createGenerator, decryptQRPayload, isExpired, renderToCanvas, verifySignedPayload } from "./generator.js";
import { clearMiddleware, listRenderers, registerRenderer, useMiddleware } from "./plugins.js";
import { registerTypeBuilder } from "./data/builders.js";
import { loadConfigFile, type QrxFileConfig } from "./config.js";
import { decryptPayload, encryptPayload, signPayload, verifyPayloadSignature } from "./security/crypto.js";
import type { GenerateQROptions, GeneratorConfig } from "./types.js";

const defaultGenerator = createGenerator();

export function configure(config: GeneratorConfig): ReturnType<typeof createGenerator> {
  return createGenerator(config);
}

export function configureFromFile(path?: string): ReturnType<typeof createGenerator> {
  const file = loadConfigFile(path) as QrxFileConfig;
  return createGenerator({ defaults: file.defaults });
}

export async function generateQR(options: GenerateQROptions) {
  return defaultGenerator.generate(options);
}

export async function generateBatch(items: GenerateQROptions[], options?: { concurrency?: number }) {
  return defaultGenerator.batch(items, options);
}

export function streamBatch(items: AsyncIterable<GenerateQROptions> | Iterable<GenerateQROptions>, options?: { concurrency?: number }) {
  return defaultGenerator.stream(items, options);
}

export function inspectPayload(options: GenerateQROptions) {
  return defaultGenerator.inspect(options);
}

export function validatePayload(payload: string, options?: Partial<GenerateQROptions>) {
  return defaultGenerator.validatePayload(payload, options);
}

export {
  createGenerator,
  decryptQRPayload,
  verifySignedPayload,
  isExpired,
  registerTypeBuilder,
  registerRenderer,
  useMiddleware,
  clearMiddleware,
  listRenderers,
  renderToCanvas,
  loadConfigFile,
  encryptPayload,
  decryptPayload,
  signPayload,
  verifyPayloadSignature
};

export type * from "./types.js";
