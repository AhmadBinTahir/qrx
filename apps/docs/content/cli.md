# CLI guide

Build first:

```bash
npm run build
```

Generate:

```bash
node dist/cli.js generate --type url --data https://example.com --format svg --out out.svg
```

Batch:

```bash
node dist/cli.js batch --in jobs.json --out-dir out --concurrency 12
```

Inspect and validate:

```bash
node dist/cli.js inspect --type text --data hello
node dist/cli.js validate --payload https://example.com
```
