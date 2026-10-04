import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { startPreview } from "./helpers/preview.mjs";
import { inspectControlSurfaces } from "../.vinasig/standards/templates/web/interface.mjs";

const directory = "output/responsive/control-surfaces";
const app = await startPreview(directory);
const drivers = { chromium, firefox, webkit };
const engines = (
  process.env.BROWSER_ENGINES ||
  process.env.RESPONSIVE_ENGINE ||
  "chromium,firefox,webkit"
).split(",");
const results = [];

// A styled checkbox can still lose its mark when a more specific text-color
// rule wins. Check the rendered mark, not only appearance or source presence.
function selectionMarks() {
  const channels = (color) =>
    (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const luminance = (color) =>
    channels(color)
      .map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      })
      .reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  return [
    ...document.querySelectorAll(
      "#switch-checkbox-radio .element-preview input:checked, #switch-checkbox-radio .element-preview input:indeterminate",
    ),
  ].map((control) => {
    const style = getComputedStyle(control);
    const mark = getComputedStyle(control, "::before");
    const foreground = luminance(mark.backgroundColor);
    const background = luminance(style.backgroundColor);
    return {
      type: control.type,
      role: control.getAttribute("role"),
      contrast:
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05),
      content: mark.content,
      opacity: Number(mark.opacity),
      width: parseFloat(mark.width),
      height: parseFloat(mark.height),
    };
  });
}

