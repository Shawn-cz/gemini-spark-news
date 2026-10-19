import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NewsItemModel } from '../server/models/NewsItem.mjs';
import { BatchStatusModel } from '../server/models/BatchStatus.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const dates = await NewsItemModel.distinct('batchDate');
  console.log(`Found ${dates.length} batch dates in MongoDB Atlas.`);

  if (!fs.existsSync(BRIEFINGS_DIR)) {
    fs.mkdirSync(BRIEFINGS_DIR, { recursive: true });
  }

  for (const date of dates.sort()) {
    const items = await NewsItemModel.find({ batchDate: date }).lean();
    const batchStatus = await BatchStatusModel.findOne({ date }).lean();

    const payload = {
      batchDate: date,
      items: items.map(it => {
        const { _id, __v, ...rest } = it;
        return rest;
      }),
      batchStatus: batchStatus ? {
        date: batchStatus.date,
        status: batchStatus.status,
        statusText: batchStatus.statusText,
        generatedTime: batchStatus.generatedTime,
        nextScheduleTime: batchStatus.nextScheduleTime,
        progress: batchStatus.progress,
        currentStage: batchStatus.currentStage
      } : {
        date,
        status: 'COMPLETED',
        statusText: '已完成归档',
        generatedTime: `${date} 08:30:00`,
        nextScheduleTime: '明日 08:30:00 (每日晨报)',
        progress: 100
      },
      nobelQuote: batchStatus?.nobelQuote
    };

    const filePath = path.join(BRIEFINGS_DIR, `${date}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  console.log(`✅ All ${dates.length} dates successfully synced to data/briefings/*.json!`);
  await mongoose.disconnect();
}

main();
