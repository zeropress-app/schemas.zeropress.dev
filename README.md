# ZeroPress Schemas

Canonical JSON Schema host for ZeroPress contract files.

This repository is intentionally small. It publishes static schema files for editor validation, `$schema` references, and tooling integration.

## Historical schema verification

Historical schemas are pinned by their raw SHA-256 digest. Verify the tracked schema sources locally with:

```sh
node ./scripts/verify-historical-schemas.mjs ./schemas
```

Add another entry to
`HISTORICAL_SCHEMAS` when a currently live schema becomes historical.
