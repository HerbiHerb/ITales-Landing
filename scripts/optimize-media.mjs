import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';

const [source, target] = process.argv.slice(2);
if (!source || !target) {
  console.error('Usage: npm run optimize:media -- input.png output.webp');
  process.exit(1);
}
await mkdir(dirname(resolve(target)), { recursive: true });
await sharp(source).resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 82 }).toFile(target);
