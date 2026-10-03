import path from 'node:path';
import assert from 'node:assert/strict';
import { inspectInterface } from '../../.vinasig/standards/templates/web/interface.mjs';

// WebKit limits screenshots to 32767 px per dimension. Retain the real viewport
// and capture every scroll segment of longer pages rather than clipping content.
export async function capturePage(page, file) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  if (height <= 30000) {
    await page.screenshot({ path: file, fullPage: true });
    assert.deepEqual(await page.evaluate(inspectInterface), [], file);
    return;
  }
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('A fixed viewport is required for segmented capture.');
  const extension = path.extname(file);
  const prefix = file.slice(0, -extension.length);
  let part = 1;
  for (let top = 0; top < height; top += viewport.height) {
    await page.evaluate((offset) => window.scrollTo({ top: offset, behavior: 'instant' }), top);
    await page.screenshot({ path: `${prefix}--part-${String(part).padStart(3, '0')}${extension}` });
    part++;
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  assert.deepEqual(await page.evaluate(inspectInterface), [], file);
}
