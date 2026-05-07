import type { QRStyle } from "../types.js";
import { mergeTheme } from "../style/theme.js";

export function renderToCanvas(
  canvas: { width: number; height: number; getContext: (id: "2d") => CanvasRenderingContext2D | null },
  matrix: boolean[][],
  styleInput?: QRStyle,
  margin = 4
): void {
  const style = mergeTheme(styleInput);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context is not available.");
  const size = matrix.length + margin * 2;
  const unit = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / size));
  const px = size * unit;
  canvas.width = px;
  canvas.height = px;
  ctx.clearRect(0, 0, px, px);
  if (!style.transparentBackground) {
    ctx.fillStyle = style.background ?? "#FFFFFF";
    ctx.fillRect(0, 0, px, px);
  }
  ctx.fillStyle = style.foreground ?? "#000000";
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix.length; x += 1) {
      if (matrix[y][x]) ctx.fillRect((x + margin) * unit, (y + margin) * unit, unit, unit);
    }
  }
}
