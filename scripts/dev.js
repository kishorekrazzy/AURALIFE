#!/usr/bin/env node
/**
 * Runs the API and the Vite dev server together.
 *   npm run dev  →  API on :4000, client on :5173 (proxying /api to :4000)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const procs = [
  spawn(npm, ['--prefix', path.join(root, 'server'), 'run', 'dev'], { stdio: 'inherit' }),
  spawn(npm, ['--prefix', path.join(root, 'client'), 'run', 'dev'], { stdio: 'inherit' }),
];

const shutdown = () => {
  for (const p of procs) p.kill('SIGINT');
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
for (const p of procs) p.on('exit', (code) => { if (code) shutdown(); });
