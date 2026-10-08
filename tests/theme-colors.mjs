import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { startPreview } from "./helpers/preview.mjs";

const directory = "output/responsive/theme-colors";
const preview = await startPreview(directory);
const drivers = { chromium, firefox, webkit };
const engines = (
  process.env.BROWSER_ENGINES ||
  process.env.RESPONSIVE_ENGINE ||
  "chromium,firefox,webkit"
).split(",");
const results = [];

function inspectColors() {
  const probe = document.createElement("div");
  document.body.append(probe);
  const color = (role) => {
    probe.style.color = `var(--color-${role})`;
    return getComputedStyle(probe).color;
  };
  const luminance = (value) =>
    value
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((channel) => channel / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  const ratio = (foreground, background) => {
    const a = luminance(color(foreground));
    const b = luminance(color(background));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const surfaces = ["canvas", "surface", "surface-muted", "surface-hover"];
  const pairs = surfaces.flatMap((background) =>
    ["text", "text-muted", "heading", "link", "focus", "border-strong"].map(
      (foreground) => ({
        foreground,
        background,
        ratio: ratio(foreground, background),
        minimum: ["focus", "border-strong"].includes(foreground) ? 3 : 4.5,
      }),
    ),
  );
  pairs.push({
    foreground: "indicator",
    background: "border-strong",
    ratio: ratio("indicator", "border-strong"),
    minimum: 3,
  });
  for (const status of ["info", "success", "warning", "error"]) {
    pairs.push({
      foreground: status,
      background: `${status}-background`,
      ratio: ratio(status, `${status}-background`),
      minimum: 4.5,
    });
  }
  const canvas = color("canvas");
  const surface = color("surface");
  const neutrals = Object.fromEntries(
    [...surfaces, "text", "text-muted", "heading", "border", "border-strong"].map(
      (role) => [role, color(role)],
    ),
  );
  const body = getComputedStyle(document.body);
  probe.remove();
  return { canvas, surface, body: body.backgroundColor, neutrals, pairs };
}

try {
  for (const engine of engines) {
    assert(Object.hasOwn(drivers, engine), "Unsupported browser engine");
    const browser = await drivers[engine].launch();
    try {
      for (const locale of ["en", "vi"])
        for (const theme of ["light", "dark"])
          for (const source of ["system", "manual"]) {
            const context = await browser.newContext({
              colorScheme:
                source === "system"
                  ? theme
                  : theme === "light"
                    ? "dark"
                    : "light",
              javaScriptEnabled: false,
              viewport: { width: 390, height: 844 },
            });
            try {
              const page = await context.newPage();
              await page.goto(
                `${preview.baseURL}/${locale === "vi" ? "vi/" : ""}foundations/`,
              );
              if (source === "manual")
                await page.evaluate((value) => {
                  document.documentElement.dataset.theme = value;
                }, theme);
              const result = await page.evaluate(inspectColors);
              const label = `${engine} ${locale} ${theme} ${source}`;
              assert.equal(
                result.canvas,
                theme === "light" ? "rgb(249, 249, 249)" : "rgb(17, 17, 17)",
                label,
              );
              assert.equal(result.body, result.canvas, label);
              for (const [role, value] of Object.entries(result.neutrals)) {
                const [red, green, blue] = value.match(/[\d.]+/g).map(Number);
                assert(red === green && green === blue, `${label}: ${role} must remain neutral`);
              }
              for (const pair of result.pairs)
                assert(
                  pair.ratio >= pair.minimum,
                  `${label}: ${pair.foreground} on ${pair.background} is ${pair.ratio}, requires ${pair.minimum}`,
                );
              results.push({ engine, locale, theme, source, ...result });
            } finally {
              await context.close();
            }
          }
    } finally {
      await browser.close();
    }
  }
  await mkdir(directory, { recursive: true });
  await writeFile(
    `${directory}/contrast.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Verified ${results.length} system/manual color states without JavaScript.`);
} finally {
  await preview.close();
}
