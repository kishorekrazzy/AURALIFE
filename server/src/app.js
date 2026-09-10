import express from 'express';
import cors from 'cors';

import { load, setState, paths } from './db.js';
import { buildSeed } from './seed.js';
import catalog from './routes/catalog.js';
import appointments from './routes/appointments.js';
import operations from './routes/operations.js';
import assistant from './routes/assistant.js';
import notifications from './routes/notifications.js';

/**
 * Creates the API without opening a network port. Keeping this separate from
 * the local server entry point lets the same routes run in a Netlify Function.
 */
export function createApp() {
  // Seed on first boot so a fresh serverless function has usable demo data.
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

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Unknown endpoint', path: req.originalUrl });
  });

  app.use((err, req, res, next) => {
    console.error('[auralife] unhandled error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
