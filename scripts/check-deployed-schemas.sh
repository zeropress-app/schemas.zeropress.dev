#!/usr/bin/env sh
set -eu

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' 0
trap 'exit 1' HUP INT TERM

failed=0
while read -r family version; do
  canonical="https://schemas.zeropress.dev/$family/v$version/schema.json"
  mirror="https://www.schemastore.org/zeropress-$family-$version.json"

  if ! curl -fsSL --retry 1 --connect-timeout 10 --max-time 30 \
    "$canonical" -o "$tmp/canonical.json"; then
    printf 'ERROR: could not download %s\n' "$canonical" >&2
    failed=1
    continue
  fi
  if ! curl -fsSL --retry 1 --connect-timeout 10 --max-time 30 \
    "$mirror" -o "$tmp/mirror.json"; then
    printf 'ERROR: could not download %s\n' "$mirror" >&2
    failed=1
    continue
  fi

  # Include cross-schema references, such as WXR's references to Preview Data.
  sed -E \
    's|https://schemas\.zeropress\.dev/([a-z-]+)/v([0-9]+\.[0-9]+)/schema\.json|https://www.schemastore.org/zeropress-\1-\2.json|g' \
    "$tmp/canonical.json" > "$tmp/expected.json"

  if cmp -s "$tmp/expected.json" "$tmp/mirror.json"; then
    printf 'MATCH: %s v%s\n' "$family" "$version"
  else
    printf 'MISMATCH: %s v%s\n' "$family" "$version"
    diff -u "$tmp/expected.json" "$tmp/mirror.json" || true
    failed=1
  fi
done <<'SCHEMAS'
preview-data 0.7
theme-runtime 0.7
build-pages-config 1.0
wxr-import-base 0.7
SCHEMAS

exit "$failed"
