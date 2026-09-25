import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isGenerationBusy,
  triggerGenerationPipeline,
  getSchedulerStatus,
  startDailyScheduler,
  stopDailyScheduler
} from '../server/services/scheduler.mjs';
import { addSSEClient, removeSSEClient } from '../server/services/sseManager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIEFINGS_DIR = path.resolve(__dirname, '../data/briefings');

test('Scheduler - 初始状态为空闲且返回标准调度状态', () => {
  assert.equal(isGenerationBusy(), false);
  const status = getSchedulerStatus();
  assert.equal(status.isGenerating, false);
  assert.equal(status.currentGeneratingDate, null);
  assert.equal(status.currentStageInfo, null);
  assert.ok(status.scheduleTime);
  assert.ok(status.activeModel);
});

test('Scheduler - 能够触发生成并在完成时释放互斥锁并持久化简报', async () => {
  const targetDate = '2026-09-25';
  const briefingFile = path.join(BRIEFINGS_DIR, `${targetDate}.json`);
  const originalContent = fs.existsSync(briefingFile) ? fs.readFileSync(briefingFile, 'utf-8') : null;

  try {
    // 监听 SSE 广播流，验证 stage 回调被调用
    const receivedMessages = [];
    const mockRes = {
      write: (chunk) => {
        receivedMessages.push(chunk);
      }
    };
    const clientId = addSSEClient(mockRes);

    const res = await triggerGenerationPipeline(targetDate);
    removeSSEClient(clientId);

    assert.equal(res.success, true);
    assert.equal(res.date, targetDate);
    assert.ok(res.itemCount >= 8 && res.itemCount <= 12);
    assert.equal(isGenerationBusy(), false);

    // 验证调度器状态重置
    const status = getSchedulerStatus();
    assert.equal(status.isGenerating, false);
    assert.equal(status.currentGeneratingDate, null);

    // 验证 SSE 广播接收到进度
    const progressMessages = receivedMessages
      .filter(msg => msg.startsWith('data: '))
      .map(msg => JSON.parse(msg.replace(/^data: /, '').trim()))
      .filter(payload => payload.type === 'PROGRESS');

    assert.ok(progressMessages.length >= 4, `应当收到至少4个PROGRESS广播，实际: ${progressMessages.length}`);
    const stages = progressMessages.map(m => m.stage);
    assert.ok(stages.includes('AGENT_INIT'));
    assert.ok(stages.includes('COMPLETED'));

    // 验证 saveBriefing 物理文件写入
    assert.ok(fs.existsSync(briefingFile), `简报文件应当存在: ${briefingFile}`);
    const content = JSON.parse(fs.readFileSync(briefingFile, 'utf-8'));
    assert.ok(Array.isArray(content.items));
    assert.equal(content.batchStatus.status, 'COMPLETED');
    assert.equal(content.batchStatus.date, targetDate);
  } finally {
    if (originalContent !== null) {
      fs.writeFileSync(briefingFile, originalContent, 'utf-8');
    }
  }
});

test('Scheduler - 并发防重互斥锁：生成期间再次触发应返回 conflict 冲突状态', async () => {
  const testDate = '2026-09-26';
  const testFile = path.join(BRIEFINGS_DIR, `${testDate}.json`);
  const originalContent = fs.existsSync(testFile) ? fs.readFileSync(testFile, 'utf-8') : null;

  try {
    // 启动第一个长时间任务（不加 await）
    const promise1 = triggerGenerationPipeline(testDate);

    // 验证此时互斥锁已上锁
    assert.equal(isGenerationBusy(), true);
    const busyStatus = getSchedulerStatus();
    assert.equal(busyStatus.isGenerating, true);
    assert.equal(busyStatus.currentGeneratingDate, testDate);

    // 立即发起并发调用，期望被互斥锁拦截
    const conflictRes = await triggerGenerationPipeline('2026-09-27');
    assert.equal(conflictRes.success, false);
    assert.equal(conflictRes.conflict, true);
    assert.ok(conflictRes.message.includes('当前正在生成批次'));
    assert.ok(conflictRes.currentStageInfo);

    // 等待第一个任务正常完成
    const firstRes = await promise1;
    assert.equal(firstRes.success, true);
    assert.equal(isGenerationBusy(), false);
  } finally {
    if (originalContent !== null) {
      fs.writeFileSync(testFile, originalContent, 'utf-8');
    } else if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
});

test('Scheduler - startDailyScheduler 能够安全启动定时巡检且不阻塞退出', () => {
  startDailyScheduler();
  // 重复启动应幂等忽略
  startDailyScheduler();
  // 停止定时巡检，清理资源
  stopDailyScheduler();
});
