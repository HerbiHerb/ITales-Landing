import { build, loadEnv } from 'vite';
import { serviceConfig } from '../src/config/services.js';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const config = serviceConfig(env);
if (!config.formEndpoint || !config.measurementId) {
  console.error('Production deployment requires a valid VITE_FORMSPREE_FORM_ID and VITE_GA_MEASUREMENT_ID. See .env.example.');
  process.exit(1);
}
await build({ mode: 'production' });
