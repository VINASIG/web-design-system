import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { startPreview } from "./helpers/preview.mjs";
import { inspectDestructiveActions } from "../.vinasig/standards/templates/web/destructive-actions.mjs";

const directory = "output/responsive/destructive-actions";
const preview = await startPreview(directory);
const engines = (
  process.env.BROWSER_ENGINES ||
  process.env.RESPONSIVE_ENGINE ||
  "chromium,firefox,webkit"
).split(",");
const actions = [
  ["empty-trash-alert", '[data-action="trash-open"]'],
  ["empty-trash-alert", '[data-action="trash-confirm"]'],
  ["three-dots-overflow-menu", "[data-destructive-action]"],
  ["modal-dialog-drawer-sheet", ".sample-surface-danger"],
  ["search-field", '[data-action="search-clear-recents"]'],
  ["context-menu", '[data-menu-command="Move to Trash"]'],
  ["delete-sheet", '[data-action="delete-sheet-open"]'],
  ["delete-sheet", '[data-action="delete-sheet-confirm"]'],
];
const inventory = actions.map(([slug, selector]) => ({
  selector: `.ui-sample[data-specimen-id="${slug}"] ${selector}`,
  count: 1,
}));
const results = [];

async function inspect(page, declared) {
  await page.waitForFunction((declared) => {
    const affected = new Set();
    for (const { selector } of declared)
      for (const node of document.querySelectorAll(selector)) {
        const box = node.getBoundingClientRect();
        if (
          !box.width ||
          !box.height ||
          getComputedStyle(node).visibility !== "visible"
        )
          continue;
        for (let parent = node; parent; parent = parent.parentElement)
          affected.add(parent);
        for (const child of node.querySelectorAll("svg")) affected.add(child);
      }
    return [...affected].every((node) =>
      node
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" ||
            animation.effect?.getTiming().iterations === Infinity,
        ),
    );
  }, declared);
  const findings = await page.evaluate(inspectDestructiveActions, declared);
  if (findings.length) {
    console.log(
      await page.evaluate(
        (inventory) =>
          inventory.map(({ selector }) => {
            const node = document.querySelector(selector);
            const style = getComputedStyle(node);
            const roles = [
              "--color-error",
              "--color-error-accent",
              "--color-auditor-red-strong",
            ].map((token) => style.getPropertyValue(token));
            return {
              selector,
              roles,
              role: node.getAttribute("role"),
              color: style.color,
              background: style.backgroundColor,
              border: style.borderTopColor,
              forced: matchMedia("(forced-colors:active)").matches,
            };
          }),
        declared,
      ),
    );
  }
  assert.deepEqual(findings, []);
}

async function openAction(page, slug, selector, keyboard = false) {
  const sample = page.locator(`.ui-sample[data-specimen-id="${slug}"]`);
  const button = sample.locator(selector);
  const open = async (trigger) => {
    if (keyboard) {
      await trigger.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await trigger.press("Enter");
    } else await trigger.click();
  };
  if (!(await button.isVisible())) {
    if (slug === "empty-trash-alert")
      await open(sample.locator('[data-action="trash-open"]'));
    if (slug === "three-dots-overflow-menu")
      await open(sample.locator('[data-action="toggle-menu"]').first());
    if (slug === "modal-dialog-drawer-sheet")
      await open(
        sample.locator('[data-action="surface-select"][data-surface="dialog"]'),
      );
    if (slug === "search-field")
      await open(sample.locator('[data-action="search-recent-toggle"]'));
    if (slug === "context-menu") {
      const trigger = sample.locator(".sample-context-target");
      if (keyboard) {
        await trigger.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        await trigger.press("Shift+F10");
      } else await trigger.click({ button: "right" });
    }
    if (slug === "delete-sheet")
      await open(sample.locator('[data-action="delete-sheet-open"]'));
  }
  await button.waitFor({ state: "visible" });
  return { sample, button };
}

