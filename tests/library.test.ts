import { describe, expect, it } from "vitest";
import {
  configure,
  decryptQRPayload,
  generateBatch,
  generateQR,
  inspectPayload,
  validatePayload,
  verifySignedPayload
} from "../src/index.js";

describe("qrx", () => {
  it("generates wifi svg", async () => {
    const out = await generateQR({
      type: "wifi",
      data: { ssid: "Office", password: "Password123", encryption: "WPA" },
      style: { dots: "rounded", theme: "minimal", gradient: { type: "radial", stops: ["#111", "#444"] } },
      format: "svg"
    });
    expect(out.svg).toContain("<svg");
    expect(out.matrixSize).toBeGreaterThan(20);
    expect(out.validation.readable).toBe(true);
  });

  it("encrypts and decrypts payloads", async () => {
    const out = await generateQR({
      type: "text",
      data: { text: "secret data" },
      security: { encrypt: true, password: "pass1234" }
    });
    const decrypted = decryptQRPayload(out.payload, "pass1234");
    expect(decrypted).toContain("secret data");
  });

  it("signs payloads", async () => {
    const out = await generateQR({
      type: "url",
      data: { url: "https://example.com" },
      security: { sign: true, signingSecret: "k" }
    });
    expect(verifySignedPayload(out.payload, "k")).toBe(true);
  });

  it("supports generator defaults and inspection", async () => {
    const generator = configure({
      strict: true,
      defaults: {
        style: { theme: "corporate" },
        validation: { minReadabilityScore: 60 }
      }
    });
    const inspection = inspectPayload({ type: "text", data: { text: "hello" } });
    expect(inspection.payload).toContain("hello");
    const out = await generator.generate({
      type: "url",
      data: { url: "https://example.com/path" }
    });
    expect(out.score).toBeGreaterThan(60);
  });

  it("validates payload and runs batch", async () => {
    const report = validatePayload("https://example.com");
    expect(report.readable).toBe(true);

    const batch = await generateBatch([
      { type: "text", data: { text: "a" }, format: "svg" },
      { type: "text", data: { text: "b" }, format: "svg" }
    ]);
    expect(batch).toHaveLength(2);
    expect(batch[0].svg).toContain("<svg");
  });

  it("auto-hardens risky styling for scanner compatibility", async () => {
    const out = await generateQR({
      type: "url",
      data: { url: "https://example.com" },
      style: {
        theme: "sunset",
        foreground: "#999999",
        background: "#aaaaaa",
        shapeMask: "heart",
        transparentBackground: true
      },
      logo: { src: "https://example.com/logo.svg", size: 0.35 },
      core: { margin: 1, errorCorrectionLevel: "L" },
      format: "svg"
    });

    expect(out.validation.readable).toBe(true);
    expect(out.validation.warnings.length).toBeGreaterThan(0);
    expect(out.svg).toContain("<svg");
  });
});
