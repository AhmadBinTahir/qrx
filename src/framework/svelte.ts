import type { GenerateQROptions } from "../types.js";
import { generateQR } from "../index.js";

export async function createSvelteSvg(options: GenerateQROptions): Promise<{ svg: string; score: number }> {
  const out = await generateQR({ ...options, format: "svg" });
  return { svg: out.svg ?? "", score: out.score };
}
