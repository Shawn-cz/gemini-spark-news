import dotenv from 'dotenv';
import { generateDailyBriefing, getActiveModel } from './geminiSparkAgent.mjs';
import { broadcastSSEMessage } from './sseManager.mjs';
import { saveBriefing } from '../repository.mjs';

dotenv.config();

const SCHEDULE_TIME = process.env.SCHEDULE_TIME || '08:30';

let isGenerating = false;
let currentGeneratingDate = null;
let currentStageInfo = null;
let watchdogTimer = null;
let cronInterval = null;

export function isGenerationBusy() {
  return isGenerating;
}

export function getSchedulerStatus() {
  return {
    isGenerating,
    currentGeneratingDate,
    currentStageInfo,
    scheduleTime: process.env.SCHEDULE_TIME || SCHEDULE_TIME,
    activeModel: getActiveModel()
  };
}

let runIdCounter = 0;

/**
 * 触发批次生成工作流（带并发互斥锁与防死锁看门狗）
 */
export async function triggerGenerationPipeline(targetDate = new Date().toISOString().slice(0, 10)) {
  if (isGenerating) {
    return {
      success: false,
      conflict: true,
      message: `Gemini Spark 智能体当前正在生成批次 [${currentGeneratingDate}]，进度: ${currentStageInfo?.progress || 0}%`,
      currentStageInfo
    };
  }

  const currentRunId = ++runIdCounter;
  isGenerating = true;
  currentGeneratingDate = targetDate;
  currentStageInfo = {
    stage: 'AGENT_INIT',
    progress: 15,
    message: '正在唤醒 Gemini Spark 智能体...'
  };

  // 120 秒看门狗定时器，防止异常死锁
  if (watchdogTimer) clearTimeout(watchdogTimer);
  watchdogTimer = setTimeout(() => {
    if (isGenerating && runIdCounter === currentRunId) {
      console.warn(`[Scheduler] ⚠️ 监测到生成流程超过 120s 未释放，触发看门狗强制解锁`);
      isGenerating = false;
      currentGeneratingDate = null;
      currentStageInfo = null;
      broadcastSSEMessage({
        type: 'ERROR',
        message: '生成任务超时，已自动解除互斥锁'
      });
    }
  }, 120000);

  try {
    console.log(`[Scheduler] 🚀 启动 [${targetDate}] Gemini Spark 生产流 (模型: ${getActiveModel()})`);

    const result = await generateDailyBriefing(targetDate, async (stageData) => {
      if (runIdCounter === currentRunId) {
        currentStageInfo = stageData;
        broadcastSSEMessage(stageData);
      }
    });

    if (runIdCounter !== currentRunId) {
      console.warn(`[Scheduler] ⚠️ 任务 [${targetDate}] 运行过期被放弃保存`);
      return { success: false, expired: true };
    }

    // 双写持久化至 MongoDB 与 本地文件
    await saveBriefing(targetDate, {
      items: result.items,
      batchStatus: {
        date: targetDate,
        status: 'COMPLETED',
        statusText: '已完成归档',
        generatedTime: `${targetDate} 08:30:00`,
        nextScheduleTime: '明日 08:30:00 (每日晨报)',
        progress: 100,
        currentStage: `Gemini Spark (${result.model}) 24H 简报生成与交叉校验完成`
      }
    });

    // 广播批次生成完成事件
    broadcastSSEMessage({
      type: 'COMPLETED',
      stage: 'COMPLETED',
      progress: 100,
      date: targetDate,
      itemCount: result.items.length,
      model: result.model,
      message: `Gemini Spark (${result.model}) 24H 简报生成与落盘归档完成`
    });

    console.log(`[Scheduler] ✅ [${targetDate}] 生产流执行完毕，持久化双写成功！`);

    return {
      success: true,
      date: targetDate,
      model: result.model,
      itemCount: result.items.length,
      mode: result.mode
    };
  } catch (err) {
    console.error(`[Scheduler] ❌ 生成失败:`, err);
    if (runIdCounter === currentRunId) {
      broadcastSSEMessage({
        type: 'ERROR',
        message: `生成流程发生异常: ${err.message}`,
        timestamp: new Date().toISOString()
      });
    }
    throw err;
  } finally {
    if (runIdCounter === currentRunId) {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      isGenerating = false;
      currentGeneratingDate = null;
    }
  }
}

/**
 * 启动 08:30 定时调度巡检
 */
export function startDailyScheduler() {
  if (cronInterval) return;

  const schedTime = process.env.SCHEDULE_TIME || SCHEDULE_TIME;
  const [schedHour, schedMinute] = schedTime.split(':').map(Number);
  console.log(`[Scheduler] ⏰ 每日定时调度服务已就绪，目标唤醒时间: 每天 ${String(schedHour).padStart(2, '0')}:${String(schedMinute).padStart(2, '0')}:00`);

  let lastTriggeredDay = '';

  cronInterval = setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = now.toISOString().slice(0, 10);

    if (currentHour === schedHour && currentMinute === schedMinute && lastTriggeredDay !== todayStr) {
      lastTriggeredDay = todayStr;
      console.log(`[Scheduler] ⏰ 到达指定调度时间 (${schedTime})，自动唤醒 Gemini Spark 生产流...`);
      try {
        await triggerGenerationPipeline(todayStr);
      } catch (e) {
        console.error(`[Scheduler] 自动生成调度异常:`, e.message);
      }
    }
  }, 30000); // 每 30 秒巡检一次时钟

  if (cronInterval && typeof cronInterval.unref === 'function') {
    cronInterval.unref();
  }
}

/**
 * 停止定时调度巡检（供资源清理与测试调用）
 */
export function stopDailyScheduler() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
