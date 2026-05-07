import type { GradientStyle, LogoOptions, QRStyle } from "../types.js";
import { mergeTheme } from "../style/theme.js";

function isFinder(x: number, y: number, size: number): boolean {
  const inSquare = (sx: number, sy: number) => x >= sx && x < sx + 7 && y >= sy && y < sy + 7;
  return inSquare(0, 0) || inSquare(size - 7, 0) || inSquare(0, size - 7);
}

function isFinderInner(x: number, y: number, size: number): boolean {
  const inSquare = (sx: number, sy: number) => x >= sx + 2 && x < sx + 5 && y >= sy + 2 && y < sy + 5;
  return inSquare(0, 0) || inSquare(size - 7, 0) || inSquare(0, size - 7);
}

function dotShape(x: number, y: number, unit: number, style: NonNullable<QRStyle["dots"]>): string {
  const px = x * unit;
  const py = y * unit;
  if (style === "rounded") return `<rect x="${px}" y="${py}" width="${unit}" height="${unit}" rx="${unit * 0.35}" />`;
  if (style === "extra-rounded") return `<rect x="${px}" y="${py}" width="${unit}" height="${unit}" rx="${unit * 0.48}" />`;
  if (style === "diamond") {
    const h = unit / 2;
    return `<path d="M ${px + h} ${py} L ${px + unit} ${py + h} L ${px + h} ${py + unit} L ${px} ${py + h} Z" />`;
  }
  if (style === "classy") return `<circle cx="${px + unit / 2}" cy="${py + unit / 2}" r="${unit * 0.42}" />`;
  return `<rect x="${px}" y="${py}" width="${unit}" height="${unit}" />`;
}

function normalizeGradient(gradient: QRStyle["gradient"]): GradientStyle | undefined {
  if (!gradient) return undefined;
  if (Array.isArray(gradient)) {
    if (typeof gradient[0] === "string") {
      return {
        type: "linear",
        angle: 45,
        stops: (gradient as string[]).map((color, i, arr) => ({ color, offset: i / Math.max(arr.length - 1, 1) }))
      };
    }
    return { type: "linear", angle: 45, stops: gradient };
  }
  return gradient;
}

function buildDefs(style: QRStyle, pxSize: number): string {
  const grad = normalizeGradient(style.gradient);
  const defs: string[] = [];
  if (grad) {
    const stops = Array.isArray(grad.stops) && typeof grad.stops[0] === "string"
      ? (grad.stops as string[]).map((color, i, arr) => ({ color, offset: i / Math.max(arr.length - 1, 1) }))
      : grad.stops as { color: string; offset: number }[];
    if ((grad.type ?? "linear") === "radial") {
      defs.push(`<radialGradient id="qrx-grad-radial">${stops.map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}" />`).join("")}</radialGradient>`);
    } else {
      const angle = grad.angle ?? 45;
      const rad = (angle * Math.PI) / 180;
      const x1 = (50 - Math.cos(rad) * 50).toFixed(2);
      const y1 = (50 - Math.sin(rad) * 50).toFixed(2);
      const x2 = (50 + Math.cos(rad) * 50).toFixed(2);
      const y2 = (50 + Math.sin(rad) * 50).toFixed(2);
      defs.push(`<linearGradient id="qrx-grad-linear" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops.map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}" />`).join("")}</linearGradient>`);
    }
  }
  if (style.shapeMask === "circle") {
    defs.push(`<clipPath id="qrx-mask"><circle cx="${pxSize / 2}" cy="${pxSize / 2}" r="${pxSize / 2}" /></clipPath>`);
  } else if (style.shapeMask === "heart") {
    defs.push(`<clipPath id="qrx-mask"><path d="M ${pxSize / 2} ${pxSize * 0.9} C ${pxSize * 0.1} ${pxSize * 0.55}, ${pxSize * 0.05} ${pxSize * 0.2}, ${pxSize / 2} ${pxSize * 0.35} C ${pxSize * 0.95} ${pxSize * 0.2}, ${pxSize * 0.9} ${pxSize * 0.55}, ${pxSize / 2} ${pxSize * 0.9} Z" /></clipPath>`);
  }
  if (style.glow) {
    defs.push(`<filter id="qrx-glow"><feGaussianBlur stdDeviation="${(style.glow.strength ?? 0.6) * 4}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  }
  if (style.blur) {
    defs.push(`<filter id="qrx-blur"><feGaussianBlur stdDeviation="${Math.max(0, style.blur)}" /></filter>`);
  }
  if (style.backgroundStyle?.pattern === "dots") {
    defs.push(`<pattern id="qrx-bg-pattern" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#cccccc" /></pattern>`);
  }
  if (style.backgroundStyle?.pattern === "grid") {
    defs.push(`<pattern id="qrx-bg-pattern" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M 14 0 L 0 0 0 14" fill="none" stroke="#d9d9d9" stroke-width="1"/></pattern>`);
  }
  return defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "";
}

