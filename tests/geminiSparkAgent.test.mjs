import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getActiveModel,
  setActiveModel,
  getAvailableModels,
  buildSparkPrompt,
  generateDailyBriefing,
  AVAILABLE_MODELS
} from '../server/services/geminiSparkAgent.mjs';

test('GeminiSparkAgent - 初始默认模型为 gemini-3.8-flash', () => {
  const current = getActiveModel();
  assert.equal(current, 'gemini-3.8-flash');
});

test('GeminiSparkAgent - 获取可用模型列表包含 flash 与 pro', () => {
  const models = getAvailableModels();
  assert.equal(models.length, 2);
  assert.equal(models[0].id, 'gemini-3.8-flash');
  assert.equal(models[0].tier, 'workhorse');
  assert.equal(models[1].id, 'gemini-3.1-pro');
  assert.equal(models[1].tier, 'deep_reasoning');
});

test('GeminiSparkAgent - 动态切换模型为 gemini-3.1-pro', () => {
  const result = setActiveModel('gemini-3.1-pro');
  assert.equal(result.success, true);
  assert.equal(getActiveModel(), 'gemini-3.1-pro');
  // 恢复默认
  setActiveModel('gemini-3.8-flash');
  assert.equal(getActiveModel(), 'gemini-3.8-flash');
});

test('GeminiSparkAgent - 拒绝切换不存在或未经验证的模型', () => {
  assert.throws(() => {
    setActiveModel('gemini-3.8-pro');
  }, /不支持或非法的 Gemini 模型/);
});

test('GeminiSparkAgent - buildSparkPrompt 生成包含目标日期与契约规则的提示词', () => {
  const prompt = buildSparkPrompt('2026-09-25');
  assert.ok(prompt.includes('2026-09-25'));
  assert.ok(prompt.includes('12 篇'));
  assert.ok(prompt.includes('critical'));
  assert.ok(prompt.includes('climate'));
});

test('GeminiSparkAgent - 双模容灾生成合法智库简报 (满配 12 篇，包含 1 篇 critical，2 篇 climate)', async () => {
  const stages = [];
  const briefing = await generateDailyBriefing('2026-09-25', (stageData) => {
    stages.push(stageData);
  });

  assert.ok(Array.isArray(briefing.items));
  assert.equal(briefing.items.length, 12, `新闻总数必须严格为满配 12 篇，实际: ${briefing.items.length}`);
  
  const criticalItems = briefing.items.filter(i => i.impactLevel === 'critical');
  assert.equal(criticalItems.length, 1, '必须且仅有 1 篇 critical 影响等级新闻');

  const climateItems = briefing.items.filter(i => i.category === 'climate');
  assert.ok(climateItems.length >= 1 && climateItems.length <= 2, `气候类别必须为 1~2 篇，实际: ${climateItems.length}`);

  const item0 = briefing.items[0];
  assert.ok(item0.id && item0.title && item0.summary && item0.source);
  assert.ok(['positive', 'neutral', 'negative'].includes(item0.sentiment));
  assert.ok(typeof item0.sentimentScore === 'number');
  assert.ok(Array.isArray(item0.nlpKeyEntities) && item0.nlpKeyEntities.length >= 1);

  // 验证 5 阶段状态汇报流
  assert.equal(stages.length, 5);
  const stageNames = stages.map(s => s.stage);
  assert.deepEqual(stageNames, ['AGENT_INIT', 'SEARCHING', 'DISTILLING', 'NLP_ANALYSIS', 'COMPLETED']);
  assert.deepEqual(stages.map(s => s.progress), [15, 40, 70, 90, 100]);
});
