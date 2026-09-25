import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { NewsItemModel } from '../server/models/NewsItem.mjs';
import { BatchStatusModel } from '../server/models/BatchStatus.mjs';
import { createGlobalDailyBatch } from '../server/corpus.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri || !uri.trim()) {
    console.error('❌ 错误: 未在 .env 文件中检测到 MONGO_URI。');
    console.log('💡 请在 .env 中填入你的 MongoDB Atlas 连接字符串后再运行本脚本。');
    process.exit(1);
  }

  console.log('🔄 正在连接 MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ 成功连接至 MongoDB！开始执行数据种子初始化...');

  // 1. 种子日期列表
  const dates = ['2026-09-25', '2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21'];
  let totalInserted = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    let items = [];
    let batchStatus = null;

    // 优先读取物理文件
    const filePath = path.join(BRIEFINGS_DIR, `${date}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        batchStatus = Array.isArray(parsed) ? null : (parsed.batchStatus || null);
        console.log(`📄 从物理文件读取 [${date}] (${items.length} 篇)`);
      } catch (e) {
        console.warn(`读取文件 ${filePath} 异常:`, e.message);
      }
    }

    // 若无物理文件，从语料库生成
    if (items.length === 0) {
      items = createGlobalDailyBatch(date, i);
      console.log(`🧠 从全局语料库生成 [${date}] (${items.length} 篇)`);
    }

    // 写入批次状态
    await BatchStatusModel.findOneAndUpdate(
      { date },
      {
        date,
        status: batchStatus?.status || 'COMPLETED',
        statusText: batchStatus?.statusText || '已完成归档',
        generatedTime: batchStatus?.generatedTime || `${date} 08:30:00`,
        nextScheduleTime: batchStatus?.nextScheduleTime || '明日 08:30:00 (每日晨报)',
        scheduleInterval: '每 24 小时由 Gemini Spark 生成一次 (每天 08:30 AM 晨报)',
        scheduleCron: '30 8 * * *',
        estimatedRemainingMinutes: 0,
        progress: 100,
        currentStage: batchStatus?.currentStage || 'Gemini Spark 智能体 24H 简报生成与交叉校验完成',
        batchNewsCount: items.length
      },
      { upsert: true, new: true }
    );

    // 清除并写入新闻
    await NewsItemModel.deleteMany({ batchDate: date });
    if (items.length > 0) {
      const docs = items.map((it, idx) => ({
        ...it,
        id: it.id || `gemini-${date}-${String(idx + 1).padStart(3, '0')}`,
        batchDate: date
      }));
      await NewsItemModel.insertMany(docs);
      totalInserted += docs.length;
    }
  }

  console.log(`🎉 数据迁移完成！成功灌入 ${dates.length} 个天次，共计 ${totalInserted} 篇全球深度情报。`);
  await mongoose.disconnect();
  console.log('🔌 已安全断开数据库连接。');
}

seed().catch(err => {
  console.error('❌ 数据种子填充失败:', err);
  process.exit(1);
});
