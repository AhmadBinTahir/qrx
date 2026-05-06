import { writeFileSync } from "node:fs";
import { generateQR } from "../../dist/index.js";

const out = await generateQR({
  type: "url",
  data: { url: "https://example.com" },
  format: "svg"
});

writeFileSync(new URL("./basic.svg", import.meta.url), out.svg ?? "", "utf8");
console.log("examples/basic/basic.svg");
