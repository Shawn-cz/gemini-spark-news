# AI 领域采集扩容与大型 AI 公司新动态深潜契约设计规范

> **日期**：2026-10-27  
> **状态**：已获用户批准 (Approved)

---

## 1. 背景与目标 (Background & Goal)

原先系统每日采集固定 12 篇全球情报（`ai: 4`, `finance: 3`, `geopolitics: 3`, `climate: 2`），在 AI 产业高速迭代的背景下，4 篇配额难以充分覆盖全球与中国大型 AI 公司的新模型发布、Agent 产品演进、重大开源突破与天价商业并购。

本次升级旨在：
1. **扩充每日采集总容量至 16 篇**：其中 `ai` 领域跃升至 **8 篇（占总篇数 50%）**，其余三大领域保持不变（`finance: 3`、`geopolitics: 3`、`climate: 2`）。
2. **建立 AI 领域“2+2+2+2”四维子配额与头部 AI 公司雷达矩阵**：强制要求 Gemini Spark 智能体深度聚焦大型 AI 公司的新动态与新进展，杜绝泛泛而谈或题材同质化。
3. **契合 Bento 网格版面美学**：前端 Bento 视图每页容量为 8 篇，全量 16 篇恰好构成饱满的 2 页；切换至「AI 算力」分类视图时，8 篇 AI 情报恰好一屏满载展示。

---

## 2. 核心架构设计 (Architecture & Contract)

### 2.1 Gemini Spark 智能体 Prompt 契约 (`server/services/geminiSparkAgent.mjs`)
- **总篇数强硬契约**：严格输出满配 **16 篇**（不多不少）。
- **四大领域配额分布**：
  - `"ai"`（全球 AI 与大型科技巨头前沿动态）：**精确输出 8 篇**；
  - `"finance"`（全球金融与宏观资本）：**精确输出 3 篇**；
  - `"geopolitics"`（地缘政治与国际经贸）：**精确输出 3 篇**；
  - `"climate"`（气候变化与能源转型）：**精确输出 2 篇**。
- **AI 领域 8 篇“2+2+2+2”细分子配额与重点厂商雷达**：
  - **重点追踪厂商名单**：硅谷巨头（OpenAI、Google DeepMind、Anthropic、Meta AI、xAI、Microsoft、Apple、NVIDIA、AMD）与中国头部 AI 力量（DeepSeek、阿里通义 Qwen、字节跳动 Seed/豆包、月之暗面 Kimi、智谱 AI、百川智能、MiniMax）。
  - **四维核心进展子配额**：
    1. **新模型/多模态基座发布（2 篇）**：新一代前沿大模型、深度推理模型、原生多模态（语音/视频/图像/世界模型）正式发布、权重大幅更新或权威基准评测跃迁；
    2. **Agent 智能体产品演进（2 篇）**：Coding Agent（AI 编程）、Computer Use / OS 级自主智能体、多智能体协同工作流、旗舰级消费与企业 AI 应用重磅功能上线；
    3. **重大开源突破与架构创新（2 篇）**：开源社区（HuggingFace / GitHub）SOTA 权重开源、新型注意力机制/MoE 架构创新、强化学习后训练（RLVR/合成数据）算法突破及 AI4Science 里程碑；
    4. **商业化落地与天价融资并购/算力集群（2 篇）**：大型 AI 公司 ARR 营收突破、巨额融资/战略并购、核心实验室领军人物变动及十万卡级超算集群/自研 AI 芯片进展。

### 2.2 契约校准器 (`ensureBriefingContract`) 与保底语料库 (`server/corpus.mjs`)
- **`GLOBAL_CORPUS` 升级**：在原有 12 篇高保真语料基础上，新增 4 篇聚焦大型 AI 公司最新动态的深度研报（OpenAI/Anthropic 智能体产品演进、Google DeepMind/Meta 开源与架构创新、DeepSeek/Qwen 开源推理突破、xAI/头部独角兽天价融资与算力集群），使 `GLOBAL_CORPUS` 达到 **16 篇（含 8 篇 `ai`）**。
- **`ensureBriefingContract` 升级**：
  - 去重后补齐或截断目标篇数从 `12` 升级为 `16`；
  - 确保包含且仅包含 `1` 篇 `critical` 头条；
  - 确保 `climate` 领域为 `1~2` 篇，且当 `ai` 领域不足时自动校准保障 AI 权重。

### 2.3 测试与实时生产批次同步
- 更新单元测试 `tests/geminiSparkAgent.test.mjs` 与 E2E 验证脚本 `scripts/verify-spark-pipeline.mjs`，断言满配 `16` 篇及 `ai` 领域 `8` 篇配额。
- 唤醒真实 Gemini Spark 大模型，按新契约生成今日（`2026-10-27`）16 篇最新研报，双写持久化至 MongoDB Atlas 云数据库与本地 `data/briefings/2026-10-27.json`。
