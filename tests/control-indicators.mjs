import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { startPreview } from "./helpers/preview.mjs";
import { inspectControlIndicators, inspectControlSurfaces } from "../.vinasig/standards/templates/web/interface.mjs";

const root = "output/responsive/control-indicators";
const app = await startPreview(root);
const engines = { chromium, firefox, webkit };
const names = (
  process.env.BROWSER_ENGINES ||
  process.env.RESPONSIVE_ENGINE ||
  "chromium,firefox,webkit"
).split(",");
const widths = [
  [320, 800],
  [360, 800],
  [390, 844],
  [759, 1024],
  [760, 1024],
  [761, 1024],
  [768, 1024],
  [1024, 768],
  [1440, 900],
];
let cases = 0;
try {
  for (const name of names) {
    assert(Object.hasOwn(engines, name), "Unsupported engine");
    const browser = await engines[name].launch();
    try {
      for (const locale of ["en", "vi"])
        for (const theme of ["light", "dark"])
          for (const [width, height] of widths) {
            const context = await browser.newContext({
              viewport: { width, height },
              colorScheme: theme,
              reducedMotion: "reduce",
            });
            const directory = path.join(
              root,
              name,
              `${locale}-${theme}-${width}x${height}`,
            );
            await mkdir(directory, { recursive: true });
            try {
              const page = await context.newPage();
              const errors = [];
              page.on("pageerror", (error) => errors.push(error.message));
              const url = `${app.baseURL}/${locale === "vi" ? "vi/" : ""}components/`;
              await page.goto(url);
              assert.deepEqual(await page.evaluate(inspectControlSurfaces), []);
              await page.evaluate(() => document.fonts.ready);
              const placement = page.getByRole("combobox", {
                name: locale === "vi" ? "Vị trí" : "Placement",
                exact: true,
              });
              assert.equal(await placement.count(), 1);
              assert.equal(
                await placement.locator("[data-control-value]").count(),
                1,
              );
              assert.equal(
                await placement.locator("[data-control-indicator]").count(),
                1,
              );
              assert.deepEqual(
                await page.evaluate(inspectControlIndicators),
                [],
              );
              if (locale === "en" && width === 1440) {
                const section = page.locator(
                  'section[aria-labelledby="dropdown-title"]',
                );
                const term = section.getByText("Accessibility", {
                  exact: true,
                });
                assert.equal(await term.count(), 1);
                await section.screenshot({
                  path: path.join(directory, "desktop-typography.png"),
                });
                assert.equal(
                  await term.evaluate((element) => {
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    return range.getClientRects().length;
                  }),
                  1,
                  "Keep the established desktop term on one line",
                );
              }
              await placement.screenshot({
                path: path.join(directory, "closed.png"),
              });
              await placement.click();
              assert.deepEqual(await page.evaluate(inspectControlSurfaces), []);
              assert.deepEqual(
                await page.evaluate(inspectControlIndicators),
                [],
              );
              const panel = await page
                .locator("#placement-options")
                .boundingBox();
              assert(
                panel &&
                  panel.x >= 0 &&
                  panel.y >= 0 &&
                  panel.x + panel.width <= width + 1 &&
                  panel.y + panel.height <= height + 1,
              );
              await page.screenshot({ path: path.join(directory, "open.png") });
              await page.keyboard.press("Escape");
              assert(
                await placement.evaluate(
                  (element) => element === document.activeElement,
                ),
              );
              if (width === 320) {
                await page.locator("#placement").evaluate(
                  (select, text) => {
                    select.selectedOptions[0].textContent = text;
                    select.dispatchEvent(
                      new Event("change", { bubbles: true }),
                    );
                    document.documentElement.style.fontSize = "200%";
                  },
                  locale === "vi"
                    ? "Vị trí đã chọn với nội dung dài để kiểm tra xuống dòng"
                    : "A deliberately long selected placement value for wrapping",
                );
                assert.deepEqual(
                  await page.evaluate(inspectControlIndicators),
                  [],
                );
                await placement.screenshot({
                  path: path.join(directory, "long-enlarged.png"),
                });
                await page.screenshot({
                  path: path.join(directory, "long-enlarged-page.png"),
                  fullPage: true,
                });
                for (const selector of [
                  ".rule-callout",
                  ".component-demo",
                  ".iconography-demo",
                  ".code-panel",
                ])
                  await page
                    .locator(selector)
                    .first()
                    .screenshot({
                      path: path.join(
                        directory,
                        selector.slice(1) + "-enlarged.png",
                      ),
                    });
                const geometry = await page.evaluate(() => ({
                  width: innerWidth,
                  scroll: document.documentElement.scrollWidth,
                  overflow: [...document.querySelectorAll("main *")]
                    .filter(
                      (element) =>
                        element.getClientRects().length &&
                        element.getBoundingClientRect().right > innerWidth + 1,
                    )
                    .map((element) => ({
                      tag: element.tagName,
                      class: element.className,
                      right: element.getBoundingClientRect().right,
                      text: element.textContent?.slice(0, 75),
                    }))
                    .slice(0, 20),
                }));
                const codeGeometry = await page
                  .locator(".code-panel")
                  .first()
                  .evaluate((element) => {
                    const list = [];
                    for (
                      let parent = element;
                      parent;
                      parent = parent.parentElement
                    ) {
                      const style = getComputedStyle(parent),
                        box = parent.getBoundingClientRect();
                      list.push({
                        tag: parent.tagName,
                        class: parent.className,
                        width: box.width,
                        right: box.right,
                        scroll: parent.scrollWidth,
                        overflow: style.overflow,
                        position: style.position,
                        display: style.display,
                        min: style.minWidth,
                      });
                    }
                    return list;
                  });
                const overflowingText = await page
                  .locator("main")
                  .evaluate((main) =>
                    [...main.querySelectorAll("*")]
                      .filter(
                        (element) =>
                          element.getClientRects().length &&
                          element.scrollWidth > element.clientWidth + 1 &&
                          getComputedStyle(element).overflow === "visible",
                      )
                      .map((element) => ({
                        tag: element.tagName,
                        class: element.className,
                        scroll: element.scrollWidth,
                        width: element.clientWidth,
                        text: element.textContent?.slice(0, 60),
                      }))
                      .slice(0, 20),
                  );
                assert(
                  geometry.scroll <= geometry.width + 1,
                  JSON.stringify({ geometry, codeGeometry, overflowingText }),
                );
                const initial = await browser.newContext({
                  javaScriptEnabled: false,
                  viewport: { width, height },
                  colorScheme: theme,
                });
                try {
                  const initialPage = await initial.newPage();
                  await initialPage.goto(url);
                  const initialPlacement = initialPage.getByRole("combobox", {
                    name: locale === "vi" ? "Vị trí" : "Placement",
                    exact: true,
                  });
                  assert(await initialPlacement.isDisabled());
                  assert.equal(
                    await initialPlacement
                      .locator("[data-control-indicator]")
                      .count(),
                    1,
                  );
                  assert.deepEqual(
                    await initialPage.evaluate(inspectControlIndicators),
                    [],
                  );
                  await initialPlacement.screenshot({
                    path: path.join(directory, "initial-html.png"),
                  });
                } finally {
                  await initial.close();
                }
              }
              assert.deepEqual(errors, []);
              cases++;
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
}
console.log(
  JSON.stringify({ status: "PASS", cases, engines: names, output: root }),
);
