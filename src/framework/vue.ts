import type { GenerateQROptions } from "../types.js";
import { generateQR } from "../index.js";

export async function createVueSvg(options: GenerateQROptions): Promise<string> {
  const out = await generateQR({ ...options, format: "svg" });
  return out.svg ?? "";
}
