import { generateBatch as runBatch, streamBatch as runStreamBatch, type BatchOptions } from "./batch.js";
import { mergeOptions } from "./config.js";
import { encodeQR } from "./core/engine.js";
import { buildPayload } from "./data/builders.js";
import { getRenderer, registerRenderer, runMiddleware } from "./plugins.js";
import { renderToCanvas } from "./renderers/canvas.js";
import { renderPNG } from "./renderers/png.js";
import { renderSVG } from "./renderers/svg.js";
import { decryptPayload, encryptPayload, signPayload, verifyPayloadSignature } from "./security/crypto.js";
import {
  assertPayloadProtocolsAllowed,
  detectUnsafePayload,
  getDefaultProtocolWhitelist
} from "./security/validation.js";
import type {
  ErrorCorrectionLevel,
  GenerateQROptions,
  GeneratorConfig,
  MiddlewareContext,
  PayloadInspection,
  QRArtifact,
  ValidationReport
} from "./types.js";
import { buildValidationReport } from "./validation/scan.js";
import { mergeTheme } from "./style/theme.js";

let builtinsRegistered = false;
function ensureBuiltinsRegistered(): void {
  if (builtinsRegistered) return;
  registerRenderer({
    name: "svg",
    render: ({ matrix, options }) => renderSVG(matrix, options.style, options.logo, options.core?.margin ?? 4)
  });
  registerRenderer({
    name: "png",
    render: ({ matrix, options }) => renderPNG(matrix, options.style, options.core?.margin ?? 4)
  });
  builtinsRegistered = true;
}

export interface GeneratorAPI {
  generate: (options: GenerateQROptions) => Promise<QRArtifact>;
  batch: (items: GenerateQROptions[], options?: BatchOptions) => Promise<QRArtifact[]>;
  stream: (items: AsyncIterable<GenerateQROptions> | Iterable<GenerateQROptions>, options?: BatchOptions) => AsyncGenerator<QRArtifact>;
  inspect: (options: GenerateQROptions) => PayloadInspection;
  validatePayload: (payload: string, options?: Partial<GenerateQROptions>) => ValidationReport;
}

export function createGenerator(config?: GeneratorConfig): GeneratorAPI {
  ensureBuiltinsRegistered();
  const defaults = config?.defaults;
  const strict = config?.strict ?? false;
  const whitelist = config?.protocolWhitelist ?? defaults?.security?.strictProtocolWhitelist ?? getDefaultProtocolWhitelist();

  async function generate(options: GenerateQROptions): Promise<QRArtifact> {
    const merged = mergeOptions(defaults, options);
    const inspection = inspect(merged);
    const middlewareCtx = await runMiddleware<MiddlewareContext>(
      { options: merged, payload: inspection.payload, normalizedData: inspection.normalizedData, warnings: inspection.warnings },
      async (mw, current) => mw(current)
    );

    const hardened = hardenForScanReliability(merged);
    const securePayload = applySecurity(middlewareCtx.payload, hardened.options);
    assertPayloadProtocolsAllowed(securePayload, hardened.options.security?.strictProtocolWhitelist ?? whitelist);
    const effectiveEcc: ErrorCorrectionLevel = hardened.options.logo
      ? "H"
      : (hardened.options.core?.errorCorrectionLevel ?? "Q");
    const encoded = encodeQR(securePayload, {
      ...hardened.options.core,
      errorCorrectionLevel: effectiveEcc
    });

    const validation = buildValidationReport({
      matrixSize: encoded.size,
      style: hardened.options.style,
      errorCorrectionLevel: effectiveEcc,
      logoSize: hardened.options.logo?.size,
      margin: hardened.options.core?.margin,
      warnings: [...middlewareCtx.warnings, ...hardened.warnings]
    });

    if ((hardened.options.validation?.failOnWarnings || strict) && validation.warnings.length > 0) {
      throw new Error(`Validation warnings present: ${validation.warnings.join(" | ")}`);
    }
    if ((hardened.options.validation?.failOnUnsafe || strict) && middlewareCtx.warnings.length > 0) {
      throw new Error(`Unsafe payload warnings: ${middlewareCtx.warnings.join(" | ")}`);
    }
    if (validation.score < (hardened.options.validation?.minReadabilityScore ?? 70)) {
      throw new Error(`Validation score ${validation.score} is below required threshold.`);
    }

    const format = hardened.options.format ?? "svg";
    const renderer = getRenderer(format);
    if (!renderer) throw new Error(`No renderer registered for format "${format}".`);
    const rendered = await renderer.render({
      matrix: encoded.matrix,
      options: hardened.options,
      payload: securePayload,
      size: encoded.size
    });

    return {
      payload: securePayload,
      warnings: validation.warnings,
      score: validation.score,
      matrixSize: encoded.size,
      version: encoded.version,
      validation,
      svg: typeof rendered === "string" ? rendered : undefined,
      png: Buffer.isBuffer(rendered) ? rendered : undefined
    };
  }

  function inspect(options: GenerateQROptions): PayloadInspection {
    const merged = mergeOptions(defaults, options);
    const normalizedData = merged.data;
    const payload = buildPayload(merged.type, merged.data, { type: merged.type });
    const warnings = merged.security?.warnUnsafe ? detectUnsafePayload(payload) : [];
    if ((merged.security?.blockUnsafe || strict) && warnings.length > 0) {
      throw new Error(`Unsafe payload blocked: ${warnings.join(" | ")}`);
    }
    return { type: merged.type, payload, normalizedData, warnings };
  }

  function validatePayload(payload: string, options?: Partial<GenerateQROptions>): ValidationReport {
    const merged = mergeOptions(defaults, {
      type: "custom",
      data: { payload },
      ...options
    } as GenerateQROptions);
    const hardened = hardenForScanReliability(merged);
    return buildValidationReport({
      matrixSize: encodeQR(payload, hardened.options.core).size,
      style: hardened.options.style,
      errorCorrectionLevel: hardened.options.core?.errorCorrectionLevel ?? "Q",
      logoSize: hardened.options.logo?.size,
      margin: hardened.options.core?.margin,
      warnings: [...detectUnsafePayload(payload), ...hardened.warnings]
    });
  }

  return {
    generate,
    batch: (items, options) => runBatch(items, generate, options),
    stream: (items, options) => runStreamBatch(items, generate, options),
    inspect,
    validatePayload
  };
}

