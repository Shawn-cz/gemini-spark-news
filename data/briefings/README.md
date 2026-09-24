# Gemini Spark 简报数据目录 (data/briefings)

本目录用于存放由 **Gemini Spark 智能体**（定时任务/Prompt 管道）每天生成的结构化新闻简报 JSON 文件。

## 文件命名规范
每天一个 JSON 文件，文件名为对应日期（格式为 `YYYY-MM-DD.json`），例如：
- `2026-09-24.json`
- `2026-09-25.json`

## 数据格式说明

支持两种格式（推荐格式 1）：

### 格式 1: 带批次状态元数据的完整格式（推荐）
```json
{
  "batchStatus": {
    "status": "COMPLETED",
    "statusText": "已完成归档",
    "generatedTime": "2026-09-24 02:30:00 UTC",
    "nextScheduleTime": "明日 02:30:00 UTC",
    "currentStage": "Gemini 1.5 智能体多源交叉校验完成"
  },
  "items": [
    {
      "id": "gemini-2026-09-24-001",
      "title": "中文核心标题（必填，UI 自动适配两行省略截断）",
      "englishTitle": "English Title (可选，外媒原文标题)",
      "source": "Reuters",
      "sourceCountry": "US",
      "category": "ai",
      "region": "North America",
      "impactLevel": "critical",
      "summary": "Gemini 提炼的 150-200 字深度研报摘要...",
      "tags": ["OpenAI", "Anthropic", "自主智能体"],
      "sentiment": "positive",
      "sentimentScore": 0.78,
      "nlpKeyEntities": ["OpenAI", "Anthropic", "Autonomous Agents"],
      "coverUrl": "https://images.unsplash.com/...",
      "publishTime": "2026-09-24T08:30:00Z"
    }
  ]
}
```

### 格式 2: 纯新闻列表数组格式
直接是一个 JSON 数组 `[ { ...item1 }, { ...item2 } ]`。

### 字段枚举定义
- **category** (领域分类):
  - `"ai"`: 前沿算力与通用智能
  - `"finance"`: 宏观资本与全球金融
  - `"geopolitics"`: 地缘博弈与国际贸易
  - `"climate"`: 极端气候与能源转型
- **impactLevel** (宏观影响等级):
  - `"critical"`: 极重大（将在 Bento 视图中作为 Hero 大卡展示）
  - `"high"`: 高度关注
  - `"medium"`: 常规动态
- **sentiment** (情感极性):
  - `"positive"` (积极), `"neutral"` (中性), `"negative"` (避险/负面)
- **sentimentScore**:
  - 数值范围 `-1.0` 到 `+1.0`（例如 `0.85` 或 `-0.42`）

## 自动化拉取特性
当本目录存入新的 `YYYY-MM-DD.json` 时：
1. 后端接口将自动识别该日期并纳入日期选择器。
2. 前端 30 秒静默轮询机制将自动检测并同步最新简报，无需手动刷新。
