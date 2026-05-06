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
  GenerateQROptions,
  GeneratorConfig,
  MiddlewareContext,
  PayloadInspection,
  QRArtifact,
  ValidationReport
} from "./types.js";
import { buildValidationReport } from "./validation/scan.js";

let builtinsRegistered = false;
function ensureBuiltinsRegistered(): void {
  if (builtinsRegistered) return;
  registerRenderer({
    name: "svg",
    render: ({ matrix, options }) => renderSVG(matrix, options.style, options.logo, options.core?.margin ?? 2)
  });
  registerRenderer({
    name: "png",
    render: ({ matrix, options }) => renderPNG(matrix, options.style, options.core?.margin ?? 2)
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

    const securePayload = applySecurity(middlewareCtx.payload, merged);
    assertPayloadProtocolsAllowed(securePayload, merged.security?.strictProtocolWhitelist ?? whitelist);
    const encoded = encodeQR(securePayload, {
      ...merged.core,
      errorCorrectionLevel: merged.logo ? "H" : merged.core?.errorCorrectionLevel
    });

    const validation = buildValidationReport({
      matrixSize: encoded.size,
      style: merged.style,
      errorCorrectionLevel: merged.logo ? "H" : (merged.core?.errorCorrectionLevel ?? "M"),
      logoSize: merged.logo?.size,
      warnings: middlewareCtx.warnings
    });

    if ((merged.validation?.failOnWarnings || strict) && validation.warnings.length > 0) {
      throw new Error(`Validation warnings present: ${validation.warnings.join(" | ")}`);
    }
    if ((merged.validation?.failOnUnsafe || strict) && middlewareCtx.warnings.length > 0) {
      throw new Error(`Unsafe payload warnings: ${middlewareCtx.warnings.join(" | ")}`);
    }
    if (validation.score < (merged.validation?.minReadabilityScore ?? 0)) {
      throw new Error(`Validation score ${validation.score} is below required threshold.`);
    }

    const format = merged.format ?? "svg";
    const renderer = getRenderer(format);
    if (!renderer) throw new Error(`No renderer registered for format "${format}".`);
    const rendered = await renderer.render({
      matrix: encoded.matrix,
      options: merged,
      payload: securePayload,
      size: encoded.size
    });

    return {
      payload: securePayload,
      warnings: middlewareCtx.warnings,
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
    return buildValidationReport({
      matrixSize: encodeQR(payload, merged.core).size,
      style: merged.style,
      errorCorrectionLevel: merged.core?.errorCorrectionLevel ?? "M",
      logoSize: merged.logo?.size,
      warnings: detectUnsafePayload(payload)
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
