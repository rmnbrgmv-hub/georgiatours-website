/**
 * Parses geotags.xml from a geoimages folder, copies JPGs to public/geoimages,
 * and writes public/geoimages/geo.json for the map and home collage.
 *
 * Usage: node scripts/prepare-geoimages.js [path-to-geoimages]
 * Example: node scripts/prepare-geoimages.js C:\Users\Heyder\Desktop\geoimages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const sourceDir = path.resolve(process.argv[2] || path.join(projectRoot, '..', 'geoimages'));
const publicGeo = path.join(projectRoot, 'public', 'geoimages');
const xmlPath = path.join(sourceDir, 'geotags.xml');

if (!fs.existsSync(xmlPath)) {
  console.error('geotags.xml not found at', xmlPath);
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error('Source dir not found:', sourceDir);
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, 'utf8');
const xmlByFile = new Map(); // normalized filename -> { title, lat, lng }
const photoBlocks = xml.match(/<photo>[\s\S]*?<\/photo>/g) || [];

for (const block of photoBlocks) {
  const name = block.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim();
  const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || name?.replace(/\.(jpg|jpeg)$/i, '') || '';
  const lat = parseFloat(block.match(/<latitude>([\s\S]*?)<\/latitude>/)?.[1]?.trim());
  const lng = parseFloat(block.match(/<longitude>([\s\S]*?)<\/longitude>/)?.[1]?.trim());
  if (!name || Number.isNaN(lat) || Number.isNaN(lng)) continue;
  const ext = path.extname(name).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg') continue;
  const norm = name.replace(/\s+/g, ' ').trim();
  xmlByFile.set(norm, { title, lat, lng });
  xmlByFile.set(name, { title, lat, lng });
}

// Georgia center fallback when XML has no coords for a file
const DEFAULT_LAT = 41.7;
const DEFAULT_LNG = 44.8;

if (!fs.existsSync(publicGeo)) fs.mkdirSync(publicGeo, { recursive: true });

const result = [];
let idx = 0;
const files = fs.readdirSync(sourceDir).filter((f) => /\.(jpg|jpeg)$/i.test(f));

for (const file of files) {
  const srcPath = path.join(sourceDir, file);
  if (!fs.statSync(srcPath).isFile()) continue;
  const meta = xmlByFile.get(file) || xmlByFile.get(file.replace(/\s+/g, ' ').trim());
  const title = meta?.title || file.replace(/\.(jpg|jpeg)$/i, '').replace(/^Image of\s+/i, '');
  const lat = meta?.lat ?? DEFAULT_LAT;
  const lng = meta?.lng ?? DEFAULT_LNG;
  idx += 1;
  const safeName = `${idx}.jpg`;
  const destPath = path.join(publicGeo, safeName);
  fs.copyFileSync(srcPath, destPath);
  result.push({
    src: `/geoimages/${safeName}`,
    title,
    lat,
    lng,
  });
}

fs.writeFileSync(path.join(publicGeo, 'geo.json'), JSON.stringify(result, null, 0));
console.log(`Wrote ${result.length} photos to public/geoimages and geo.json`);
process.exit(0);
