import { writeFileSync } from "node:fs";
import { generateQR } from "../../dist/index.js";

const out = await generateQR({
  type: "text",
  data: { text: "qrx styled example" },
  style: {
    theme: "neon",
    dots: "diamond",
    corners: "extra-rounded",
    gradient: { type: "linear", angle: 30, stops: ["#3a0ca3", "#4cc9f0"] },
    backgroundStyle: { pattern: "grid" },
    shapeMask: "circle",
    glow: { color: "#4cc9f0", strength: 0.9 }
  },
  logo: {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
    size: 0.2
  },
  format: "svg"
});

writeFileSync(new URL("./styled.svg", import.meta.url), out.svg ?? "", "utf8");
console.log("examples/styled/styled.svg");
