import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const schemasDir = path.join(repoRoot, "schemas");
const defaultBaseUrl = "https://schemas.zeropress.dev";
const baseUrl = normalizeBaseUrl(process.argv[2] || defaultBaseUrl);
const retryCount = Number.parseInt(process.env.SCHEMA_COMPARE_RETRIES || "2", 10);
const retryDelayMs = Number.parseInt(process.env.SCHEMA_COMPARE_RETRY_DELAY_MS || "1500", 10);

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
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

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRemoteBuffer(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/schema+json, application/json, */*",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fetchRemoteBuffer(url);
    } catch (error) {
      lastError = error;

      if (attempt < retryCount) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError;
}

const localFiles = collectSchemaFiles(schemasDir);

if (localFiles.length === 0) {
  throw new Error(`No local schema.json files found under ${schemasDir}`);
}

let mismatchCount = 0;

for (const localFile of localFiles) {
  const relativePath = path.relative(schemasDir, localFile).split(path.sep).join("/");
  const remoteUrl = `${baseUrl}/${relativePath}`;
  const localBuffer = fs.readFileSync(localFile);
  const localHash = hashBuffer(localBuffer);

  try {
    const remoteBuffer = await fetchWithRetry(remoteUrl);
    const remoteHash = hashBuffer(remoteBuffer);

    if (remoteHash !== localHash) {
      mismatchCount += 1;
      console.error(`MISMATCH ${relativePath}`);
      console.error(`  local:  ${localHash}`);
      console.error(`  remote: ${remoteHash}`);
      continue;
    }

    console.log(`OK ${relativePath}`);
  } catch (error) {
    mismatchCount += 1;
    console.error(`FAILED ${relativePath}`);
    console.error(`  ${remoteUrl}`);
    console.error(`  ${error.message}`);
  }
}

if (mismatchCount > 0) {
  throw new Error(`${mismatchCount} remote schema check(s) failed`);
}

console.log(`Remote schema check passed for ${localFiles.length} files at ${baseUrl}`);
