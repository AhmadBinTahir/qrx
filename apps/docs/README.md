# qrx Docs/Playground app

Single Next.js app for:
- documentation front-end
- built-in advanced studio (`/playground`)
- sample gallery (`/samples`)
- reference docs viewer (`/reference`)
- generation endpoints in the same app:
  - `POST /api/qr` (JSON)
  - `GET /api/qr-preview` (quick preview)
  - `GET /api/generate` (backward-compatible SVG route)

The playground applies scan-safe defaults and returns warnings when a style input is auto-hardened for reliability.

## Run

```bash
npm install
npm run docs:dev
```
