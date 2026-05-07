# qrx

[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](./LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D18-3C873A.svg)
![Build](https://img.shields.io/badge/build-passing-22c55e.svg)
![Tests](https://img.shields.io/badge/tests-vitest-6e9f18.svg)

Production-grade, extensible QR generation library for modern apps, tooling, and platforms.

## Maintainer

**Developer:** Ahmad Bin Tahir

## Highlights

- ISO-compliant QR generation with version/mask/ECC control
- Rich payload builders (URL, Wi-Fi, payment, social, vCard, calendar, and more)
- Advanced design system (dots/corners, gradients, masks, logos, themes, effects)
- Security pipeline (validation, unsafe detection, signing, encryption, expiry metadata)
- Batch + streaming generation APIs
- CLI tooling + framework adapters (React, Vue, Svelte, Next)
- Plugin/middleware extensibility

## Repository Layout

```text
.
├── src/                   # Core library
├── tests/                 # Unit tests
├── examples/              # Runnable examples + sample SVGs
├── apps/
│   └── docs/              # Unified Docs/Playground app (Next.js)
├── .github/               # CI + issue/PR templates
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

## Installation

```bash
npm i qrx
```

## Quick Start

```ts
import { generateQR } from "qrx";

const result = await generateQR({
  type: "wifi",
  data: {
    ssid: "Office",
    password: "Password123",
    encryption: "WPA"
  },
  style: {
    theme: "neon",
    dots: "rounded",
    corners: "extra-rounded",
    gradient: { type: "radial", stops: ["#00f5d4", "#4361ee"] }
  },
  security: {
    warnUnsafe: true,
    sign: true,
    signingSecret: "my-secret"
  },
  validation: { minReadabilityScore: 70 },
  format: "svg"
});
```

## API

```ts
import { createGenerator, generateQR, inspectPayload, validatePayload } from "qrx";

const generator = createGenerator({
  strict: true,
  defaults: {
    validation: { minReadabilityScore: 70 },
    core: { errorCorrectionLevel: "Q", margin: 4 }
  }
});

const single = await generateQR({
  type: "url",
  data: { url: "https://qrx.dev" },
  style: { theme: "ocean" },
  format: "svg"
});

const batch = await generator.batch([
  { type: "wifi", data: { ssid: "Office", password: "Password123", encryption: "WPA" }, format: "svg" },
  { type: "payment", data: { provider: "upi", vpa: "name@bank", amount: 199 }, format: "svg" }
]);

const inspection = inspectPayload({ type: "text", data: { text: "hello qrx" } });
const report = validatePayload("https://qrx.dev");
```

## CLI

```bash
npm run build
node dist/cli.js generate --type url --data https://example.com --format svg --out out.svg
node dist/cli.js batch --in examples/batch/batch-jobs.json --out-dir out --concurrency 12
node dist/cli.js inspect --type text --data hello
node dist/cli.js validate --payload https://example.com
node dist/cli.js encrypt --payload "hello" --password pass1234
node dist/cli.js sign --payload "hello" --secret my-secret
```

## Examples

```bash
npm run build
npm run example:basic
npm run example:styled
npm run example:batch
npm run example:samples
# or run everything:
npm run example:all
```

Pre-generated SVG samples for all QR types and design presets are available in `examples/samples`.

### Design gallery

| Classic | Minimal | Corporate | Neon |
|---|---|---|---|
| ![classic](examples/samples/design-classic-clean.svg) | ![minimal](examples/samples/design-minimal-rounded.svg) | ![corporate](examples/samples/design-corporate-solid.svg) | ![neon](examples/samples/design-neon-gradient.svg) |

| Midnight | Ocean | Sunset | Forest |
|---|---|---|---|
| ![midnight](examples/samples/design-midnight-contrast.svg) | ![ocean](examples/samples/design-ocean-wave.svg) | ![sunset](examples/samples/design-sunset-soft.svg) | ![forest](examples/samples/design-forest-bold.svg) |

### Type showcase (all generated)

`url`, `app`, `text`, `map`, `wifi`, `media`, `document`, `message`, `social`, `video`, `google`, `payment`, `vcard`, `calendar`, `multi-url`, `link-list`, `booking`, `custom`

## Apps

### Docs/Playground app (Next.js)

```bash
npm install
npm run docs:dev
```

Available routes:
- `/` overview
- `/playground` advanced QR Studio
- `/samples` generated sample gallery
- `/reference` docs reference viewer
- `/api/qr`, `/api/qr-preview`, `/api/generate` generation endpoints

Studio reliability defaults:
- quiet zone margin is enforced at 4+ modules
- ECC defaults to Q (auto H when logo is used)
- low-contrast / unsafe visual effects are auto-hardened with warnings
- theme presets: `classic`, `minimal`, `corporate`, `neon`, `midnight`, `ocean`, `sunset`, `forest`

## Quality & Pipelines

```bash
npm run typecheck
npm test
npm run build
npm run ci
npm run apps:build
npm run benchmark
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md).
