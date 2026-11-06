import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  return {
    // When a custom domain is configured (e.g. CNAME exists) or GITHUB_PAGES with custom domain, serve from root '/'
    base: process.env.GITHUB_PAGES === 'true' && !process.env.CUSTOM_DOMAIN && process.env.GITHUB_REPOSITORY_SUBPATH === 'true'
      ? '/My-Portfolio-2.0/'
      : './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
