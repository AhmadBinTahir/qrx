import { mkdirSync, writeFileSync } from "node:fs";
import { generateQR } from "../../dist/index.js";

const outDir = new URL("./", import.meta.url);
mkdirSync(outDir, { recursive: true });

const themes = ["classic", "minimal", "corporate", "neon", "midnight", "ocean", "sunset", "forest"];

const allTypes = [
  { type: "url", data: { url: "https://qrx.dev" } },
  { type: "app", data: { ios: "https://apps.apple.com/app/id123456", android: "https://play.google.com/store/apps/details?id=qrx.app" } },
  { type: "text", data: { text: "qrx production QR toolkit" } },
  { type: "map", data: { lat: 24.8607, lng: 67.0011, label: "Karachi Office" } },
  { type: "wifi", data: { ssid: "QrxHQ", password: "StrongPass123", encryption: "WPA" } },
  { type: "media", data: { kind: "video", url: "https://example.com/media/launch.mp4" } },
  { type: "document", data: { kind: "pdf", url: "https://example.com/docs/qrx-brochure.pdf" } },
  { type: "message", data: { kind: "email", to: "support@example.com", subject: "qrx", body: "Need onboarding help" } },
  { type: "social", data: { platform: "x", usernameOrUrl: "AhmadBinTahir" } },
  { type: "video", data: { platform: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
  { type: "google", data: { service: "forms", url: "https://docs.google.com/forms/d/e/example/viewform" } },
  { type: "payment", data: { provider: "upi", vpa: "name@bank", amount: 199, name: "Qrx Pro" } },
  {
    type: "coupon",
    data: {
      code: "MEGA-40",
      campaign: "summer-launch",
      redeemUrl: "https://qrx.dev/redeem",
      expiresAt: "2026-12-31T23:59:59Z",
      discount: { type: "percent", value: 40 }
    }
  },
  { type: "vcard", data: { firstName: "Ahmad", lastName: "Tahir", org: "Qrx", email: "ahmad@example.com", phone: "+923001234567", url: "https://qrx.dev" } },
  { type: "calendar", data: { title: "Qrx Demo", start: "2026-06-01T09:00:00Z", end: "2026-06-01T10:00:00Z", location: "Online", description: "Product walkthrough" } },
  {
    type: "multi-url",
    data: {
      rules: [
        { condition: "country=pk", url: "https://qrx.dev/pk" },
        { condition: "country=us", url: "https://qrx.dev/us" }
      ],
      fallback: "https://qrx.dev/global"
    }
  },
  {
    type: "link-list",
    data: {
      title: "Qrx Links",
      links: [
        { label: "Website", url: "https://qrx.dev" },
        { label: "Docs", url: "https://qrx.dev/docs" },
        { label: "GitHub", url: "https://github.com/AhmadBinTahir/qrx" }
      ]
    }
  },
  { type: "booking", data: { platform: "booking", url: "https://booking.com/hotel/pk/example.en-gb.html" } },
  { type: "custom", data: { payload: "QRX::CUSTOM::SHOWCASE::2026" } }
];

for (let i = 0; i < allTypes.length; i += 1) {
  const item = allTypes[i];
  const theme = themes[i % themes.length];
  const out = await generateQR({
    ...item,
    style: { theme },
    validation: { minReadabilityScore: 70 },
    format: "svg"
  });
  writeFileSync(new URL(`./type-${item.type}.svg`, outDir), out.svg ?? "", "utf8");
}

const designShowcase = [
  { name: "design-classic-clean", style: { theme: "classic" } },
  { name: "design-minimal-rounded", style: { theme: "minimal", dots: "rounded", corners: "rounded" } },
  { name: "design-corporate-solid", style: { theme: "corporate", dots: "square", corners: "square" } },
  { name: "design-neon-gradient", style: { theme: "neon", gradient: { type: "linear", angle: 35, stops: ["#00F5D4", "#4CC9F0"] } } },
  { name: "design-midnight-contrast", style: { theme: "midnight" } },
  { name: "design-ocean-wave", style: { theme: "ocean", dots: "rounded", corners: "extra-rounded" } },
  { name: "design-sunset-soft", style: { theme: "sunset", dots: "extra-rounded", corners: "extra-rounded" } },
  { name: "design-forest-bold", style: { theme: "forest", dots: "square", corners: "rounded" } }
];

for (const entry of designShowcase) {
  const out = await generateQR({
    type: "url",
    data: { url: "https://qrx.dev/showcase" },
    style: entry.style,
    validation: { minReadabilityScore: 70 },
    format: "svg"
  });
  writeFileSync(new URL(`./${entry.name}.svg`, outDir), out.svg ?? "", "utf8");
}

console.log(`Generated ${allTypes.length} type SVGs and ${designShowcase.length} design SVGs in examples/samples`);
