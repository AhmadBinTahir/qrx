import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const files = [
  "index.md",
  "architecture.md",
  "api.md",
  "security.md",
  "cli.md"
];

export default async function ReferencePage() {
  const content = await Promise.all(
    files.map(async (file) => ({
      file,
      text: await readFile(resolve(process.cwd(), "content", file), "utf8")
    }))
  );

  return (
    <main className="container">
      <h1>Reference</h1>
      <p className="muted">Single source docs content inside this app: <code>apps/docs/content</code>.</p>
      <section className="section">
        {content.map((doc) => (
          <article className="card" key={doc.file} style={{ marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>{doc.file}</h3>
            <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{doc.text}</pre>
          </article>
        ))}
      </section>
    </main>
  );
}
