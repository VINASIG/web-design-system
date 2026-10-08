import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  paletteValues,
  renderTokens,
  checkPalette,
} from "../scripts/palette.mjs";
const bytes = await readFile(
  new URL("../src/data/palette.json", import.meta.url),
);
const data = () => JSON.parse(bytes.toString("utf8"));
test("the reviewed canonical palette, generated CSS and Vietnamese names agree", async () => {
  assert.equal((await checkPalette()).status, "PASS");
  const value = data();
  assert.equal(paletteValues(value).length, 46);
  assert.equal(new Set(paletteValues(value).map((tone) => tone.hex)).size, 45);
  assert.match(renderTokens(value), /--color-scout-blue: #21497b;/);
});
test("corrupted Hex, tokens and identity anchors are rejected", () => {
  const invalid = data();
  invalid.colors[5].foreground = "url(https://example.invalid/)";
  assert.throws(() => paletteValues(invalid), /Hex/);
  const token = data();
  token.colors[5].token = "--color-x; color: red";
  assert.throws(() => paletteValues(token), /token/);
  const identity = data();
  identity.colors[0].foreground = "#08121E";
  assert.throws(() => paletteValues(identity), /inventory|anchor/);
});
test("missing deep tones and foreign formatting identifiers are rejected", () => {
  const missing = data();
  missing.colors[0].backgrounds = [];
  assert.throws(() => paletteValues(missing), /tone/);
  const foreign = data();
  foreign.colors[0].code = String.fromCodePoint(167) + "t";
  assert.throws(() => paletteValues(foreign), /Formatting codes/);
});
