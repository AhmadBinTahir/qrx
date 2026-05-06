import { generateQR } from "qrx";

const sampleConfigs = [
  {
    name: "Neon URL",
    options: {
      type: "url" as const,
      data: { url: "https://example.com" },
      style: {
        theme: "neon" as const,
        dots: "rounded" as const,
        corners: "extra-rounded" as const,
        gradient: { type: "linear" as const, stops: ["#3a0ca3", "#4cc9f0"] }
      },
      format: "svg" as const
    }
  },
  {
    name: "Wi-Fi Corporate",
    options: {
      type: "wifi" as const,
      data: { ssid: "Office", password: "Password123", encryption: "WPA" },
      style: {
        theme: "corporate" as const,
        dots: "square" as const,
        corners: "classy" as const
      },
      format: "svg" as const
    }
  },
  {
    name: "Payment Radial",
    options: {
      type: "payment" as const,
      data: { provider: "upi", vpa: "name@bank", amount: 129.99 },
      style: {
        theme: "minimal" as const,
        dots: "diamond" as const,
        gradient: { type: "radial" as const, stops: ["#111111", "#7f5af0"] }
      },
      format: "svg" as const
    }
  }
];

export default async function SamplesPage() {
  const rendered = await Promise.all(sampleConfigs.map(async (sample) => ({
    ...sample,
    output: await generateQR(sample.options)
  })));

  return (
    <main className="container">
      <h1>QR Samples</h1>
      <p className="muted">Real generated samples with production options.</p>
      <section className="grid section">
        {rendered.map((sample) => (
          <article className="card span-4" key={sample.name}>
            <h3 style={{ marginTop: 0 }}>{sample.name}</h3>
            <div className="preview-shell" style={{ minHeight: 280, marginBottom: 12 }}>
              <div dangerouslySetInnerHTML={{ __html: sample.output.svg ?? "" }} />
            </div>
            <div className="kv">
              <span className="muted">Score</span>
              <strong>{sample.output.score}</strong>
            </div>
            <details>
              <summary>Config</summary>
              <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(sample.options, null, 2)}
              </pre>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}
