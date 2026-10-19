import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

function normalize(t) {
  return (t || '')
    .replace(/^\[往期智库\]\s*/, '')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

const files = fs.readdirSync(BRIEFINGS_DIR).filter(f => f.endsWith('.json') && /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
console.log(`Checking ${files.length} local JSON briefing files...`);

const titleToDates = new Map();
let totalArticles = 0;

for (const f of files.sort()) {
  const date = f.replace('.json', '');
  const content = JSON.parse(fs.readFileSync(path.join(BRIEFINGS_DIR, f), 'utf-8'));
  const items = Array.isArray(content) ? content : (content.items || []);
  totalArticles += items.length;

  for (const it of items) {
    const norm = normalize(it.title);
    if (!titleToDates.has(norm)) {
      titleToDates.set(norm, { originalTitle: it.title, dates: new Set() });
    }
    titleToDates.get(norm).dates.add(date);
  }
}

const duplicates = [];
for (const [norm, info] of titleToDates.entries()) {
  if (info.dates.size > 1) {
    duplicates.push(info);
  }
}

console.log(`Total local briefing files: ${files.length}`);
console.log(`Total local news articles: ${totalArticles}`);
console.log(`Duplicated news titles across dates: ${duplicates.length}`);
if (duplicates.length === 0) {
  console.log('✅ ALL LOCAL BRIEFING FILES HAVE ZERO DUPLICATES! 100% INDEPENDENT!');
} else {
  console.error('❌ Duplicates found:', duplicates);
  process.exit(1);
}
