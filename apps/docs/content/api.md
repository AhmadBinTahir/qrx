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
