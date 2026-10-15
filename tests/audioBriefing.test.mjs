import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyAudioBriefing } from '../server/services/audioBriefingService.mjs';

test('Audio Briefing - 3分钟智库早茶播报文稿合成与分句队列', async () => {
  const briefing = await generateDailyAudioBriefing('2026-10-15');
  assert.ok(briefing, 'Briefing 必须存在');
  assert.equal(briefing.date, '2026-10-15');
  assert.ok(briefing.title.includes('智库早茶'));
  assert.ok(typeof briefing.estimatedDurationSeconds === 'number');
  assert.ok(briefing.intro.length > 20, 'intro 开场白长度必须合规');
  assert.ok(Array.isArray(briefing.sections), 'sections 必须为数组');
  assert.ok(briefing.sections.length > 0, 'sections 至少包含一条核心条目');
  assert.ok(briefing.outro.length > 20, 'outro 结语长度必须合规');
  assert.ok(Array.isArray(briefing.sentences), 'sentences 必须拆分为可供 Web Speech 队列接力朗读的句子数组');
  assert.ok(briefing.sentences.length >= 3, '句子数必须拆分充分，防范长文本中断');
  assert.ok(briefing.fullScript.length > 100, 'fullScript 完整文稿必须存在');
});
