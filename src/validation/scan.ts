import type { ErrorCorrectionLevel, QRStyle, ValidationReport } from "../types.js";

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

function logoPenalty(logoSize?: number): number {
  if (!logoSize) return 0;
  if (logoSize <= 0.2) return 0.03;
  if (logoSize <= 0.3) return 0.1;
  if (logoSize <= 0.35) return 0.2;
  return 0.35;
}

function eccTolerance(level: ErrorCorrectionLevel): number {
  if (level === "H") return 0.3;
  if (level === "Q") return 0.25;
  if (level === "M") return 0.15;
  return 0.07;
}

export function buildValidationReport(args: {
  matrixSize: number;
  style?: QRStyle;
  errorCorrectionLevel: ErrorCorrectionLevel;
  logoSize?: number;
  warnings?: string[];
}): ValidationReport {
  const fg = parseHexColor(args.style?.foreground ?? "#000000") ?? [0, 0, 0];
  const bg = parseHexColor(args.style?.background ?? "#FFFFFF") ?? [255, 255, 255];
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const contrastScore = Math.max(0, Math.min(1, contrast / 7));
  const densityScore = Math.max(0.3, Math.min(1, args.matrixSize / 45));
  const resilience = Math.max(0, eccTolerance(args.errorCorrectionLevel) - logoPenalty(args.logoSize));
  const score = Number(((contrastScore * 0.55 + densityScore * 0.25 + resilience * 0.2) * 100).toFixed(2));

  const recommendations: string[] = [];
  if (contrast < 4.5) recommendations.push("Increase foreground/background contrast to at least 4.5:1.");
  if ((args.logoSize ?? 0) > 0.3 && args.errorCorrectionLevel !== "H") {
    recommendations.push("Use error correction level H for logos over 30% of code area.");
  }
  if (args.matrixSize > 45 && (args.style?.dots === "classy" || args.style?.dots === "diamond")) {
    recommendations.push("Use square/rounded dots for dense QR codes to improve reliability.");
  }
  if (args.style?.backgroundStyle?.image) {
    recommendations.push("Keep background image opacity low and avoid texture behind finder patterns.");
  }

  const warnings = [...(args.warnings ?? [])];
  if (score < 65) warnings.push("Low scan reliability score.");

  return {
    readable: score >= 65,
    score,
    contrastScore: Number((contrastScore * 100).toFixed(2)),
    densityScore: Number((densityScore * 100).toFixed(2)),
    warnings,
    recommendations
  };
}
