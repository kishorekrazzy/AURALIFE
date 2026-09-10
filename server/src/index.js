import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { load, setState, paths } from './db.js';
import { buildSeed } from './seed.js';
import catalog from './routes/catalog.js';
import appointments from './routes/appointments.js';
import operations from './routes/operations.js';
import assistant from './routes/assistant.js';
import notifications from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;

// Seed on first boot so the API is never served from an empty store.
if (!load()) {
  setState(buildSeed());
  console.log(`[auralife] seeded datastore → ${paths.DATA_FILE}`);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
});

app.get('/api/health', (req, res) => {
  const state = load();
  res.json({
    status: 'ok',
    service: 'auralife-api',
    seededAt: state ? state.meta.seededAt : null,
    counts: state
      ? {
          hospitals: state.hospitals.length,
          doctors: state.doctors.length,
          departments: state.departments.length,
          appointments: state.appointments.length,
          emergencies: state.emergencies.length,
        }
      : null,
  });
});

app.use('/api', catalog);
app.use('/api/appointments', appointments);
app.use('/api', operations);
app.use('/api', assistant);
app.use('/api', notifications);

// Serve the built client if it exists, so `npm start` gives a single origin.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Unknown endpoint', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('[auralife] unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[auralife] API listening on http://localhost:${PORT}`);
  console.log(`[auralife] health check: http://localhost:${PORT}/api/health`);
});
