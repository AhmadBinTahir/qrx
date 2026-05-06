import Link from "next/link";

const snippets = [
  "const generator = createGenerator({ strict: true, defaults: { validation: { minReadabilityScore: 72 } } });",
  "const result = await generator.generate({ type: 'wifi', data: { ssid: 'Office', password: '12345678', encryption: 'WPA' } });",
  "const report = validatePayload('https://example.com');"
];

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <article className="hero-card">
          <h1 style={{ marginTop: 0 }}>Production QR toolkit, now fully unified</h1>
          <p className="muted">
            One docs source, one advanced studio, one consistent architecture. No confusing split docs model.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="nav-pill" href="/playground">
              Open QR Studio
            </Link>
            <Link className="nav-pill" href="/samples">
              Browse samples
            </Link>
            <Link className="nav-pill" href="/reference">
              API reference
            </Link>
          </div>
        </article>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>Why API route exists</h3>
          <p className="muted">
            The studio uses <code>/api/qr</code> in the same app so generation stays stable across browsers and can
            support secure/signed/encrypted flows without client polyfill complexity.
          </p>
          <p className="muted">It is part of this app only, not a separate docs-backend dependency.</p>
        </article>
      </section>

      <section className="section grid">
        <article className="card span-4">
          <h3 style={{ marginTop: 0 }}>Engine</h3>
          <p className="muted">ISO-compliant encoding, ECC controls, mask/version options, reliability scoring.</p>
        </article>
        <article className="card span-4">
          <h3 style={{ marginTop: 0 }}>Design</h3>
          <p className="muted">Advanced dot/corner styles, gradients, shape masks, effects, logos, theme presets.</p>
        </article>
        <article className="card span-4">
          <h3 style={{ marginTop: 0 }}>Security</h3>
          <p className="muted">Sanitization, unsafe detection/blocking, encryption, signatures, expiry metadata.</p>
        </article>
      </section>

      <section className="section card">
        <h2 style={{ marginTop: 0 }}>Developer snippet</h2>
        <pre style={{ overflowX: "auto" }}>{snippets.join("\n")}</pre>
      </section>
    </main>
  );
}
