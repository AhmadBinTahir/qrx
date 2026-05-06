import type { QRStyle } from "../types.js";

const THEMES: Record<NonNullable<QRStyle["theme"]>, QRStyle> = {
  neon: {
    dots: "rounded",
    corners: "extra-rounded",
    foreground: "#00F5D4",
    background: "#10002B",
    glow: { color: "#00F5D4", strength: 0.9 }
  },
  minimal: {
    dots: "square",
    corners: "rounded",
    foreground: "#111111",
    background: "#FFFFFF"
  },
  corporate: {
    dots: "classy",
    corners: "classy",
    foreground: "#0A2463",
    background: "#FFFFFF"
  },
  classic: {
    dots: "square",
    corners: "square",
    foreground: "#000000",
    background: "#FFFFFF"
  }
};

export function mergeTheme(style?: QRStyle): QRStyle {
  if (!style?.theme) {
    return {
      dots: "square",
      corners: "square",
      foreground: "#000000",
      background: style?.transparentBackground || style?.backgroundStyle?.transparent ? "transparent" : "#FFFFFF",
      ...style
    };
  }

  return {
    ...THEMES[style.theme],
    ...style
  };
}
