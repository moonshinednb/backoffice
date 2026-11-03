import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite on :5173 proxies /api to Django on :8000.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  // Fonts are never inlined as data: URIs; the CSP only allows font-src 'self'.
  build: { outDir: 'dist', assetsDir: 'static', chunkSizeWarningLimit: 900, assetsInlineLimit: (file: string) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
});
