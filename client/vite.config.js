import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Set VITE_BASE=/AURALIFE/ for a GitHub Pages build. Netlify uses /.
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      port: 5173,
      // Everything under /api is proxied to the Express server in development,
      // so the client uses the same relative paths in dev and production.
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: { outDir: 'dist', sourcemap: true },
  };
});
