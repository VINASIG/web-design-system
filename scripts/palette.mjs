// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
export function paletteValues(data) {
  assert.equal(data.format, 2, "Unsupported palette format");
  assert.equal(data.colors.length, 29, "Missing palette group");
  const values = data.colors.flatMap((color) => [
    ...(color.foreground
      ? [
          {
            id: color.id,
            name: color.name,
            nameVi: color.nameVi,
            token: color.token,
            hex: color.foreground,
          },
        ]
      : []),
    ...color.backgrounds,
  ]);
  assert.equal(values.length, 46, "Missing palette tone");
  assert.equal(
    new Set(values.map((value) => value.token)).size,
    46,
    "Duplicate palette token",
  );
  assert.equal(
    new Set(values.map((value) => value.hex)).size,
    45,
    "Selected color inventory changed",
  );
  for (const value of values) {
    assert.match(
      value.token,
      /^--color-(?:palette-)?[a-z]+(?:-[a-z]+)*$/,
      "Invalid palette token",
    );
    assert.match(value.hex, /^#[0-9A-F]{6}$/, "Invalid palette Hex");
    assert.match(value.name, /^[A-Za-z ]+$/, "Invalid palette name");
    assert.match(value.nameVi, /^[\p{L} ]+$/u, "Invalid Vietnamese name");
    assert(
      !value.name.includes("Material") && !value.name.includes("Minecoin"),
      "Use VINASIG names",
    );
  }
  assert(
    !JSON.stringify(data.colors).includes(String.fromCodePoint(167)),
    "Formatting codes cannot enter the shared palette",
  );
  const identity = {
    "scout-blue": "#21497B",
    "thinker-orange": "#EB7114",
    "builder-green": "#47A036",
    "auditor-red": "#971607",
    "core-graphite": "#443A3B",
  };
  for (const [id, hex] of Object.entries(identity))
    assert.equal(
      data.colors.find((color) => color.id === id)?.foreground,
      hex,
      "Identity anchor changed",
    );
  return values;
}

export function renderTokens(data) {
  const values = paletteValues(data);
  return `/* Generated from the canonical VINASIG Brand Assets palette. */\n:root {\n${values.map((value) => `  ${value.token}: ${value.hex.toLowerCase()};`).join("\n")}\n}\n`;
}

export async function checkPalette() {
  const bytes = await readFile(path.join(root, "src/data/palette.json"));
  const source = JSON.parse(
    await readFile(path.join(root, "docs/PALETTE_SOURCE.json"), "utf8"),
  );
  assert.equal(source.repository, "VINASIG/vinasig-brand-assets");
  assert.match(source.revision, /^[0-9a-f]{40}$/);
  assert.equal(source.path, "assets/palette.json");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    source.sha256,
    "Shared palette source drift",
  );
  const data = JSON.parse(bytes.toString("utf8"));
  const expected = renderTokens(data);
  assert.equal(
    await readFile(path.join(root, "src/styles/palette.css"), "utf8"),
    expected,
    "Generated palette CSS differs",
  );
  const dictionary = JSON.parse(
    await readFile(path.join(root, "src/locales/vi.json"), "utf8"),
  );
  for (const color of data.colors)
    assert.equal(
      dictionary[color.name],
      color.nameVi,
      "Localized palette name differs",
    );
  for (const tone of data.colors.flatMap((color) => color.backgrounds))
    assert.equal(
      dictionary[tone.name],
      tone.nameVi,
      "Localized deep name differs",
    );
  return {
    status: "PASS",
    revision: source.revision,
    sha256: source.sha256,
    tokens: 46,
    uniqueColors: 45,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv[2] === "--write") {
    const data = JSON.parse(
      await readFile(path.join(root, "src/data/palette.json"), "utf8"),
    );
    await writeFile(
      path.join(root, "src/styles/palette.css"),
      renderTokens(data),
    );
  }
  console.log(JSON.stringify(await checkPalette()));
}
