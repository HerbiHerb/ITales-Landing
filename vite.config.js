import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { header, footer, consentPanel } from './src/templates/shell.js';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    base: env.VITE_BASE_PATH || './',
    plugins: [{
      name: 'static-site-shell',
      transformIndexHtml(html, context) {
        const page = context.filename.split(/[\\/]/).pop().replace('.html', '');
        return html.replace('<!-- SITE_HEADER -->', header(page))
          .replace('<!-- SITE_FOOTER -->', footer())
          .replace('<!-- CONSENT_PANEL -->', consentPanel());
      },
    }],
    build: {
      rollupOptions: {
        input: Object.fromEntries(['index', 'game', 'editor', 'interest', 'impressum', 'privacy']
          .map((page) => [page, resolve(process.cwd(), `${page}.html`)])),
      },
    },
  };
});
