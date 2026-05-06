import type { QRStyle } from "../types.js";

function parseHexColor(color: string): [number, number, number] | null {
  const c = color.replace("#", "").trim();
  if (![3, 6].includes(c.length)) return null;
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const s = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

export function readabilityScore(matrixSize: number, style?: QRStyle): number {
  const fg = parseHexColor(style?.foreground ?? "#000000") ?? [0, 0, 0];
  const bg = parseHexColor(style?.background ?? "#FFFFFF") ?? [255, 255, 255];
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const contrastScore = Math.min(1, contrast / 7);
  const densityScore = matrixSize >= 21 ? 1 : matrixSize / 21;
  return Number(((contrastScore * 0.7 + densityScore * 0.3) * 100).toFixed(2));
}
