import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const pageUrl = new URL("../app/goodbye/page.tsx", import.meta.url);
const formUrl = new URL("../app/goodbye/GoodbyeFeedbackForm.tsx", import.meta.url);

test("goodbye page exists at /goodbye", () => {
  assert.ok(existsSync(pageUrl), "Expected app/goodbye/page.tsx to exist");
});

test("goodbye page asks for uninstall feedback reasons", () => {
  const formSource = readFileSync(formUrl, "utf8");

  assert.match(formSource, /Too much friction\?/);
  assert.match(formSource, /Buggy\?/);
  assert.match(formSource, /Didn.t work on my AI tool/);
  assert.match(formSource, /Missing controls/);
});

test("goodbye feedback opens a prefilled Gmail compose to the owner", () => {
  const formSource = readFileSync(formUrl, "utf8");

  assert.match(formSource, /const FEEDBACK_EMAIL = "hsingla378@gmail\.com"/);
  assert.match(formSource, /https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1/);
  assert.match(formSource, /searchParams\.set\("to", FEEDBACK_EMAIL\)/);
  assert.match(formSource, /searchParams\.set\("body", body\)/);
});
