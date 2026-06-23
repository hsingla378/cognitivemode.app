import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

test("landing page detects extension presence from meta tag and ready event", () => {
  assert.match(pageSource, /useState/);
  assert.match(pageSource, /useEffect/);
  assert.match(pageSource, /type ExtensionInstallState = "checking" \| "installed" \| "missing"/);
  assert.match(pageSource, /useState<ExtensionInstallState>\("checking"\)/);
  assert.match(pageSource, /querySelector\(EXTENSION_META_SELECTOR\)/);
  assert.match(pageSource, /const EXTENSION_READY_EVENT = "cognitivemode:ready"/);
  assert.match(pageSource, /addEventListener\(EXTENSION_READY_EVENT, markInstalled\)/);
  assert.match(pageSource, /removeEventListener\(EXTENSION_READY_EVENT, markInstalled\)/);
});

test("landing page keeps CTA neutral while extension presence is checking", () => {
  assert.match(pageSource, /installState === "checking"/);
  assert.match(pageSource, /Checking extension/);
  assert.match(pageSource, /installState === "missing"/);
});

test("landing page shows installed CTA and toolbar pin hint", () => {
  assert.match(pageSource, /Extension Installed ✓/);
  assert.match(pageSource, /Pin the extension to your toolbar/);
});
