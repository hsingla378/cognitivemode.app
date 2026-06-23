import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const repoRoot = resolve(new URL("../../..", import.meta.url).pathname);
const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");
const layoutSource = readFileSync(resolve(repoRoot, "apps/web/app/layout.tsx"), "utf8");

test("README visibly discloses the vibe-coded build approach", () => {
  assert.match(readme, /> \[!IMPORTANT\]/);
  assert.match(readme, /\*\*Vibe Coding Transparency\*\*/);
  assert.match(readme, /This entire project is built using AI Vibe Coding\./);
  assert.doesNotMatch(readme, /<!--[\s\S]*Vibe Coding Transparency[\s\S]*-->/);
});

test("Open Graph image referenced by metadata exists in public assets", () => {
  const match = layoutSource.match(/url:\s*"https:\/\/cognitivemode\.app\/([^"]+)"/);
  assert.ok(match, "Expected layout metadata to reference an absolute Open Graph image URL");

  const publicAssetPath = resolve(repoRoot, "apps/web/public", match[1]);
  assert.ok(existsSync(publicAssetPath), `Missing public asset: ${match[1]}`);
});
