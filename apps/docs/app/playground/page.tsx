"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "neon" | "minimal" | "corporate" | "classic" | "midnight" | "ocean" | "sunset" | "forest";
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
  useGradient: boolean;
  logoSrc: string;
  logoSize: number;
  margin: number;
  ecc: ECC;
}

const themePresets: Record<Theme, Pick<StudioState, "dots" | "corners" | "foreground" | "background" | "gradientA" | "gradientB" | "gradientType" | "useGradient">> = {
  classic: {
    dots: "square",
    corners: "square",
    foreground: "#000000",
    background: "#ffffff",
    gradientA: "#000000",
    gradientB: "#000000",
    gradientType: "linear",
    useGradient: false
  },
  minimal: {
    dots: "square",
    corners: "rounded",
    foreground: "#111111",
    background: "#ffffff",
    gradientA: "#111111",
    gradientB: "#111111",
    gradientType: "linear",
    useGradient: false
  },
  corporate: {
    dots: "rounded",
    corners: "rounded",
    foreground: "#0A2463",
    background: "#ffffff",
    gradientA: "#0A2463",
    gradientB: "#173C8A",
    gradientType: "linear",
    useGradient: false
  },
  neon: {
    dots: "rounded",
    corners: "extra-rounded",
    foreground: "#00f5d4",
    background: "#10002b",
    gradientA: "#00f5d4",
    gradientB: "#4cc9f0",
    gradientType: "linear",
    useGradient: true
  },
  midnight: {
    dots: "rounded",
    corners: "rounded",
    foreground: "#ffffff",
    background: "#0b1020",
    gradientA: "#ffffff",
    gradientB: "#cbd5e1",
    gradientType: "linear",
    useGradient: false
  },
  ocean: {
    dots: "rounded",
    corners: "rounded",
    foreground: "#0b3c5d",
    background: "#f3faff",
    gradientA: "#0b3c5d",
    gradientB: "#1d70a2",
    gradientType: "linear",
    useGradient: true
  },
  sunset: {
    dots: "rounded",
    corners: "extra-rounded",
    foreground: "#5a189a",
    background: "#fff7ed",
    gradientA: "#5a189a",
    gradientB: "#d0006f",
    gradientType: "linear",
    useGradient: true
  },
  forest: {
    dots: "square",
    corners: "rounded",
    foreground: "#1b4332",
    background: "#f1faee",
    gradientA: "#1b4332",
    gradientB: "#2d6a4f",
    gradientType: "linear",
    useGradient: true
  }
};

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
  theme: "classic",
  dots: themePresets.classic.dots,
  corners: themePresets.classic.corners,
  mask: "none",
  foreground: themePresets.classic.foreground,
  background: themePresets.classic.background,
  gradientA: themePresets.classic.gradientA,
  gradientB: themePresets.classic.gradientB,
  gradientType: themePresets.classic.gradientType,
  useGradient: themePresets.classic.useGradient,
  logoSrc: "",
  logoSize: 0.2,
  margin: 4,
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
  const [parseError, setParseError] = useState<string>("");

  const requestBody = useMemo(() => {
    try {
      const parsedData = JSON.parse(state.dataRaw);
      return {
        body: {
          type: state.type,
          data: parsedData,
          format: "svg",
          core: { errorCorrectionLevel: state.ecc, margin: state.margin },
          style: {
            theme: state.theme,
            dots: state.dots,
            corners: state.corners,
            shapeMask: state.mask,
            foreground: state.foreground,
            background: state.background,
            gradient: state.useGradient
              ? {
                  type: state.gradientType,
                  stops: [state.gradientA, state.gradientB]
                }
              : undefined
          },
          logo: state.logoSrc ? { src: state.logoSrc, size: state.logoSize } : undefined,
          security: { warnUnsafe: true }
        },
        parseError: ""
      };
    } catch (error) {
      return {
        body: null,
        parseError: error instanceof Error ? error.message : "Invalid JSON payload"
      };
    }
  }, [state]);

  useEffect(() => {
    if (requestBody.body === null) {
      setParseError(requestBody.parseError);
      setError("");
      setSvg("");
      setScore(null);
      setWarnings([]);
      setPayload("");
      setLoading(false);
      return;
    }

    setParseError("");
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/qr", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(requestBody.body),
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        setSvg(data.svg ?? "");
        setScore(data.score ?? null);
        setWarnings(data.warnings ?? []);
        setPayload(data.payload ?? "");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
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
              <select
                value={state.theme}
                onChange={(e) => {
                  const nextTheme = e.target.value as Theme;
                  setState((prev) => ({ ...prev, theme: nextTheme, ...themePresets[nextTheme] }));
                }}
              >
                <option value="neon">neon</option>
                <option value="minimal">minimal</option>
                <option value="corporate">corporate</option>
                <option value="classic">classic</option>
                <option value="midnight">midnight</option>
                <option value="ocean">ocean</option>
                <option value="sunset">sunset</option>
                <option value="forest">forest</option>
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
              <label>Use gradient</label>
              <select
                value={state.useGradient ? "yes" : "no"}
                onChange={(e) => setState((prev) => ({ ...prev, useGradient: e.target.value === "yes" }))}
              >
                <option value="no">no</option>
                <option value="yes">yes</option>
              </select>
            </div>
          </div>

          <div className="row-2">
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
                min={4}
                max={8}
                value={state.margin}
                onChange={(e) => setState((prev) => ({ ...prev, margin: Number(e.target.value || 4) }))}
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
                max={0.22}
                step={0.01}
                value={state.logoSize}
                onChange={(e) => setState((prev) => ({ ...prev, logoSize: Number(e.target.value || 0.2) }))}
              />
            </div>
          </div>
        </article>

        <article className="card">
          <div className="preview-shell">
            {parseError ? <p style={{ color: "#ff9ea8", padding: 12 }}>{parseError}</p> : null}
            {error ? <p style={{ color: "#ff9ea8", padding: 12 }}>{error}</p> : null}
            {!error && svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
            {!error && !parseError && !svg ? <p className="muted">{loading ? "Generating..." : "No preview yet"}</p> : null}
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
