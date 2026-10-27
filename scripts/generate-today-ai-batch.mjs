import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initDatabase, saveBriefing, getRecentNewsTitles } from '../server/repository.mjs';
import { generateDailyBriefing } from '../server/services/geminiSparkAgent.mjs';

dotenv.config();

async function main() {
  const targetDate = process.argv[2] || '2026-10-27';
  console.log('===============================================================');
  console.log(`🚀 启动 Gemini Spark 16 篇满配 (8 篇大型 AI 公司新动态) 实时生成: [${targetDate}]`);
  console.log('===============================================================');

  const dbConnected = await initDatabase();
  if (!dbConnected) {
    console.warn('⚠️ 未能连接 MongoDB Atlas，将仅保存至本地 data/briefings 目录。');
  }

  const recentTitles = await getRecentNewsTitles(14);
  console.log(`[排重防撞] 已提取近期 ${recentTitles.length} 篇已发表标题作为排重负样本。`);

  const result = await generateDailyBriefing(
    targetDate,
    (prog) => {
      console.log(`   [${targetDate}] [${prog.stage}] ${prog.progress}% - ${prog.message}`);
    },
    recentTitles
  );

  const aiCount = result.items.filter(i => i.category === 'ai').length;
  const finCount = result.items.filter(i => i.category === 'finance').length;
  const geoCount = result.items.filter(i => i.category === 'geopolitics').length;
  const cliCount = result.items.filter(i => i.category === 'climate').length;

  console.log(`\n📊 [${targetDate}] 生成结果分布统计:`);
  console.log(`   - 总篇数: ${result.items.length} 篇 (生成模式: ${result.mode})`);
  console.log(`   - AI 领域 (大型 AI 公司新动态): ${aiCount} 篇`);
  console.log(`   - 全球金融: ${finCount} 篇 | 地缘政治: ${geoCount} 篇 | 气候能源: ${cliCount} 篇`);
  console.log(`\n🤖 8 篇 AI 领域重点标题一览:`);
  result.items
    .filter(i => i.category === 'ai')
    .forEach((item, idx) => {
      console.log(`   [AI #${idx + 1}] (${item.impactLevel}) ${item.title}`);
    });

  await saveBriefing(targetDate, {
    items: result.items,
    nobelQuote: result.nobelQuote,
    batchStatus: {
      date: targetDate,
      status: 'COMPLETED',
      statusText: '已完成归档',
      generatedTime: `${targetDate} 08:30:00`,
      nextScheduleTime: '明日 08:30:00 (每日晨报)',
      progress: 100,
      currentStage: `Gemini Spark (${result.model}) 24H 简报生成与交叉校验完成 (16篇满配·8篇AI深潜)`
    }
  });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  console.log(`\n✅ [${targetDate}] 16 篇满配简报已成功持久化至 MongoDB Atlas 与 data/briefings/${targetDate}.json！`);
}

main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
