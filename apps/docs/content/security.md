# Security model

qrx supports:

1. URL sanitization and protocol whitelisting.
2. Unsafe content detection and optional blocking.
3. AES-256-GCM payload encryption with password KDF.
4. Signature generation/verification for tamper checks.
5. Expiry and token metadata embedding.

Recommended defaults for production:

```ts
security: {
  warnUnsafe: true,
  blockUnsafe: true,
  sign: true,
  signingSecret: process.env.QRX_SIGNING_SECRET
}
```
