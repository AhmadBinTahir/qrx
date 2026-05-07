# Contributing to qrx

Thanks for helping improve qrx.

## Development setup

```bash
npm ci --workspaces --include-workspace-root
npm run ci
npm run apps:build
```

## Project standards

1. Keep API additions backward compatible unless discussed in an issue first.
2. Add tests for behavior changes in `tests/`.
3. Keep validation and security behavior explicit (no silent fallbacks).
4. Update docs/examples when adding user-facing features.

## Pull requests

1. Create an issue (or reference an existing one).
2. Keep PRs focused and modular.
3. Ensure `npm run ci` passes.
4. Fill the PR template with scope, testing, and compatibility notes.

## Commit style

Suggested prefixes:
- `feat:` new functionality
- `fix:` bug fix
- `docs:` docs changes
- `refactor:` internal improvement
- `test:` test updates
