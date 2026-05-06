# Architecture

qrx is split into composable layers:

1. **Data builders**: validate/normalize typed input into canonical payloads.
2. **Security pipeline**: unsafe checks, protocol policies, signing/encryption, expiry metadata.
3. **Core encoder**: QR matrix creation with version/mask/ECC control.
4. **Validation engine**: readability score + recommendations.
5. **Renderers**: SVG/PNG/Canvas and custom renderer plugin support.
6. **Runtime integration**: middleware, batch APIs, CLI, framework adapters.
