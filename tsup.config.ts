import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli.ts",
    "src/framework/react.ts",
    "src/framework/vue.ts",
    "src/framework/svelte.ts",
    "src/framework/next.ts",
    "src/benchmarks/run.ts"
  ],
  clean: true,
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  target: "es2022"
});
