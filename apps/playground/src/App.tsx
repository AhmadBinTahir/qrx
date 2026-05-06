import { useMemo, useState } from "react";

export function App() {
  const [data, setData] = useState("{\n  \"url\": \"https://example.com\"\n}");
  const [type, setType] = useState("url");
  const [theme, setTheme] = useState("neon");
  const [apiBase, setApiBase] = useState("http://localhost:3001");
  const [dotStyle, setDotStyle] = useState("rounded");
  const [cornerStyle, setCornerStyle] = useState("extra-rounded");
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    try {
      const parsed = JSON.parse(data);
      const payload = {
        type,
        data: parsed,
        format: "svg",
        style: { theme, dots: dotStyle, corners: cornerStyle, gradient: { type: "linear", stops: ["#3a0ca3", "#4cc9f0"] } }
      };
      const encoded = encodeURIComponent(JSON.stringify(payload));
      setError("");
      return `${apiBase}/api/qr-preview?payload=${encoded}`;
    } catch {
      setError("Invalid JSON");
      return "";
    }
  }, [apiBase, cornerStyle, data, dotStyle, theme, type]);

  return (
    <main className="container">
      <h1>qrx studio playground</h1>
      <p>Customizable preview client using the docs app generator route.</p>

      <section className="panel">
        <label>API base</label>
        <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="url">url</option>
          <option value="text">text</option>
          <option value="wifi">wifi</option>
          <option value="payment">payment</option>
          <option value="custom">custom</option>
        </select>
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="neon">neon</option>
          <option value="minimal">minimal</option>
          <option value="corporate">corporate</option>
          <option value="classic">classic</option>
        </select>
        <label>Dots</label>
        <select value={dotStyle} onChange={(e) => setDotStyle(e.target.value)}>
          <option value="square">square</option>
          <option value="rounded">rounded</option>
          <option value="diamond">diamond</option>
          <option value="classy">classy</option>
          <option value="extra-rounded">extra-rounded</option>
        </select>
        <label>Corners</label>
        <select value={cornerStyle} onChange={(e) => setCornerStyle(e.target.value)}>
          <option value="square">square</option>
          <option value="rounded">rounded</option>
          <option value="extra-rounded">extra-rounded</option>
          <option value="classy">classy</option>
        </select>
        <label>Data JSON</label>
        <textarea value={data} onChange={(e) => setData(e.target.value)} />
      </section>

      <section className="panel">
        {error ? <p style={{ color: "#ffacb6" }}>{error}</p> : <img src={previewUrl} alt="live qr" width={380} height={380} />}
      </section>
    </main>
  );
}