function applySecurity(payload: string, options: GenerateQROptions): string {
  let out = payload;
  const meta: Record<string, string> = {};
  const security = options.security;
  if (!security) return out;

  if (security.expiresAt) {
    const d = new Date(security.expiresAt);
    if (Number.isNaN(d.valueOf())) throw new Error("Invalid expiresAt date.");
    meta.exp = d.toISOString();
  }
  if (security.token) meta.token = security.token;
  if (Object.keys(meta).length > 0) out = `SECURE_META::${JSON.stringify(meta)}::${out}`;

  if (security.sign) {
    if (!security.signingSecret) throw new Error("signingSecret is required when sign=true.");
    const signature = signPayload(out, security.signingSecret);
    out = `SIGNED::${signature}::${out}`;
  }
  if (security.encrypt) {
    if (!security.password) throw new Error("password is required when encrypt=true.");
    out = `ENCRYPTED::${encryptPayload(out, security.password)}`;
  }
  return out;
}

export function decryptQRPayload(encryptedPayload: string, password: string): string {
  if (!encryptedPayload.startsWith("ENCRYPTED::")) throw new Error("Payload is not encrypted.");
  return decryptPayload(encryptedPayload.replace("ENCRYPTED::", ""), password);
}

export function verifySignedPayload(payload: string, signingSecret: string): boolean {
  if (!payload.startsWith("SIGNED::")) return false;
  const [, signature, raw] = payload.split("::", 3);
  return verifyPayloadSignature(raw, signature, signingSecret);
}

export function isExpired(payload: string, now = new Date()): boolean {
  const match = payload.match(/^SECURE_META::(\{.*?\})::/);
  if (!match) return false;
  const meta = JSON.parse(match[1]) as { exp?: string };
  if (!meta.exp) return false;
  return now > new Date(meta.exp);
}

export { renderToCanvas };

function hardenForScanReliability(options: GenerateQROptions): { options: GenerateQROptions; warnings: string[] } {
  const warnings: string[] = [];
  const style = mergeTheme(options.style);
  const core = { ...(options.core ?? {}) };
  const validation = { ...(options.validation ?? {}) };
  const logo = options.logo ? { ...options.logo } : undefined;

  if ((core.margin ?? 4) < 4) {
    core.margin = 4;
    warnings.push("Quiet zone margin was raised to 4 modules for scanner compatibility.");
  }

  core.errorCorrectionLevel = logo ? "H" : (core.errorCorrectionLevel ?? "Q");

  if (style.shapeMask && style.shapeMask !== "none") {
    style.shapeMask = "none";
    warnings.push("Shape masks are disabled for reliable scanning.");
  }

  if (style.blur && style.blur > 0) {
    style.blur = 0;
    warnings.push("Blur effects were disabled for reliable scanning.");
  }

  if (style.backgroundStyle?.image || (style.backgroundStyle?.pattern && style.backgroundStyle.pattern !== "none")) {
    style.backgroundStyle = { ...(style.backgroundStyle ?? {}), image: undefined, pattern: "none" };
    warnings.push("Background image/pattern were removed to preserve finder clarity.");
  }

  if (style.transparentBackground || style.backgroundStyle?.transparent) {
    style.transparentBackground = false;
    style.backgroundStyle = { ...(style.backgroundStyle ?? {}), transparent: false };
    style.background = style.background ?? "#FFFFFF";
    warnings.push("Transparent backgrounds were disabled to keep scanner contrast stable.");
  }

  const contrast = contrastRatio(style.foreground ?? "#000000", style.background ?? "#FFFFFF");
  if (!Number.isFinite(contrast) || contrast < 4.5) {
    style.foreground = "#000000";
    style.background = "#FFFFFF";
    style.gradient = undefined;
    warnings.push("Low-contrast colors were replaced with high-contrast black/white for scan reliability.");
  }

  if (logo && (logo.size ?? 0.2) > 0.22) {
    logo.size = 0.22;
    warnings.push("Logo size was reduced to 22% max to preserve scan reliability.");
  }

  validation.minReadabilityScore = Math.max(validation.minReadabilityScore ?? 70, 70);

  return {
    options: {
      ...options,
      style,
      core,
      logo,
      validation
    },
    warnings
  };
}

function parseHexColor(color: string): [number, number, number] | null {
  const c = color.replace("#", "").trim();
  if (![3, 6].includes(c.length)) return null;
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const s = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

function contrastRatio(a: string, b: string): number {
  const ca = parseHexColor(a);
  const cb = parseHexColor(b);
  if (!ca || !cb) return Number.NaN;
  const l1 = luminance(ca);
  const l2 = luminance(cb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
