import { createCipheriv, createDecipheriv, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";

const ITERATIONS = 120_000;
const KEYLEN = 32;
const DIGEST = "sha256";

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);
}

export function encryptPayload(payload: string, password: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(password, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    alg: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    i: ITERATIONS,
    s: salt.toString("base64"),
    v: iv.toString("base64"),
    t: tag.toString("base64"),
    d: encrypted.toString("base64")
  });
}

export function decryptPayload(encryptedPacket: string, password: string): string {
  const parsed = JSON.parse(encryptedPacket) as {
    s: string;
    v: string;
    t: string;
    d: string;
    i?: number;
  };
  const salt = Buffer.from(parsed.s, "base64");
  const iv = Buffer.from(parsed.v, "base64");
  const tag = Buffer.from(parsed.t, "base64");
  const data = Buffer.from(parsed.d, "base64");
  const key = pbkdf2Sync(password, salt, parsed.i ?? ITERATIONS, KEYLEN, DIGEST);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyPayloadSignature(payload: string, signature: string, secret: string): boolean {
  return signPayload(payload, secret) === signature;
}
