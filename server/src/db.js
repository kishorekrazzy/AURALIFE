import fs from 'node:fs';
import path from 'node:path';

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
// Netlify bundles functions as CommonJS, where import.meta.url is unavailable.
// Its deployed filesystem is read-only too, so use the Lambda temporary folder.
// The normal Express server keeps its JSON datastore under server/data.
const serverRoot = path.basename(process.cwd()) === 'server'
  ? process.cwd()
  : path.join(process.cwd(), 'server');
const DATA_DIR = isServerless ? path.join('/tmp', 'auralife') : path.join(serverRoot, 'data');
const DATA_FILE = path.join(DATA_DIR, 'auralife.json');

/**
 * A tiny JSON document store with atomic writes.
 *
 * Everything the API serves lives here, so the client never has to invent a
 * value: if a field is missing the endpoint says so rather than guessing.
 */
let state = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function load() {
  if (state) return state;
  ensureDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return state;
    } catch (err) {
      throw new Error(`Corrupt data file at ${DATA_FILE}: ${err.message}`);
    }
  }
  return null;
}

export function save(next) {
  ensureDir();
  state = next ?? state;
  // Write to a temp file first so a crash mid-write cannot truncate the store.
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
  return state;
}

export function db() {
  const current = load();
  if (!current) {
    throw new Error('Datastore is empty. Run "npm run seed" in /server first.');
  }
  return current;
}

/** Read-modify-write helper: mutate inside the callback, persistence is handled. */
export function mutate(fn) {
  const current = db();
  const result = fn(current);
  save(current);
  return result;
}

export function setState(next) {
  state = next;
  return save(next);
}

export const paths = { DATA_DIR, DATA_FILE };
