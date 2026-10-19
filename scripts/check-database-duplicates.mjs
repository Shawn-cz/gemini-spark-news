import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { NewsItemModel } from '../server/models/NewsItem.mjs';

dotenv.config();

function normalize(t) {
  return (t || '')
    .replace(/^\[往期智库\]\s*/, '')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const items = await NewsItemModel.find({}, 'title batchDate id category').lean();
  console.log(`Loaded ${items.length} news items from MongoDB Atlas.`);

  // 按日期归组
  const dateMap = {};
  for (const it of items) {
    const d = it.batchDate || 'unknown';
    if (!dateMap[d]) dateMap[d] = [];
    dateMap[d].push(it);
  }

  const dates = Object.keys(dateMap).sort();
  console.log('Dates found:', dates);

  // 检查跨天重复
  const titleToDates = new Map();
  for (const it of items) {
    const norm = normalize(it.title);
    if (!titleToDates.has(norm)) {
      titleToDates.set(norm, { originalTitle: it.title, dates: new Set() });
    }
    titleToDates.get(norm).dates.add(it.batchDate);
  }

  const duplicatedTitles = [];
  for (const [norm, info] of titleToDates.entries()) {
    if (info.dates.size > 1) {
      duplicatedTitles.push({
        title: info.originalTitle,
        dates: Array.from(info.dates).sort()
      });
    }
  }

  console.log(`\nFound ${duplicatedTitles.length} duplicated news titles across multiple dates:`);
  duplicatedTitles.forEach((dt, idx) => {
    console.log(`[#${idx + 1}] "${dt.title.slice(0, 40)}..." appears in ${dt.dates.length} dates: [${dt.dates.join(', ')}]`);
  });

  await mongoose.disconnect();
}

main();
