import { build, loadEnv } from 'vite';
import { serviceConfig } from '../src/config/services.js';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const config = serviceConfig(env);
const missing = [];
if (!config.formEndpoint) missing.push('VITE_FORMSPREE_FORM_ID');
if (!config.measurementId) missing.push('VITE_GA_MEASUREMENT_ID');
if (missing.length) {
  console.error(`Production deployment requires a valid ${missing.join(' and ')}. See .env.example.`);
  process.exit(1);
}
await build({ mode: 'production' });
