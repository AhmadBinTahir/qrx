"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "neon" | "minimal" | "corporate" | "classic";
type Dot = "square" | "rounded" | "diamond" | "classy" | "extra-rounded";
type Corner = "square" | "rounded" | "extra-rounded" | "classy";
type Mask = "none" | "circle" | "heart";
type ECC = "L" | "M" | "Q" | "H";

interface StudioState {
  type: "url" | "text" | "wifi" | "payment" | "social" | "custom";
  dataRaw: string;
  theme: Theme;
  dots: Dot;
  corners: Corner;
  mask: Mask;
  foreground: string;
  background: string;
  gradientA: string;
  gradientB: string;
  gradientType: "linear" | "radial";
  logoSrc: string;
  logoSize: number;
  margin: number;
  ecc: ECC;
}

const starters: Record<StudioState["type"], string> = {
  url: JSON.stringify({ url: "https://example.com" }, null, 2),
  text: JSON.stringify({ text: "Hello from qrx" }, null, 2),
  wifi: JSON.stringify({ ssid: "Office", password: "Password123", encryption: "WPA" }, null, 2),
  payment: JSON.stringify({ provider: "upi", vpa: "name@bank", amount: 199 }, null, 2),
  social: JSON.stringify({ platform: "instagram", usernameOrUrl: "github" }, null, 2),
  custom: JSON.stringify({ payload: "custom://payload" }, null, 2)
};

const defaultState: StudioState = {
  type: "url",
  dataRaw: starters.url,
  theme: "neon",
  dots: "rounded",
  corners: "extra-rounded",
  mask: "none",
  foreground: "#111111",
  background: "#ffffff",
  gradientA: "#3a0ca3",
  gradientB: "#4cc9f0",
  gradientType: "linear",
  logoSrc: "",
  logoSize: 0.2,
  margin: 2,
  ecc: "Q"
};