function logoLayer(logo: LogoOptions | undefined, pxSize: number): string {
  if (!logo?.src) return "";
  const sizeRatio = Math.min(0.35, Math.max(0.08, logo.size ?? 0.2));
  const w = pxSize * sizeRatio;
  const x = (pxSize - w) / 2;
  const y = (pxSize - w) / 2;
  const pad = logo.padding ?? 6;
  const radius = logo.borderRadius ?? 8;
  const bg = logo.background ?? "rgba(255,255,255,0.96)";
  return `
    <g id="qrx-logo">
      <rect x="${x - pad}" y="${y - pad}" width="${w + pad * 2}" height="${w + pad * 2}" rx="${radius}" fill="${bg}" />
      <image href="${logo.src}" x="${x}" y="${y}" width="${w}" height="${w}" preserveAspectRatio="${logo.preserveAspectRatio ?? "xMidYMid meet"}" />
    </g>
  `;
}

export function renderSVG(matrix: boolean[][], styleInput?: QRStyle, logo?: LogoOptions, margin = 4): string {
  const style = mergeTheme(styleInput);
  const size = matrix.length;
  const unit = 10;
  const pxSize = (size + margin * 2) * unit;
  const grad = normalizeGradient(style.gradient);
  const fg = grad ? (grad.type === "radial" ? "url(#qrx-grad-radial)" : "url(#qrx-grad-linear)") : (style.foreground ?? "#000000");
  const bg = style.transparentBackground || style.backgroundStyle?.transparent ? "transparent" : (style.backgroundStyle?.color ?? style.background ?? "#FFFFFF");
  const dataModules: string[] = [];
  const finderOuter: string[] = [];
  const finderInner: string[] = [];
  const finderDotStyle: NonNullable<QRStyle["dots"]> =
    style.corners === "square" ? "square" : style.corners === "rounded" ? "rounded" : "extra-rounded";

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!matrix[y][x]) continue;
      if (isFinder(x, y, size)) {
        if (isFinderInner(x, y, size)) {
          finderInner.push(dotShape(x + margin, y + margin, unit, finderDotStyle));
        } else {
          finderOuter.push(dotShape(x + margin, y + margin, unit, finderDotStyle));
        }
        continue;
      }
      dataModules.push(dotShape(x + margin, y + margin, unit, style.dots ?? "square"));
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pxSize} ${pxSize}" width="${pxSize}" height="${pxSize}">
    ${buildDefs(style, pxSize)}
    <rect width="100%" height="100%" fill="${bg}" />
    ${style.backgroundStyle?.pattern && style.backgroundStyle.pattern !== "none" ? `<rect width="100%" height="100%" fill="url(#qrx-bg-pattern)" />` : ""}
    ${style.backgroundStyle?.image ? `<image href="${style.backgroundStyle.image.src}" x="0" y="0" width="${pxSize}" height="${pxSize}" opacity="${style.backgroundStyle.image.opacity ?? 0.12}" preserveAspectRatio="xMidYMid slice" />` : ""}
    <g fill="${fg}" ${style.glow ? `filter="url(#qrx-glow)"` : ""} ${style.blur ? `filter="url(#qrx-blur)"` : ""} ${style.shapeMask && style.shapeMask !== "none" ? `clip-path="url(#qrx-mask)"` : ""}>${dataModules.join("")}</g>
    <g fill="${style.cornerColor ?? style.foreground ?? "#000000"}">${finderOuter.join("")}</g>
    <g fill="${style.eyeInnerColor ?? style.cornerColor ?? style.foreground ?? "#000000"}">${finderInner.join("")}</g>
    ${logoLayer(logo, pxSize)}
  </svg>`;
}
