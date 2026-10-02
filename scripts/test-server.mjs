import { build, preview } from 'vite';
import { resolve } from 'node:path';

const [variant = 'root', port = '4173'] = process.argv.slice(2);
const base = variant === 'nested' ? '/ITales-Landing/' : '/';
// Fictional public identifiers used only by intercepted browser tests.
process.env.VITE_FORMSPREE_FORM_ID = 'testform';
process.env.VITE_GA_MEASUREMENT_ID = 'G-TEST12345';
process.env.VITE_BASE_PATH = base;
const outDir = resolve('node_modules/.cache/itales-tests', variant);
await build({ mode: 'test', base, build: { outDir, emptyOutDir: true }, logLevel: 'warn' });
await preview({ mode: 'test', base, build: { outDir }, preview: { host: '127.0.0.1', port: Number(port), strictPort: true }, logLevel: 'warn' });
