// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { startPreview } from "./helpers/preview.mjs";

const directory = "output/responsive/palette";
const app = await startPreview(directory);
const drivers = { chromium, firefox, webkit };
const engines = (
  process.env.BROWSER_ENGINES ||
  process.env.RESPONSIVE_ENGINE ||
  "chromium,firefox,webkit"
).split(",");
const palette = JSON.parse(await readFile("src/data/palette.json", "utf8"));
const results = [];
const rgb = (hex) =>
  `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(", ")})`;

try {
  for (const engine of engines) {
    assert(Object.hasOwn(drivers, engine), "Unsupported browser engine");
    const browser = await drivers[engine].launch();
    try {
      for (const locale of ["en", "vi"])
        for (const theme of ["light", "dark"]) {
          const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            locale: locale === "vi" ? "vi-VN" : "en-US",
            colorScheme: theme,
            reducedMotion: "reduce",
          });
          try {
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            const route = `${app.baseURL}/${locale === "vi" ? "vi/" : ""}foundations/`;
            assert.equal((await page.goto(route))?.status(), 200);
            await page.evaluate(() => document.fonts.ready);
            const section = page
              .locator(".page-section")
              .filter({ has: page.locator("#palette-colors-title") });
            const cards = section.locator("[data-palette-id]");
            assert.equal(await cards.count(), palette.colors.length);
            for (const [index, color] of palette.colors.entries()) {
              const card = cards.nth(index);
              assert.equal(
                await card.getAttribute("data-palette-id"),
                color.id,
              );
              assert.equal(
                await card.locator("h3").innerText(),
                locale === "vi" ? color.nameVi : color.name,
              );
              const expected = [
                ...(color.foreground ? [color.foreground] : []),
                ...color.backgrounds.map((tone) => tone.hex),
              ];
              assert.deepEqual(
                await card
                  .locator(".palette-color-swatches span")
                  .evaluateAll((nodes) =>
                    nodes.map((node) => getComputedStyle(node).backgroundColor),
                  ),
                expected.map(rgb),
              );
              assert.deepEqual(
                await card
                  .locator(".palette-color-values code")
                  .allTextContents(),
                expected,
              );
            }
            const text = await section.innerText();
            assert.equal((text.match(/Minecraft/g) || []).length, 1);
            assert(
              !text.includes(String.fromCodePoint(167)) &&
                !/material_|minecoin|quartz|netherite|redstone|emerald|resin/i.test(
                  text,
                ),
            );
            for (const width of [
              320, 360, 390, 759, 760, 761, 768, 1024, 1440,
            ]) {
              await page.setViewportSize({
                width,
                height:
                  width === 360
                    ? 800
                    : width === 390
                      ? 844
                      : width === 768
                        ? 1024
                        : width === 1024
                          ? 768
                          : 900,
              });
              const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              );
              assert.equal(
                overflow,
                false,
                `${engine} ${locale} ${theme} ${width}: horizontal overflow`,
              );
              const clipping = await cards.evaluateAll((nodes) =>
                nodes
                  .filter((node) => node.scrollWidth > node.clientWidth + 1)
                  .map((node) => node.dataset.paletteId),
              );
              assert.deepEqual(
                clipping,
                [],
                `Clipped palette cards at ${width}`,
              );
              const folder = path.join(directory, engine, `${locale}-${theme}`);
              await mkdir(folder, { recursive: true });
              if ([320, 360, 390, 768, 1024, 1440].includes(width))
                await section.screenshot({
                  path: path.join(folder, `${width}.png`),
                  animations: "disabled",
                });
              if ([320, 360, 390, 768, 1024, 1440].includes(width)) {
                await section.evaluate((node) =>
                  node.scrollIntoView({ block: "start", behavior: "instant" }),
                );
                await page.screenshot({
                  path: path.join(folder, `${width}-top.png`),
                  animations: "disabled",
                });
                await cards.last().scrollIntoViewIfNeeded();
                await page.screenshot({
                  path: path.join(folder, `${width}-end.png`),
                  animations: "disabled",
                });
              }
              results.push({ engine, locale, theme, width, status: "PASS" });
            }
            await page.setViewportSize({ width: 320, height: 900 });
            await page.evaluate(() => {
              document.documentElement.style.fontSize = "200%";
            });
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              ),
              false,
              "Enlarged palette overflow",
            );
            const clippedText = await cards.evaluateAll((nodes) =>
              nodes.flatMap((card) => {
                const bounds = card.getBoundingClientRect();
                return [
                  ...card.querySelectorAll(
                    "h3, .palette-color-match, .palette-color-values, code",
                  ),
                ]
                  .filter((node) => {
                    const box = node.getBoundingClientRect();
                    return (
                      box.left < bounds.left - 1 ||
                      box.right > bounds.right + 1 ||
                      node.scrollWidth > node.clientWidth + 1
                    );
                  })
                  .map(
                    (node) => `${card.dataset.paletteId}: ${node.textContent}`,
                  );
              }),
            );
            assert.deepEqual(
              clippedText,
              [],
              "Enlarged palette text must remain inside its card",
            );
            await section.screenshot({
              path: path.join(
                directory,
                engine,
                `${locale}-${theme}`,
                "enlarged.png",
              ),
              animations: "disabled",
            });
            await cards.nth(16).scrollIntoViewIfNeeded();
            await cards.nth(16).screenshot({
              path: path.join(
                directory,
                engine,
                `${locale}-${theme}`,
                "enlarged-card.png",
              ),
              animations: "disabled",
            });
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    path.join(directory, "report.json"),
    JSON.stringify(
      { status: "PASS", cases: results.length, results },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS: ${results.length} rendered palette cases; canonical names, Hex values and CSS colors agree.`,
  );
} finally {
  await app.close();
}
