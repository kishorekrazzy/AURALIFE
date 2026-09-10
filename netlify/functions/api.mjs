import serverless from 'serverless-http';
import { createApp } from '../../server/src/app.js';

// Netlify rewrites /api/* to this function while preserving the original path.
export const handler = serverless(createApp());
