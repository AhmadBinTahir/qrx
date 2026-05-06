import QRCode from "qrcode";
import type { CoreOptions } from "../types.js";

export interface EncodedQR {
  matrix: boolean[][];
  version: number;
  size: number;
}

export function encodeQR(payload: string, options?: CoreOptions): EncodedQR {
  const maskPattern =
    typeof options?.maskPattern === "number" && options.maskPattern >= 0 && options.maskPattern <= 7
      ? (options.maskPattern as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)
      : undefined;
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: options?.errorCorrectionLevel ?? "M",
    version: options?.version,
    maskPattern
  });
  const size = qr.modules.size;
  const matrix: boolean[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => Boolean(qr.modules.get(x, y)))
  );
  return { matrix, version: qr.version, size };
}
