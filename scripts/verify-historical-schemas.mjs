import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HISTORICAL_SCHEMAS = Object.freeze([
  Object.freeze({
    relativePath: "preview-data/v0.5/schema.json",
    sha256: "079acbf105e205704b9d60a66db90ea56800b7f9ad369c61cadb7aa4281c989b",
  }),
  Object.freeze({
    relativePath: "preview-data/v0.6/schema.json",
    sha256: "688caccf24d0cffd53b0a33cb5be6f8ecbc7596aef8ad9de82e939a0e2d0a20f",
  }),
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const schemaRoot = resolveFromRepoRoot(process.argv[2] || "dist");

function resolveFromRepoRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function assertManifestEntry(entry, seenPaths) {
  if (!entry || typeof entry.relativePath !== "string" || entry.relativePath === "") {
    throw new Error("Historical schema entries require a non-empty relativePath");
  }

  if (!/^[a-f0-9]{64}$/.test(entry.sha256)) {
    throw new Error(`${entry.relativePath}: expected a lowercase SHA-256 digest`);
  }

  if (seenPaths.has(entry.relativePath)) {
    throw new Error(`Duplicate historical schema entry: ${entry.relativePath}`);
  }

  seenPaths.add(entry.relativePath);
}

const rootStat = fs.statSync(schemaRoot, { throwIfNoEntry: false });
if (!rootStat || !rootStat.isDirectory()) {
  throw new Error(`Missing schema root directory: ${schemaRoot}`);
}

const seenPaths = new Set();
let failureCount = 0;

for (const entry of HISTORICAL_SCHEMAS) {
  assertManifestEntry(entry, seenPaths);

  const filePath = path.join(schemaRoot, ...entry.relativePath.split("/"));
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });

  if (!stat || !stat.isFile()) {
    failureCount += 1;
    console.error(`MISSING ${entry.relativePath}`);
    continue;
  }

  const actualHash = hashFile(filePath);
  if (actualHash !== entry.sha256) {
    failureCount += 1;
    console.error(`MISMATCH ${entry.relativePath}`);
    console.error(`  expected: ${entry.sha256}`);
    console.error(`  actual:   ${actualHash}`);
    continue;
  }

  console.log(`OK ${entry.relativePath}`);
}

if (failureCount > 0) {
  throw new Error(`${failureCount} historical schema byte check(s) failed`);
}

console.log(`Historical schema byte check passed for ${HISTORICAL_SCHEMAS.length} files`);