try {
  for (const engine of engines) {
    const browser = await { chromium, firefox, webkit }[engine].launch();
    try {
      for (const locale of ["en", "vi"])
        for (const theme of ["light", "dark"])
          for (const width of [390, 1440]) {
            const context = await browser.newContext({
              viewport: { width, height: 1000 },
              locale: locale === "vi" ? "vi-VN" : "en-US",
              colorScheme: theme,
              reducedMotion: "reduce",
            });
            const page = await context.newPage();
            const result = { engine, locale, theme, width, states: [] };
            results.push(result);
            try {
              const base = `${preview.baseURL}/${locale === "vi" ? "vi/" : ""}`;
              assert.equal(
                (await page.goto(`${base}components/`)).status(),
                200,
              );
              assert.equal(
                await page.locator("html").getAttribute("lang"),
                locale,
              );
              await inspect(page, [
                { selector: "[data-destructive-action]", count: 1 },
              ]);
              await page.locator("[data-destructive-action]").screenshot({
                path: `${directory}/${engine}-${locale}-${theme}-${width}-component.png`,
              });
              assert.equal((await page.goto(`${base}elements/`)).status(), 200);
              await inspect(page, inventory);
              for (const [slug, selector] of actions) {
                result.action = { slug, selector };
                const { sample, button } = await openAction(
                  page,
                  slug,
                  selector,
                );
                await page.mouse.move(0, 0);
                await inspect(page, inventory);
                await button.hover();
                await inspect(page, inventory);
                await page.mouse.down();
                await inspect(page, inventory);
                await page.mouse.move(0, 0);
                await page.mouse.up();
                if ((await button.getAttribute("role")) === "menuitem") {
                  await page.keyboard.press("Escape");
                  await openAction(page, slug, selector, true);
                  await page.keyboard.press("End");
                } else {
                  await openAction(page, slug, selector);
                  await button.focus();
                  await page.keyboard.press("Tab");
                  await page.keyboard.press("Shift+Tab");
                }
                if (
                  !(await button.evaluate(
                    (node) =>
                      node === document.activeElement &&
                      node.matches(":focus-visible"),
                  )) &&
                  (await button.evaluate((node) =>
                    Boolean(node.closest("dialog[open]")),
                  ))
                )
                  await page.keyboard.press("Tab");
                await page.waitForFunction(
                  (node) =>
                    node === document.activeElement &&
                    node.matches(":focus-visible"),
                  await button.elementHandle(),
                );
                assert(
                  await button.evaluate((node) =>
                    node.matches(":focus-visible"),
                  ),
                  `${slug} ${selector}: keyboard focus must be visible`,
                );
                await inspect(page, inventory);
                await mkdir(directory, { recursive: true });
                await page.evaluate(() =>
                  window.getSelection()?.removeAllRanges(),
                );
                const number = actions.findIndex(
                  (action) => action[0] === slug && action[1] === selector,
                );
                const dialog = sample.locator("dialog[open]");
                await ((await dialog.count()) ? dialog : sample).screenshot({
                  path: `${directory}/${engine}-${locale}-${theme}-${width}-${number}-${slug}.png`,
                });
                result.states.push({
                  slug,
                  selector,
                  default: "PASS",
                  hover: "PASS",
                  active: "PASS",
                  keyboard: "PASS",
                });
                await page.emulateMedia({ forcedColors: "active" });
                await inspect(page, inventory);
                await page.emulateMedia({ forcedColors: "none" });
                await page.keyboard.press("Escape");
              }
              delete result.action;
              const blue = page.locator(".sample-trash-open");
              const originalStyle = await blue.getAttribute("style");
              await blue.evaluate((node) => {
                node.style.setProperty("color", "#21497b", "important");
                node.style.setProperty("background", "#fcfcfc", "important");
                node.style.setProperty("border-color", "#21497b", "important");
              });
              await page.waitForFunction(() =>
                document
                  .querySelector(".sample-trash-open")
                  .getAnimations()
                  .every((animation) => animation.playState !== "running"),
              );
              assert(
                (
                  await page.evaluate(inspectDestructiveActions, inventory)
                ).some((item) => item.kind === "destructive-color"),
              );
              await blue.evaluate((node, value) => {
                node.style.cssText = value ?? "";
              }, originalStyle);
              const trash = await openAction(
                page,
                "empty-trash-alert",
                '[data-action="trash-confirm"]',
              );
              await trash.button.click();
              assert.match(
                await trash.sample.locator("[data-trash-count]").textContent(),
                /^0(?:\s|$)/u,
              );
              assert.equal(
                await trash.sample.locator(".sample-trash-items").isVisible(),
                false,
              );
              assert.equal(
                await trash.sample.locator("[data-trash-empty]").isVisible(),
                true,
              );
              const recent = await openAction(
                page,
                "search-field",
                '[data-action="search-clear-recents"]',
              );
              await recent.button.click();
              assert.equal(
                await recent.sample
                  .locator("[data-search-recent-list]")
                  .locator("button")
                  .count(),
                0,
              );
              result.behavior = "PASS";
              console.log(
                `${engine} ${locale} ${theme} ${width}: destructive actions PASS`,
              );
            } catch (error) {
              result.error = String(error);
              throw error;
            } finally {
              await mkdir(directory, { recursive: true });
              await writeFile(
                `${directory}/results.json`,
                `${JSON.stringify(results, null, 2)}\n`,
              );
              await context.close();
            }
          }
    } finally {
      await browser.close();
    }
  }
} finally {
  await preview.close();
}
