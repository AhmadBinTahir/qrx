import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GenerateQROptions } from "./types.js";

export interface QrxFileConfig {
  defaults?: Partial<GenerateQROptions>;
}

export function loadConfigFile(pathOrUndefined?: string): QrxFileConfig {
  const path = resolve(pathOrUndefined ?? "qrx.config.json");
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as QrxFileConfig;
}

export function mergeOptions(base: Partial<GenerateQROptions> | undefined, input: GenerateQROptions): GenerateQROptions {
  return {
    ...base,
    ...input,
    core: { ...(base?.core ?? {}), ...(input.core ?? {}) },
    style: { ...(base?.style ?? {}), ...(input.style ?? {}) },
    security: { ...(base?.security ?? {}), ...(input.security ?? {}) },
    validation: { ...(base?.validation ?? {}), ...(input.validation ?? {}) },
    meta: { ...(base?.meta ?? {}), ...(input.meta ?? {}) }
  };
}
