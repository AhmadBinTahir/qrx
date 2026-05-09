# API guide

```ts
import { createGenerator, generateQR, inspectPayload, validatePayload } from "qrx";
```

## `generateQR(options)`

Simple global generator for most users.

## `createGenerator(config)`

Use for strict and controlled environments:

```ts
const generator = createGenerator({
  strict: true,
  protocolWhitelist: ["https", "mailto", "tel"],
  defaults: {
    format: "svg",
    validation: { minReadabilityScore: 72 }
  }
});
```

Then:

```ts
await generator.generate({ type: "url", data: { url: "https://example.com" } });
await generator.batch([...], { concurrency: 16 });
```

Coupon payloads are available as a first-class type:

```ts
await generateQR({
  type: "coupon",
  data: {
    code: "MEGA-40",
    campaign: "summer-launch",
    redeemUrl: "https://example.com/redeem",
    expiresAt: "2026-12-31T23:59:59Z",
    discount: { type: "percent", value: 40 }
  },
  format: "svg"
});
```
