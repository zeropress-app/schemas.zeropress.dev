import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distDir = resolveFromRepoRoot(process.argv[2] || "dist");
const schemaIdPrefix = "https://schemas.zeropress.dev/";

function resolveFromRepoRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function assertFile(filePath) {
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });

  if (!stat || !stat.isFile()) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function collectSchemaFiles(rootDir) {
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === "schema.json") {
        files.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return files.sort();
}

function validateSchemaFile(filePath) {
  const schema = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (typeof schema.$id !== "string") {
    throw new Error(`${filePath}: missing $id`);
  }

  if (!schema.$id.startsWith(schemaIdPrefix)) {
    throw new Error(`${filePath}: expected $id to start with ${schemaIdPrefix}`);
  }
}

assertFile(path.join(distDir, "index.html"));

const schemaFiles = collectSchemaFiles(distDir);

if (schemaFiles.length === 0) {
  throw new Error(`No schema.json files found in ${distDir}`);
}

for (const filePath of schemaFiles) {
  validateSchemaFile(filePath);
}

console.log(`Validated ${schemaFiles.length} schema files in ${path.relative(repoRoot, distDir) || "."}`);
