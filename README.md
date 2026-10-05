# ZeroPress Schemas

Canonical JSON Schema host for ZeroPress contract files.

This repository is intentionally small. It publishes static schema files for editor validation, `$schema` references, and tooling integration.

Current schema families:

- Preview Data
- Theme Runtime
- Build Pages Config
- WXR Import Base

## Canonical schemas and SchemaStore copies

The `schemas.zeropress.dev` repository is the canonical source of ZeroPress
JSON Schemas. The current schemas are also published through
[SchemaStore](https://github.com/SchemaStore/schemastore) under the following filenames.

| Contract               | SchemaStore filename                 |
| ---------------------- | ------------------------------------ |
| Preview Data v0.7       | [zeropress-preview-data-0.7.json](https://www.schemastore.org/zeropress-preview-data-0.7.json)       |
| Theme Runtime v0.7      | [zeropress-theme-runtime-0.7.json](https://www.schemastore.org/zeropress-theme-runtime-0.7.json)      |
| Build Pages Config v1.0 | [zeropress-build-pages-config-1.0.json](https://www.schemastore.org/zeropress-build-pages-config-1.0.json) |
| WXR Import Base v0.7    | [zeropress-wxr-import-base-0.7.json](https://www.schemastore.org/zeropress-wxr-import-base-0.7.json)    |

SchemaStore copies use their own `$id`, reference, and example `$schema` URLs
while preserving the JSON Schema dialect and validation rules.

## Historical schema verification

Historical schemas are pinned by their raw SHA-256 digest. Verify the tracked schema sources locally with:

```sh
node ./scripts/verify-historical-schemas.mjs ./schemas
```

Add another entry to
`HISTORICAL_SCHEMAS` when a currently live schema becomes historical.