export default function PlaygroundPage() {
  const [state, setState] = useState<StudioState>(defaultState);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [payload, setPayload] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const requestBody = useMemo(() => {
    return {
      type: state.type,
      data: JSON.parse(state.dataRaw),
      format: "svg",
      core: { errorCorrectionLevel: state.ecc, margin: state.margin },
      style: {
        theme: state.theme,
        dots: state.dots,
        corners: state.corners,
        shapeMask: state.mask,
        foreground: state.foreground,
        background: state.background,
        gradient: {
          type: state.gradientType,
          stops: [state.gradientA, state.gradientB]
        }
      },
      logo: state.logoSrc ? { src: state.logoSrc, size: state.logoSize } : undefined,
      security: { warnUnsafe: true }
    };
  }, [state]);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/qr", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        setSvg(data.svg ?? "");
        setScore(data.score ?? null);
        setWarnings(data.warnings ?? []);
        setPayload(data.payload ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid request");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [requestBody]);

  return (
    <main className="container">
      <h1>QR Studio</h1>
      <p className="muted">Deep customization with live generation, validation score, and export-ready SVG.</p>

      <section className="studio-layout section">
        <article className="card">
          <div className="row-2">
            <div className="field">
              <label>Type</label>
              <select
                value={state.type}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    type: e.target.value as StudioState["type"],
                    dataRaw: starters[e.target.value as StudioState["type"]]
                  }))
                }
              >
                <option value="url">URL</option>
                <option value="text">Text</option>
                <option value="wifi">Wi-Fi</option>
                <option value="payment">Payment</option>
                <option value="social">Social</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="field">
              <label>Theme</label>
              <select value={state.theme} onChange={(e) => setState((prev) => ({ ...prev, theme: e.target.value as Theme }))}>
                <option value="neon">neon</option>
                <option value="minimal">minimal</option>
                <option value="corporate">corporate</option>
                <option value="classic">classic</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Data JSON</label>
            <textarea value={state.dataRaw} onChange={(e) => setState((prev) => ({ ...prev, dataRaw: e.target.value }))} />
          </div>

          <div className="row-2">
            <div className="field">
              <label>Dots style</label>
              <select value={state.dots} onChange={(e) => setState((prev) => ({ ...prev, dots: e.target.value as Dot }))}>
                <option value="square">square</option>
                <option value="rounded">rounded</option>
                <option value="diamond">diamond</option>
                <option value="classy">classy</option>
                <option value="extra-rounded">extra-rounded</option>
              </select>
            </div>
            <div className="field">
              <label>Corners style</label>
              <select value={state.corners} onChange={(e) => setState((prev) => ({ ...prev, corners: e.target.value as Corner }))}>
                <option value="square">square</option>
                <option value="rounded">rounded</option>
                <option value="extra-rounded">extra-rounded</option>
                <option value="classy">classy</option>
              </select>
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Foreground</label>
              <input type="color" value={state.foreground} onChange={(e) => setState((prev) => ({ ...prev, foreground: e.target.value }))} />
            </div>
            <div className="field">
              <label>Background</label>
              <input type="color" value={state.background} onChange={(e) => setState((prev) => ({ ...prev, background: e.target.value }))} />
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Gradient A</label>
              <input type="color" value={state.gradientA} onChange={(e) => setState((prev) => ({ ...prev, gradientA: e.target.value }))} />
            </div>
            <div className="field">
              <label>Gradient B</label>
              <input type="color" value={state.gradientB} onChange={(e) => setState((prev) => ({ ...prev, gradientB: e.target.value }))} />
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Gradient type</label>
              <select value={state.gradientType} onChange={(e) => setState((prev) => ({ ...prev, gradientType: e.target.value as "linear" | "radial" }))}>
                <option value="linear">linear</option>
                <option value="radial">radial</option>
              </select>
            </div>
            <div className="field">
              <label>Shape mask</label>
              <select value={state.mask} onChange={(e) => setState((prev) => ({ ...prev, mask: e.target.value as Mask }))}>
                <option value="none">none</option>
                <option value="circle">circle</option>
                <option value="heart">heart</option>
              </select>
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Error correction</label>
              <select value={state.ecc} onChange={(e) => setState((prev) => ({ ...prev, ecc: e.target.value as ECC }))}>
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="Q">Q</option>
                <option value="H">H</option>
              </select>
            </div>
            <div className="field">
              <label>Margin</label>
              <input
                type="number"
                min={0}
                max={8}
                value={state.margin}
                onChange={(e) => setState((prev) => ({ ...prev, margin: Number(e.target.value || 2) }))}
              />
            </div>
          </div>

          <div className="row-2">
            <div className="field">
              <label>Logo URL (optional)</label>
              <input value={state.logoSrc} onChange={(e) => setState((prev) => ({ ...prev, logoSrc: e.target.value }))} />
            </div>
            <div className="field">
              <label>Logo size</label>
              <input
                type="number"
                min={0.08}
                max={0.35}
                step={0.01}
                value={state.logoSize}
                onChange={(e) => setState((prev) => ({ ...prev, logoSize: Number(e.target.value || 0.2) }))}
              />
            </div>
          </div>
        </article>

        <article className="card">
          <div className="preview-shell">
            {error ? <p style={{ color: "#ff9ea8", padding: 12 }}>{error}</p> : null}
            {!error && svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
            {!error && !svg ? <p className="muted">{loading ? "Generating..." : "No preview yet"}</p> : null}
          </div>

          <div className="section">
            <div className="kv"><strong>Score</strong><span>{score ?? "-"}</span></div>
            <div className="kv"><strong>Warnings</strong><span>{warnings.length}</span></div>
            <div className="kv"><strong>Status</strong><span style={{ color: loading ? "var(--warn)" : "var(--ok)" }}>{loading ? "updating" : "ready"}</span></div>
          </div>

          <div className="section">
            <button
              className="btn"
              onClick={() => {
                if (!svg) return;
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${state.type}-qr.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download SVG
            </button>
          </div>

          <div className="section">
            <details>
              <summary>Generated payload</summary>
              <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{payload}</pre>
            </details>
          </div>
        </article>
      </section>
    </main>
  );
}
