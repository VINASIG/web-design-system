import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as lucide from 'lucide';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
const catalog = JSON.parse(await read('docs/elements/catalog.json'));
const specimens = JSON.parse(await read('docs/elements/specimens.json'));
const categories = new Set();
const ids = new Set();
const orders = new Set();

for (const category of catalog.categories) {
  assert(['Web', 'macOS'].includes(category.platform), 'Unknown catalog platform');
  assert.equal(typeof category.name, 'string');
  const key = `${category.platform}:${category.name}`;
  assert(!categories.has(key), `Duplicate category: ${key}`);
  categories.add(key);
}

for (const element of catalog.elements) {
  assert.match(element.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid element id');
  assert(!ids.has(element.id), `Duplicate element id: ${element.id}`);
  assert(Number.isInteger(element.order) && element.order > 0, `Invalid order: ${element.id}`);
  assert(!orders.has(element.order), `Duplicate element order: ${element.order}`);
  assert(categories.has(`${element.platform}:${element.category}`), `Missing category: ${element.id}`);
  for (const field of ['name', 'definition', 'guidance', 'accessibility']) {
    assert.equal(typeof element[field], 'string', `Missing ${field}: ${element.id}`);
    assert(element[field].trim(), `Empty ${field}: ${element.id}`);
  }
  assert.equal(typeof specimens[element.id], 'string', `Missing specimen: ${element.id}`);
  assert(specimens[element.id].trim().startsWith('<'), `Empty specimen: ${element.id}`);
  ids.add(element.id);
  orders.add(element.order);
}
assert.deepEqual(Object.keys(specimens).sort(), [...ids].sort(), 'Catalog and specimen ids differ');

const iconSource = await read('src/scripts/icons.ts');
const registryBody = iconSource.match(/const lucideIcons = \{([\s\S]*?)\};/)?.[1];
assert(registryBody, 'Lucide registry is missing');
const registered = new Set(registryBody.match(/[A-Za-z][A-Za-z0-9]*/g));
for (const name of registered) {
  assert(name in lucide, `Unknown Lucide export: ${name}`);
}

async function sourceFiles(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const file = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(astro|ts|css)$/.test(file) ? [file] : [];
  }));
  return files.flat();
}

const sources = await Promise.all((await sourceFiles('src')).map(async (file) => [file, await read(file)]));
sources.push(['docs/elements/specimens.json', Object.values(specimens).join('\n')]);
const usedIcons = new Set();
for (const [file, source] of sources) {
  for (const [, name] of source.matchAll(/data-lucide=['"]([a-z0-9-]+)['"]/g)) {
    const exportName = name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
    assert(registered.has(exportName), `Unregistered icon '${name}' in ${file}`);
    usedIcons.add(name);
  }
}

const layout = await read('src/layouts/DocsLayout.astro');
for (const size of [16, 32, 48]) {
  const favicon = `/brand/favicons/favicon-${size}.png`;
  assert(layout.includes(`href={withBase("${favicon}")}`), `Missing base-aware ${size}px favicon in the shared head`);
  await access(path.join(root, 'public', favicon));
}
await access(path.join(root, 'public/fonts/SpaceGrotesk-VariableFont_wght.ttf'));
await access(path.join(root, 'public/fonts/OFL.txt'));

console.log(`Content check passed: ${ids.size} elements, ${categories.size} categories, ${usedIcons.size} registered icons and required local assets.`);
