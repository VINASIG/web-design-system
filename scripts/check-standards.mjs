import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const begin = '<!-- VINASIG STANDARDS BEGIN -->';
const end = '<!-- VINASIG STANDARDS END -->';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const isDigest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

async function readLocal(root, relative, optional = false) {
  assert(typeof relative === 'string' && relative.length, 'Missing local path');
  const parts = relative.split('/');
  assert(parts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part) && part !== '.' && part !== '..'), `Unsafe path: ${relative}`);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      assert(!(await lstat(current)).isSymbolicLink(), `Symlink boundary: ${relative}`);
    } catch (error) {
      if (optional && error.code === 'ENOENT') return null;
      throw error;
    }
  }
  return readFile(current);
}

export async function verifyStandards(directory = repositoryRoot) {
  const target = path.resolve(directory);
  const stat = await lstat(target);
  assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Target must be a real repository directory');
  const root = await realpath(target);
  const provenance = JSON.parse(await readLocal(root, '.vinasig/provenance.json'));
  assert.equal(provenance.format, 1, 'Unsupported provenance format');
  assert.equal(provenance.repository, 'VINASIG/agent-standards', 'Unexpected standards repository');
  assert.match(provenance.sourceCommit, /^[a-f0-9]{40}$/, 'Missing reviewed source commit');
  assert.equal(provenance.profile, 'web-typescript', 'Unexpected consumer profile');
  assert(isDigest(provenance.manifestSha256) && isDigest(provenance.bundleSha256), 'Missing approved digests');

  const manifestBytes = await readLocal(root, '.vinasig/manifest.json');
  assert.equal(digest(manifestBytes), provenance.manifestSha256, 'Installed manifest differs from reviewed provenance');
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.format, 1, 'Unsupported manifest format');
  assert.equal(manifest.version, provenance.version, 'Snapshot version differs');
  assert.equal(manifest.profile, provenance.profile, 'Snapshot profile differs');
  assert.equal(manifest.bundleSha256, provenance.bundleSha256, 'Snapshot bundle differs');
  assert.equal(manifest.source?.repository, provenance.repository, 'Snapshot repository differs');
  assert.equal(manifest.source?.kind, 'local-content-snapshot', 'Unexpected snapshot source kind');
  assert.match(manifest.source.ref, /^sha256:[a-f0-9]{64}$/, 'Missing content snapshot digest');
  assert(isDigest(manifest.agentBlock), 'Invalid instruction block digest');
  assert(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Missing owned files');
  const files = Object.entries(manifest.files);
  assert(files.length > 0, 'Empty standards snapshot');
  for (const [file, expected] of files) {
    assert(file.startsWith('.vinasig/standards/') || /^\.agents\/skills\/vinasig-[a-z0-9-]+\//.test(file), `Unmanaged path: ${file}`);
    assert(isDigest(expected), `Invalid digest: ${file}`);
    assert.equal(digest(await readLocal(root, file)), expected, `Snapshot integrity failed: ${file}`);
  }

  assert.equal(await readLocal(root, 'AGENTS.override.md', true), null, 'Root override shadows the standards entrypoint');
  const agentsBytes = await readLocal(root, 'AGENTS.md');
  assert(agentsBytes.length <= 8192, 'Root instructions exceed the 8 KiB local budget');
  const agents = agentsBytes.toString('utf8');
  assert.equal(agents.split(begin).length, 2, 'Missing or duplicated standards beginning');
  assert.equal(agents.split(end).length, 2, 'Missing or duplicated standards ending');
  assert(agents.indexOf(end) > agents.indexOf(begin), 'Invalid standards block order');
  const block = agents.slice(agents.indexOf(begin), agents.indexOf(end) + end.length);
  assert.equal(digest(block), manifest.agentBlock, 'Managed instruction block differs from the snapshot');
  return { files: files.length, instructionBytes: agentsBytes.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyStandards();
    console.log(`Standards integrity passed: ${result.files} owned files and ${result.instructionBytes} instruction bytes. Codex runtime discovery NOT_RUN.`);
  } catch (error) {
    console.error(`Standards integrity failed: ${error.message}`);
    process.exitCode = 1;
  }
}
