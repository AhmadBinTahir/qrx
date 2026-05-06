#!/usr/bin/env node
import { Command } from "commander";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import {
  configureFromFile,
  createGenerator,
  decryptQRPayload,
  generateQR,
  inspectPayload,
  validatePayload,
  verifySignedPayload
} from "./index.js";
import { encryptPayload, signPayload } from "./security/crypto.js";
import type { GenerateQROptions, QRType } from "./types.js";

const program = new Command();

program
  .name("qrx")
  .description("Production-grade QR generation CLI")
  .version("0.2.0");

program
  .command("generate")
  .requiredOption("--type <type>", "QR type")
  .option("--data <value>", "Inline JSON or raw value")
  .option("--data-file <path>", "Path to JSON payload")
  .option("--format <format>", "svg|png", "svg")
  .option("--out <path>", "Output path")
  .option("--config <path>", "qrx config file path")
  .option("--theme <name>", "Theme preset")
  .option("--preset <name>", "Alias for --theme")
  .option("--warn-unsafe", "Enable unsafe payload detection")
  .option("--encrypt", "Encrypt generated payload")
  .option("--password <secret>", "Encryption password")
  .option("--sign", "Sign generated payload")
  .option("--signing-secret <secret>", "Signing secret")
  .action(async (opts) => {
    const base = opts.config ? configureFromFile(opts.config) : createGenerator();
    const dataValue = readDataInput(opts.type as QRType, opts.data, opts.dataFile);
    const request: GenerateQROptions = {
      type: opts.type as QRType,
      data: dataValue,
      format: opts.format,
      style: opts.theme || opts.preset ? { theme: (opts.theme ?? opts.preset) } : undefined,
      security: {
        warnUnsafe: Boolean(opts.warnUnsafe),
        encrypt: Boolean(opts.encrypt),
        password: opts.password,
        sign: Boolean(opts.sign),
        signingSecret: opts.signingSecret
      }
    };
    const result = await base.generate(request);
    const outPath = resolve(opts.out ?? (opts.format === "png" ? "qrx.png" : "qrx.svg"));
    if (opts.format === "png") {
      if (!result.png) throw new Error("PNG output unavailable.");
      writeFileSync(outPath, result.png);
    } else {
      writeFileSync(outPath, result.svg ?? "", "utf8");
    }
    process.stdout.write(JSON.stringify({
      output: outPath,
      matrixSize: result.matrixSize,
      version: result.version,
      score: result.score,
      warnings: result.warnings
    }, null, 2));
  });

program
  .command("batch")
  .requiredOption("--in <path>", "JSON array or JSONL file with generation jobs")
  .option("--out-dir <path>", "Output directory", "qrx-out")
  .option("--concurrency <n>", "Parallel workers", "8")
  .option("--config <path>", "qrx config file path")
  .action(async (opts) => {
    const generator = opts.config ? configureFromFile(opts.config) : createGenerator();
    const items = loadBatchFile(opts.in);
    const outDir = resolve(opts.outDir);
    mkdirSync(outDir, { recursive: true });
    const concurrency = Number.parseInt(opts.concurrency, 10);
    const results = await generator.batch(items, { concurrency: Number.isNaN(concurrency) ? 8 : concurrency });
    const manifest = results.map((res, i) => {
      const format = items[i].format ?? "svg";
      const file = join(outDir, `${i + 1}.${format === "png" ? "png" : "svg"}`);
      if (format === "png") {
        if (!res.png) throw new Error("PNG output unavailable in batch item.");
        writeFileSync(file, res.png);
      } else {
        writeFileSync(file, res.svg ?? "", "utf8");
      }
      return { index: i + 1, file, type: items[i].type, score: res.score, warnings: res.warnings };
    });
    writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    process.stdout.write(JSON.stringify({ outDir, count: manifest.length }, null, 2));
  });

program
  .command("inspect")
  .requiredOption("--type <type>", "QR type")
  .option("--data <value>", "Inline JSON or raw value")
  .option("--data-file <path>", "Path to JSON payload")
  .action((opts) => {
    const dataValue = readDataInput(opts.type as QRType, opts.data, opts.dataFile);
    const inspection = inspectPayload({ type: opts.type as QRType, data: dataValue });
    process.stdout.write(JSON.stringify(inspection, null, 2));
  });

program
  .command("validate")
  .requiredOption("--payload <payload>", "Raw payload string")
  .action((opts) => {
    const report = validatePayload(opts.payload);
    process.stdout.write(JSON.stringify(report, null, 2));
  });

program
  .command("encrypt")
  .requiredOption("--payload <payload>", "Raw payload")
  .requiredOption("--password <secret>", "Encryption password")
  .action((opts) => {
    process.stdout.write(`ENCRYPTED::${encryptPayload(opts.payload, opts.password)}`);
  });

program
  .command("decrypt")
  .requiredOption("--payload <payload>", "Encrypted payload")
  .requiredOption("--password <secret>", "Encryption password")
  .action((opts) => {
    process.stdout.write(decryptQRPayload(opts.payload, opts.password));
  });

program
  .command("sign")
  .requiredOption("--payload <payload>", "Raw payload")
  .requiredOption("--secret <secret>", "Signing secret")
  .action((opts) => {
    process.stdout.write(signPayload(opts.payload, opts.secret));
  });

program
  .command("verify")
  .requiredOption("--payload <payload>", "SIGNED::* payload")
  .requiredOption("--secret <secret>", "Signing secret")
  .action((opts) => {
    process.stdout.write(String(verifySignedPayload(opts.payload, opts.secret)));
  });

program.parseAsync();

function readDataInput(type: QRType, data?: string, dataFile?: string): unknown {
  if (dataFile) {
    const path = resolve(dataFile);
    if (!existsSync(path)) throw new Error(`Data file not found: ${path}`);
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw);
  }
  if (!data) throw new Error("Provide --data or --data-file.");
  try {
    return JSON.parse(data);
  } catch {
    if (type === "url") return { url: data };
    if (type === "text") return { text: data };
    if (type === "custom") return { payload: data };
    throw new Error("Raw non-JSON --data is only supported for type=url|text|custom.");
  }
}

function loadBatchFile(path: string): GenerateQROptions[] {
  const fullPath = resolve(path);
  const raw = readFileSync(fullPath, "utf8");
  if (extname(fullPath).toLowerCase() === ".jsonl") {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as GenerateQROptions);
  }
  const parsed = JSON.parse(raw) as GenerateQROptions[];
  if (!Array.isArray(parsed)) throw new Error("Batch input must be an array of generate options.");
  return parsed;
}

export { generateQR };
