import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        }
        catch {
            setError("Invalid JSON");
            return "";
        }
    }, [apiBase, cornerStyle, data, dotStyle, theme, type]);
    return (_jsxs("main", { className: "container", children: [_jsx("h1", { children: "qrx studio playground" }), _jsx("p", { children: "Customizable preview client using the docs app generator route." }), _jsxs("section", { className: "panel", children: [_jsx("label", { children: "API base" }), _jsx("input", { value: apiBase, onChange: (e) => setApiBase(e.target.value) }), _jsx("label", { children: "Type" }), _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "url", children: "url" }), _jsx("option", { value: "text", children: "text" }), _jsx("option", { value: "wifi", children: "wifi" }), _jsx("option", { value: "payment", children: "payment" }), _jsx("option", { value: "custom", children: "custom" })] }), _jsx("label", { children: "Theme" }), _jsxs("select", { value: theme, onChange: (e) => setTheme(e.target.value), children: [_jsx("option", { value: "neon", children: "neon" }), _jsx("option", { value: "minimal", children: "minimal" }), _jsx("option", { value: "corporate", children: "corporate" }), _jsx("option", { value: "classic", children: "classic" })] }), _jsx("label", { children: "Dots" }), _jsxs("select", { value: dotStyle, onChange: (e) => setDotStyle(e.target.value), children: [_jsx("option", { value: "square", children: "square" }), _jsx("option", { value: "rounded", children: "rounded" }), _jsx("option", { value: "diamond", children: "diamond" }), _jsx("option", { value: "classy", children: "classy" }), _jsx("option", { value: "extra-rounded", children: "extra-rounded" })] }), _jsx("label", { children: "Corners" }), _jsxs("select", { value: cornerStyle, onChange: (e) => setCornerStyle(e.target.value), children: [_jsx("option", { value: "square", children: "square" }), _jsx("option", { value: "rounded", children: "rounded" }), _jsx("option", { value: "extra-rounded", children: "extra-rounded" }), _jsx("option", { value: "classy", children: "classy" })] }), _jsx("label", { children: "Data JSON" }), _jsx("textarea", { value: data, onChange: (e) => setData(e.target.value) })] }), _jsx("section", { className: "panel", children: error ? _jsx("p", { style: { color: "#ffacb6" }, children: error }) : _jsx("img", { src: previewUrl, alt: "live qr", width: 380, height: 380 }) })] }));
}
