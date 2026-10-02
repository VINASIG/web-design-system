import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyStandards } from '../scripts/check-standards.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = path.join(root, 'output/publication/standards-tests');
const manifest = JSON.parse(await readFile(path.join(root, '.vinasig/manifest.json')));
const firstOwned = Object.keys(manifest.files)[0];

async function fixture() {
  await mkdir(fixtures, { recursive: true });
  const directory = await mkdtemp(path.join(fixtures, 'fixture-'));
  for (const file of ['AGENTS.md', '.vinasig/manifest.json', '.vinasig/provenance.json', ...Object.keys(manifest.files)]) {
    const destination = path.join(directory, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(root, file), destination);
  }
  return directory;
}

test('accepts the pinned snapshot without a sibling checkout or network', async () => {
  const result = await verifyStandards(await fixture());
  assert.equal(result.files, Object.keys(manifest.files).length);
  assert(result.instructionBytes <= 8192);
});

test('rejects an edited owned file', async () => {
  const directory = await fixture();
  await writeFile(path.join(directory, firstOwned), 'changed payload\n');
  await assert.rejects(verifyStandards(directory), /Snapshot integrity failed/);
});

test('rejects a modified manifest before accepting a reduced file inventory', async () => {
  const directory = await fixture();
  const modified = structuredClone(manifest);
  delete modified.files[firstOwned];
  await writeFile(path.join(directory, '.vinasig/manifest.json'), JSON.stringify(modified));
  await assert.rejects(verifyStandards(directory), /manifest differs from reviewed provenance/);
});

test('rejects unsafe managed paths even when the manifest digest was updated', async () => {
  const directory = await fixture();
  const modified = structuredClone(manifest);
  modified.files['.vinasig/standards/../../outside.txt'] = 'a'.repeat(64);
  const bytes = JSON.stringify(modified);
  const provenance = JSON.parse(await readFile(path.join(directory, '.vinasig/provenance.json')));
  provenance.manifestSha256 = createHash('sha256').update(bytes).digest('hex');
  await writeFile(path.join(directory, '.vinasig/manifest.json'), bytes);
  await writeFile(path.join(directory, '.vinasig/provenance.json'), JSON.stringify(provenance));
  await assert.rejects(verifyStandards(directory), /Unsafe path/);
});

test('rejects an edited or duplicated managed instruction block', async () => {
  const directory = await fixture();
  const file = path.join(directory, 'AGENTS.md');
  const original = await readFile(file, 'utf8');
  await writeFile(file, original.replace('Active profile is', 'Edited profile is'));
  await assert.rejects(verifyStandards(directory), /instruction block differs/);
  await writeFile(file, original + '\n<!-- VINASIG STANDARDS BEGIN -->');
  await assert.rejects(verifyStandards(directory), /duplicated standards beginning/);
});

test('rejects an empty root override and an oversized instruction chain entry', async () => {
  const directory = await fixture();
  await writeFile(path.join(directory, 'AGENTS.override.md'), '');
  await assert.rejects(verifyStandards(directory), /Root override shadows/);
  const oversized = await fixture();
  const file = path.join(oversized, 'AGENTS.md');
  await writeFile(file, (await readFile(file, 'utf8')) + 'x'.repeat(8192));
  await assert.rejects(verifyStandards(oversized), /8 KiB local budget/);
});

test('preserves owner instructions outside the managed block', async () => {
  const directory = await fixture();
  const file = path.join(directory, 'AGENTS.md');
  await writeFile(file, '# Additional owner context\n\n' + (await readFile(file, 'utf8')));
  await verifyStandards(directory);
});
