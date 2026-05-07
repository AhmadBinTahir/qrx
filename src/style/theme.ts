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
  },
  midnight: {
    dots: "rounded",
    corners: "rounded",
    foreground: "#FFFFFF",
    background: "#0B1020"
  },
  ocean: {
    dots: "rounded",
    corners: "rounded",
    foreground: "#0B3C5D",
    background: "#F3FAFF",
    gradient: { type: "linear", angle: 35, stops: ["#0B3C5D", "#1D70A2"] }
  },
  sunset: {
    dots: "rounded",
    corners: "extra-rounded",
    foreground: "#5A189A",
    background: "#FFF7ED",
    gradient: { type: "linear", angle: 25, stops: ["#5A189A", "#D0006F"] }
  },
  forest: {
    dots: "square",
    corners: "rounded",
    foreground: "#1B4332",
    background: "#F1FAEE",
    gradient: { type: "linear", angle: 45, stops: ["#1B4332", "#2D6A4F"] }
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
