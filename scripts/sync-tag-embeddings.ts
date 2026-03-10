import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { syncTagEmbeddings } from "../lib/tag-suggestions/embedding-sync";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const raw = readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
loadEnvFile(resolve(projectRoot, ".env"));
loadEnvFile(resolve(projectRoot, ".env.local"));

function readNumericFlag(name: string): number | undefined {
  const prefix = `${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  if (!arg) return undefined;

  const parsed = Number.parseInt(arg.slice(prefix.length), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function main() {
  const limit = readNumericFlag("--limit");
  const batchSize = readNumericFlag("--batch-size");
  const force = process.argv.includes("--force");

  const result = await syncTagEmbeddings({
    limit,
    batchSize,
    force,
  });

  if (result.skipped) {
    console.log(
      "Skipped tag embedding sync because OPENROUTER_API_KEY is not configured.",
    );
    return;
  }

  console.log(
    `Tag embedding sync complete. Scanned ${result.scanned} tags and synced ${result.synced}.`,
  );
}

main().catch((error) => {
  console.error("Tag embedding sync failed:", error);
  process.exitCode = 1;
});
