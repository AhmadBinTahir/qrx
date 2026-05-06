import { z } from "zod";

const URLSchema = z.string().url();

const DEFAULT_PROTOCOLS = new Set([
  "http",
  "https",
  "mailto",
  "tel",
  "sms",
  "geo",
  "ftp",
  "upi",
  "bitcoin",
  "ethereum",
  "solana"
]);

export function sanitizeUrl(input: string): string {
  const url = URLSchema.parse(input.trim());
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

export function assertProtocolAllowed(raw: string, whitelist?: string[]): void {
  const protocols = new Set((whitelist ?? Array.from(DEFAULT_PROTOCOLS)).map((p) => p.replace(":", "")));
  const protocol = new URL(raw).protocol.replace(":", "").toLowerCase();
  if (!protocols.has(protocol)) {
    throw new Error(`Protocol "${protocol}" is not allowed.`);
  }
}

export function detectUnsafePayload(payload: string): string[] {
  const warnings: string[] = [];
  const lowered = payload.toLowerCase();
  if (lowered.includes("javascript:")) warnings.push("Payload contains javascript: pseudo-protocol.");
  if (lowered.includes("<script")) warnings.push("Payload appears to contain script-like content.");
  if (/(?:\.\.\/)|(?:\.\.\\)/.test(payload)) warnings.push("Payload may contain path traversal sequence.");
  if (/(?:\bdata:text\/html\b)/i.test(payload)) warnings.push("Payload references data:text/html content.");
  if (/(?:\bvbscript:)|(?:\bon\w+\s*=)/i.test(payload)) warnings.push("Payload may include active scripting patterns.");
  return warnings;
}

export function getDefaultProtocolWhitelist(): string[] {
  return Array.from(DEFAULT_PROTOCOLS);
}

export function assertPayloadProtocolsAllowed(payload: string, whitelist?: string[]): void {
  const protocolPattern = /\b([a-z][a-z0-9+\-.]*):/gi;
  const allowed = new Set((whitelist ?? getDefaultProtocolWhitelist()).map((p) => p.toLowerCase().replace(":", "")));
  const ignore = new Set(["begin", "end", "version", "summary", "description", "location", "dtstart", "dtend", "wifi", "signed", "encrypted", "secure_meta"]);
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = protocolPattern.exec(payload))) {
    const protocol = match[1].toLowerCase();
    const nextChar = payload[protocolPattern.lastIndex];
    if (protocol.length === 1) continue;
    if (nextChar === ":") continue;
    if (ignore.has(protocol)) continue;
    found.add(protocol);
  }
  for (const protocol of found) {
    if (!allowed.has(protocol)) {
      throw new Error(`Payload uses disallowed protocol "${protocol}".`);
    }
  }
}
