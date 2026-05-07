# qrx examples

## Run all

```bash
npm run build
npm run example:all
```

Outputs are written into each example folder.

## Attached sample SVGs

Pre-generated sample files are available in `examples/samples`:

1. **All QR types** (`type-*.svg`):
   `type-url.svg`, `type-app.svg`, `type-text.svg`, `type-map.svg`, `type-wifi.svg`, `type-media.svg`, `type-document.svg`, `type-message.svg`, `type-social.svg`, `type-video.svg`, `type-google.svg`, `type-payment.svg`, `type-vcard.svg`, `type-calendar.svg`, `type-multi-url.svg`, `type-link-list.svg`, `type-booking.svg`, `type-custom.svg`
2. **Design showcase** (`design-*.svg`):
   `design-classic-clean.svg`, `design-minimal-rounded.svg`, `design-corporate-solid.svg`, `design-neon-gradient.svg`, `design-midnight-contrast.svg`, `design-ocean-wave.svg`, `design-sunset-soft.svg`, `design-forest-bold.svg`

To regenerate samples:

```bash
npm run build
npm run example:samples
```
