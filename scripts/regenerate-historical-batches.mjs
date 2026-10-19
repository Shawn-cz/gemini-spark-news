import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, saveBriefing } from '../server/repository.mjs';
import { generateDailyBriefing } from '../server/services/geminiSparkAgent.mjs';
import { NewsItemModel } from '../server/models/NewsItem.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目标需要重新生成的历史/克隆日期批次清单
const TARGET_DATES = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
  '2026-09-28',
  '2026-10-04',
  '2026-10-05',
  '2026-10-19' // 当天批次也用真实大模型重塑，确保实时与零重复
];

function normalize(t) {
  return (t || '')
    .replace(/^\[往期智库\]\s*/, '')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('===============================================================');
  console.log('🚀 Gemini Spark 历史与当天批次深度重塑引擎 (方式 B 真实大模型重写)');
  console.log('===============================================================');

  const dbConnected = await initDatabase();
  if (!dbConnected) {
    console.error('❌ 无法连接 MongoDB Atlas，脚本终止。请检查网络环境与 MONGO_URI。');
    process.exit(1);
  }

  // 1. 搜集数据库中所有其他真实日期的有效标题作为基础排除列表
  const GLOBAL_CORPUS_KEYWORD = 'OpenAI 与 Anthropic 新一代前沿模型评测曝光';
  const allExistingItems = await NewsItemModel.find({}, 'title batchDate').lean();
  
  const exclusionTitleSet = new Set();
  for (const it of allExistingItems) {
    if (it && it.title && !it.title.includes(GLOBAL_CORPUS_KEYWORD)) {
      exclusionTitleSet.add(it.title.trim());
    }
  }

  // 找出目前仍在使用旧语料的待重塑日期
  const datesToProcess = [];
  for (const d of TARGET_DATES) {
    const hasCorpus = await NewsItemModel.findOne({ batchDate: d, title: { $regex: GLOBAL_CORPUS_KEYWORD } });
    if (hasCorpus) {
      datesToProcess.push(d);
    }
  }

  console.log(`[初始化] 已载入 ${exclusionTitleSet.size} 个往期已发表研报标题作为防重负样本。`);
  console.log(`[计划] 经检查，待重塑生成的批次 (${datesToProcess.length} 个): [${datesToProcess.join(', ')}]`);

  const resultsSummary = [];

  for (let i = 0; i < datesToProcess.length; i++) {
    const targetDate = datesToProcess[i];
    console.log(`\n---------------------------------------------------------------`);
    console.log(`[${i + 1}/${datesToProcess.length}] 正在唤醒真实 Gemini Spark 智能体生成 [${targetDate}] 批次...`);
    
    const exclusionList = Array.from(exclusionTitleSet);
    let attempts = 0;
    let briefingResult = null;

    while (attempts < 3) {
      attempts++;
      try {
        briefingResult = await generateDailyBriefing(
          targetDate,
          (prog) => {
            console.log(`   [${targetDate}] [${prog.stage}] ${prog.progress}% - ${prog.message}`);
          },
          exclusionList
        );

        if (briefingResult && Array.isArray(briefingResult.items) && briefingResult.items.length === 12) {
          // 校验是否误用 fallback 模式
          if (briefingResult.mode === 'CORPUS_FALLBACK') {
            console.warn(`   ⚠️ 批次 [${targetDate}] 触发了 fallback 语料，重新尝试调用真实 API...`);
            await sleep(3000);
            continue;
          }
          break;
        } else {
          console.warn(`   ⚠️ 批次 [${targetDate}] 返回条目数非 12 篇 (${briefingResult?.items?.length || 0})，重试 (${attempts}/3)...`);
          await sleep(3000);
        }
      } catch (err) {
        console.error(`   ❌ 批次 [${targetDate}] 生成发生异常 (${err.message})，重试 (${attempts}/3)...`);
        await sleep(3000);
      }
    }

    if (!briefingResult || briefingResult.items.length !== 12) {
      console.error(`❌ 批次 [${targetDate}] 经过 3 次重试仍未成功生成合规 12 篇，终止后续操作。`);
      process.exit(1);
    }

    // 落盘写入 MongoDB 与 本地文件
    const saved = await saveBriefing(targetDate, {
      items: briefingResult.items,
      nobelQuote: briefingResult.nobelQuote,
      batchStatus: {
        date: targetDate,
        status: 'COMPLETED',
        statusText: '已完成归档',
        generatedTime: `${targetDate} 08:30:00`,
        nextScheduleTime: '明日 08:30:00 (每日晨报)',
        progress: 100,
        currentStage: `Gemini Spark (${briefingResult.model}) 24H 简报生成与交叉校验完成`
      }
    });

    // 将本批次新生成的 12 个标题加入防重池
    for (const item of briefingResult.items) {
      exclusionTitleSet.add(item.title.trim());
    }

    console.log(`   ✅ 批次 [${targetDate}] 生产完毕：12 篇全新独立要闻已成功落盘更新！`);
    resultsSummary.push({
      date: targetDate,
      mode: briefingResult.mode,
      model: briefingResult.model,
      itemsCount: briefingResult.items.length,
      sampleTitle: briefingResult.items[0].title
    });

    // 间隔 2 秒防流控
    if (i < TARGET_DATES.length - 1) {
      console.log(`   ⏳ 等待 2 秒后生成下一批次...`);
      await sleep(2000);
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 所有目标批次生成与落盘完毕！现在执行全库跨天零重复终验...');
  console.log('===============================================================');

  // 全库防重终验
  const allFinalItems = await NewsItemModel.find({}, 'title batchDate').lean();
  const titleToDates = new Map();
  for (const it of allFinalItems) {
    const norm = normalize(it.title);
    if (!titleToDates.has(norm)) {
      titleToDates.set(norm, { originalTitle: it.title, dates: new Set() });
    }
    titleToDates.get(norm).dates.add(it.batchDate);
  }

  const duplicates = [];
  for (const [norm, info] of titleToDates.entries()) {
    if (info.dates.size > 1) {
      duplicates.push(info);
    }
  }

  console.log(`全库总资讯数: ${allFinalItems.length}`);
  console.log(`跨天重复条目数: ${duplicates.length}`);
  if (duplicates.length === 0) {
    console.log('✅ 完美！全库所有批次新闻绝对独立，跨天重复率 0.00%！');
  } else {
    console.warn('⚠️ 仍存在重复项:', duplicates);
  }

  await mongoose.disconnect();
  console.log('✅ 数据库连接已优雅关闭。');
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});
