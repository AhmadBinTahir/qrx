import { PNG } from "pngjs";
import type { QRStyle } from "../types.js";
import { mergeTheme } from "../style/theme.js";

function colorHexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function renderPNG(matrix: boolean[][], styleInput?: QRStyle, margin = 2, unit = 10): Buffer {
  const style = mergeTheme(styleInput);
  const size = matrix.length + margin * 2;
  const pxSize = size * unit;
  const png = new PNG({ width: pxSize, height: pxSize });
  const fg = colorHexToRGB(style.foreground ?? "#000000");
  const bg = style.transparentBackground ? [0, 0, 0] as [number, number, number] : colorHexToRGB(style.background ?? "#FFFFFF");
  const bgA = style.transparentBackground ? 0 : 255;

  for (let y = 0; y < pxSize; y += 1) {
    for (let x = 0; x < pxSize; x += 1) {
      const idx = (pxSize * y + x) << 2;
      png.data[idx] = bg[0];
      png.data[idx + 1] = bg[1];
      png.data[idx + 2] = bg[2];
      png.data[idx + 3] = bgA;
    }
  }

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix.length; x += 1) {
      if (!matrix[y][x]) continue;
      const startX = (x + margin) * unit;
      const startY = (y + margin) * unit;
      for (let oy = 0; oy < unit; oy += 1) {
        for (let ox = 0; ox < unit; ox += 1) {
          const idx = (pxSize * (startY + oy) + (startX + ox)) << 2;
          png.data[idx] = fg[0];
          png.data[idx + 1] = fg[1];
          png.data[idx + 2] = fg[2];
          png.data[idx + 3] = 255;
        }
      }
    }
  }
  return PNG.sync.write(png);
}
