import type { GenerateQROptions } from "../types.js";
import { generateQR } from "../index.js";

export async function getNextQrSvgResponse(options: GenerateQROptions): Promise<Response> {
  const out = await generateQR({ ...options, format: "svg" });
  return new Response(out.svg ?? "", {
    status: 200,
    headers: { "content-type": "image/svg+xml; charset=utf-8", "x-qrx-score": String(out.score) }
  });
}
