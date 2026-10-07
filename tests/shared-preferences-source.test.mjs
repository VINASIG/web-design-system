import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
void test("adopted preference runtime matches the reviewed source digest", () => {
  /** @type {unknown} */
  /** @type {unknown} */
  /** @type {unknown} */
  /** @type {unknown} */
  /** @type {unknown} */
  const record = JSON.parse(
    readFileSync("docs/SHARED_PREFERENCES.json", "utf8"),
  );
  assert.ok(
    typeof record === "object" &&
      record !== null &&
      "sha256" in record &&
      typeof record.sha256 === "string",
  );
  const bytes = readFileSync(
    "src/scripts/shared-preferences.js",
    "utf8",
  ).replace(/\r\n/g, "\n");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256);
});