try {
  for (const engine of engines) {
    assert(Object.hasOwn(drivers, engine), "Unsupported browser engine");
    const browser = await drivers[engine].launch();
    try {
      for (const locale of ["en", "vi"])
        for (const theme of ["light", "dark"]) {
          const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            colorScheme: theme,
            reducedMotion: "reduce",
          });
          const folder = path.join(
            directory,
            engine,
            `${locale}-${theme}-390x844`,
          );
          await mkdir(folder, { recursive: true });
          try {
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(
              `${app.baseURL}/${locale === "vi" ? "vi/" : ""}elements/`,
            );
            await page.evaluate(() => document.fonts.ready);
            const choices = page.locator(
              "#switch-checkbox-radio .element-preview",
            );
            const checkboxes = choices.locator(
              'input[type="checkbox"]:not([role="switch"])',
            );
            const radios = choices.locator('input[type="radio"]');
            assert(
              (await checkboxes.count()) >= 2,
              "The fixture must include ordinary checkboxes",
            );
            assert(
              (await radios.count()) >= 2,
              "The fixture must include radio choices",
            );
            await checkboxes.last().check();
            await radios.last().check();
            // Capture the painted state before measuring pseudo-elements. Some
            // engines return the previous pseudo-class style until that paint.
            await choices.screenshot({
              path: path.join(folder, "selected-marks.png"),
            });
            const marks = await page.evaluate(selectionMarks);
            assert(marks.length >= 3, "Selected controls must be present");
            for (const mark of marks) {
              assert(
                mark.content !== "none" &&
                  mark.content !== "normal" &&
                  mark.opacity > 0 &&
                  mark.width > 1 &&
                  mark.height > 1,
                JSON.stringify(mark),
              );
              assert(
                mark.contrast >= 3,
                "Selection mark contrast " + JSON.stringify(mark),
              );
            }
            assert.deepEqual(await page.evaluate(inspectControlSurfaces), []);
            const volume = page.locator("#volume-slider .element-preview");
            const range = volume.locator('input[type="range"]').first();
            await range.focus();
            await page.keyboard.press("End");
            assert.equal(
              await range.inputValue(),
              await range.getAttribute("max"),
            );
            assert.deepEqual(await page.evaluate(inspectControlSurfaces), []);
            await volume.screenshot({
              path: path.join(folder, "slider-keyboard-end.png"),
            });
            // The host summary has vertical padding. The glyph must share the
            // text baseline instead of anchoring to the top of that padding.
            const disclosure = page.locator(
              "#accordion-disclosure .element-notes",
            );
            const summary = disclosure.locator(":scope > summary");
            assert.equal(
              await summary.count(),
              1,
              "The padded disclosure fixture must exist",
            );
            assert.equal(
              await disclosure.evaluate((element) => element.open),
              false,
            );
            const glyph = await summary.evaluate((element) => {
              const style = getComputedStyle(element, "::before");
              return {
                display: style.display,
                position: style.position,
                content: style.content,
                width: parseFloat(style.width),
                gap: parseFloat(style.marginInlineEnd),
                fontSize: parseFloat(style.fontSize),
                mask: style.maskImage,
                transform: style.transform,
              };
            });
            assert.equal(glyph.display, "inline-block", JSON.stringify(glyph));
            assert.equal(glyph.position, "static", JSON.stringify(glyph));
            assert(
              glyph.content !== "none" &&
                glyph.content !== "normal" &&
                glyph.width > 1 &&
                glyph.mask !== "none",
              JSON.stringify(glyph),
            );
            assert(glyph.gap >= glyph.fontSize * 0.49, JSON.stringify(glyph));
            await summary.screenshot({
              path: path.join(folder, "disclosure-closed.png"),
            });
            await summary.click();
            assert.equal(
              await disclosure.evaluate((element) => element.open),
              true,
            );
            assert.notEqual(
              await summary.evaluate(
                (element) => getComputedStyle(element, "::before").transform,
              ),
              glyph.transform,
            );
            assert.deepEqual(await page.evaluate(inspectControlSurfaces), []);
            await disclosure.screenshot({
              path: path.join(folder, "disclosure-open.png"),
            });
            const forcedGlyphs = [];
            if (engine === "chromium") {
              await page.emulateMedia({ forcedColors: "active" });
              assert(
                await page.evaluate(
                  () => matchMedia("(forced-colors: active)").matches,
                ),
              );
              const toggle = choices.locator('input[role="switch"]');
              assert(await toggle.isChecked());
              await choices.screenshot({
                path: path.join(folder, "forced-colors-switch.png"),
              });
              const knob = await toggle.evaluate((control) => {
                const track = getComputedStyle(control);
                const mark = getComputedStyle(control, "::before");
                return {
                  track: track.backgroundColor,
                  mark: mark.backgroundColor,
                  display: mark.display,
                  width: parseFloat(mark.width),
                  height: parseFloat(mark.height),
                };
              });
              assert(
                knob.mark !== knob.track &&
                  knob.display !== "none" &&
                  knob.width > 1 &&
                  knob.height > 1,
                JSON.stringify(knob),
              );
              for (const state of ["open", "closed"]) {
                if (state === "closed") await summary.click();
                assert.equal(
                  await disclosure.evaluate((element) => element.open),
                  state === "open",
                );
                const forcedGlyph = await summary.evaluate((element) => {
                  const probe = document.createElement("span");
                  probe.style.cssText =
                    "color:CanvasText;background:Canvas;forced-color-adjust:none";
                  document.body.append(probe);
                  const palette = getComputedStyle(probe);
                  const mark = getComputedStyle(element, "::before");
                  const channels = (color) =>
                    (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                  const luminance = (color) =>
                    channels(color)
                      .map((channel) => {
                        const value = channel / 255;
                        return value <= 0.04045
                          ? value / 12.92
                          : ((value + 0.055) / 1.055) ** 2.4;
                      })
                      .reduce(
                        (sum, value, index) =>
                          sum + value * [0.2126, 0.7152, 0.0722][index],
                        0,
                      );
                  const foreground = luminance(mark.backgroundColor);
                  const background = luminance(palette.backgroundColor);
                  const result = {
                    background: mark.backgroundColor,
                    systemText: palette.color,
                    canvas: palette.backgroundColor,
                    display: mark.display,
                    width: parseFloat(mark.width),
                    height: parseFloat(mark.height),
                    contrast:
                      (Math.max(foreground, background) + 0.05) /
                      (Math.min(foreground, background) + 0.05),
                  };
                  probe.remove();
                  return result;
                });
                assert.equal(forcedGlyph.background, forcedGlyph.systemText);
                assert(
                  forcedGlyph.display !== "none" &&
                    forcedGlyph.width > 1 &&
                    forcedGlyph.height > 1 &&
                    forcedGlyph.contrast >= 3,
                  JSON.stringify(forcedGlyph),
                );
                await summary.screenshot({
                  path: path.join(folder, `forced-disclosure-${state}.png`),
                });
                forcedGlyphs.push({ state, ...forcedGlyph });
              }
            }
            assert.deepEqual(errors, []);
            results.push({
              engine,
              locale,
              theme,
              marks,
              glyph,
              forcedGlyphs,
              folder,
            });
          } finally {
            await context.close();
          }
        }
    } finally {
      await browser.close();
    }
  }
} finally {
  await app.close();
  await writeFile(
    path.join(directory, "summary.json"),
    JSON.stringify(results, null, 2),
  );
}
console.log(
  JSON.stringify({
    status: "PASS",
    cases: results.length,
    forcedColorStates: results.reduce(
      (count, row) => count + row.forcedGlyphs.length,
      0,
    ),
    engines,
    output: directory,
  }),
);
