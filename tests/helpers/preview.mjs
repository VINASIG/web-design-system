import { spawn } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import path from 'node:path';
import astroConfig from '../../astro.config.mjs';

const require = createRequire(import.meta.url);

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

// Start only the preview process owned by this test run. Keep existing dev servers running.
export async function startPreview(reportDirectory) {
  if (process.env.RESPONSIVE_URL) {
    return { baseURL: process.env.RESPONSIVE_URL.replace(/\/$/, ''), close: async () => {} };
  }
  await access('dist/index.html').catch(() => {
    throw new Error('Build the site with npm run build before running npm test.');
  });
  const packagePath = require.resolve('astro/package.json');
  const { bin } = JSON.parse(await readFile(packagePath, 'utf8'));
  const cli = path.resolve(path.dirname(packagePath), typeof bin === 'string' ? bin : bin.astro);
  const port = await freePort();
  const baseURL = `http://127.0.0.1:${port}${(astroConfig.base || '').replace(/\/$/, '')}`;
  const child = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let failure;
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.once('error', (error) => { failure = error; });
  const closed = new Promise((resolve) => child.once('close', resolve));
  const stopOnExit = () => child.kill();
  process.once('exit', stopOnExit);
  const close = async () => {
    process.removeListener('exit', stopOnExit);
    if (child.exitCode === null) child.kill();
    await closed;
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(path.join(reportDirectory, 'preview.log'), output);
  };

  try {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (failure) throw failure;
      if (child.exitCode !== null) throw new Error(`Preview stopped unexpectedly:\n${output}`);
      const response = await fetch(`${baseURL}/`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
      if (response?.ok) {
        console.log(`Testing production preview at ${baseURL}`);
        return { baseURL, close };
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Preview did not become ready:\n${output}`);
  } catch (error) {
    await close();
    throw error;
  }
}
