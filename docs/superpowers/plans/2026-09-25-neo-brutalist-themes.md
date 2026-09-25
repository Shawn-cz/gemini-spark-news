# 全站新野兽派与波普双主题重构实施计划 (Neo-Brutalist & Pop Themes Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于世界前沿的新野兽派（Neo-Brutalism）与高能波普（Pop Art）设计语言，重构全站淡色主题为【P2 经典档案羊皮纸（`#f4ebd9`）】以及多巴胺主题为【高能波普艺术（`#ff007f` 实体硬阴影）】，并保持暗夜黑曜石主题的绝对安全隔离。

**Architecture:** 采用 CSS 作用域驱动架构，所有野兽派几何硬边框、0 模糊实体硬投影和触感按压位移均集中挂载于 `[data-theme="light"]` 与 `[data-theme="dopamine"]` 选择器下；配合 React 组件级贴纸印章（Sticker Badges）、机械虚线与等宽打字机排版，实现纯正物理工业触感。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Vite.

---

### Task 1: 全局主题核心 CSS 变量与野兽派硬阴影系统升级

**Files:**
- Modify: `src/index.css:70-499`
- Test: `npm run build`

- [ ] **Step 1: 在 `src/index.css` 中重构 `[data-theme="light"]` 羊皮纸体系**
在 `[data-theme="light"]` 下设置：
- body 背景色为 `#f4ebd9`，微网格为 `radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)`
- 文本主体颜色为 `#0f172a` 与 `#1e293b`
- `.glass-card` 重塑为 `background: #ffffff !important; border: 2px solid #000000 !important; box-shadow: 4px 4px 0px #000000 !important; border-radius: 10px !important;`
- `.glass-card-hover:hover` 重塑为 `transform: translate(-3px, -3px) !important; box-shadow: 7px 7px 0px #000000 !important;`
- `.glass-card-hover:active` 重塑为 `transform: translate(2px, 2px) !important; box-shadow: 2px 2px 0px #000000 !important;`
- 输入框、下拉框、分隔线采用 `2px solid #000000` 工业黑线

- [ ] **Step 2: 在 `src/index.css` 中重构 `[data-theme="dopamine"]` 波普多巴胺体系**
在 `[data-theme="dopamine"]` 下设置：
- body 背景色为 `#fff0f5`
- `.glass-card` 重塑为 `background: #ffffff !important; border: 2.5px solid #000000 !important; box-shadow: 4px 4px 0px #ff007f !important; border-radius: 10px !important;`
- `.glass-card-hover:hover` 重塑为 `transform: translate(-3px, -3px) rotate(-0.5deg) !important; box-shadow: 7px 7px 0px #ff007f !important;`
- `.glass-card-hover:active` 重塑为 `transform: translate(2px, 2px) !important; box-shadow: 2px 2px 0px #ff007f !important;`

- [ ] **Step 3: 运行构建测试验证 CSS 语法无破坏**
Run: `npm run build`
Expected: 成功构建，无语法错误。

- [ ] **Step 4: 提交 Task 1 基础样式修改**
```bash
git add src/index.css
git commit -m "style: implement neo-brutalist parchment and dopamine pop css foundation"
```

---

### Task 2: 全站主题切换胶囊重构 (`src/components/ThemeSwitcher.tsx`)

**Files:**
- Modify: `src/components/ThemeSwitcher.tsx`
- Modify: `src/index.css` (胶囊主题样式选择器)
- Test: `npm run build`

- [ ] **Step 1: 更新 ThemeOption 定义与标签文案**
在 `src/components/ThemeSwitcher.tsx` 中更新：
```tsx
const themes: ThemeOption[] = [
  {
    key: 'dark',
    label: '暗夜',
    sub: '黑曜智库',
    icon: Moon,
    activeClass: 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 shadow-glow-blue',
    dotColor: 'bg-cyan-400',
  },
  {
    key: 'light',
    label: '淡色',
    sub: '档案羊皮纸',
    icon: Sun,
    activeClass: 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-bold',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'dopamine',
    label: '多巴胺',
    sub: '高能波普',
    icon: Sparkles,
    activeClass: 'bg-[#ff007f] text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-bold',
    dotColor: 'bg-yellow-300',
  },
];
```

- [ ] **Step 2: 在 `src/index.css` 中注入胶囊外壳在羊皮纸与波普下的实体样式**
- `[data-theme="light"] .theme-capsule-container`: `background: #ffffff !important; border: 2px solid #000000 !important; box-shadow: 3px 3px 0px #000000 !important;`
- `[data-theme="dopamine"] .theme-capsule-container`: `background: #ffffff !important; border: 2px solid #000000 !important; box-shadow: 3px 3px 0px #ff007f !important;`

- [ ] **Step 3: 运行构建测试验证**
Run: `npm run build`
Expected: 编译通过。

- [ ] **Step 4: 提交 Task 2 修改**
```bash
git add src/components/ThemeSwitcher.tsx src/index.css
git commit -m "feat(theme): refactor ThemeSwitcher with neo-brutalist tactile aesthetics"
```

---

### Task 3: 顶部导视栏与 5 维微型机械仪表盘升级 (`src/components/IntelligenceHeader.tsx`)

**Files:**
- Modify: `src/components/IntelligenceHeader.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

- [x] **Step 1: 升级 Header 容器与标题边框**
在 `src/index.css` 中为 `[data-theme="light"] header` 添加：
- `background-color: #fbf6ec !important;`
- `border-bottom: 2px solid #000000 !important;`
- `box-shadow: 0 4px 0px #000000 !important;`
- `[data-theme="dopamine"] header` 添加 `border-bottom: 2.5px solid #000000 !important; box-shadow: 0 4px 0px #ff007f !important;`

- [x] **Step 2: 升级 5-Metric 宏观仪表盘卡片样式**
在 `src/index.css` 中为 Header 第二行的指标卡添加样式类映射：
- 羊皮纸模式下，指标卡具有：纯白底板、`1.5px solid #000` 黑色细边框、`2px 2px 0 #000` 实体硬投影、黑色高对比度字体；
- 多巴胺模式下，指标卡具有：纯白底板、`2px solid #000` 黑边框、波普粉/黄/青微硬投影。

- [x] **Step 3: 升级同步按钮与操作按钮实体质感**
- 羊皮纸模式下同步按钮为纯白或黑金配色，`2px solid #000`，`3px 3px 0 #000` 投影，按下时 `translate(1px, 1px)`；
- 多巴胺模式下为高能热粉/柠檬黄色块按钮。

- [x] **Step 4: 运行构建测试验证**
Run: `npm run build`
Expected: 编译通过。

- [x] **Step 5: 提交 Task 3 修改**
```bash
git add src/components/IntelligenceHeader.tsx src/index.css
git commit -m "feat(header): upgrade IntelligenceHeader and 5-metric dashboard to neo-brutalist style"
```

---

### Task 4: 全局分类 Tab 与等宽检索栏重构 (`src/components/GlobalCategoryBar.tsx`)

**Files:**
- Modify: `src/components/GlobalCategoryBar.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

- [x] **Step 1: 重构分类 Tab 切换按钮为实体贴纸形式**
在 `GlobalCategoryBar.tsx` 中为分类选项注入野兽派贴纸状态：
- 羊皮纸选中态：纯黑底白字 `border-2 border-black shadow-[2px_2px_0px_#000]`，未选中态：白底黑字 `border-1.5 border-black shadow-[2px_2px_0px_#000]`
- 多巴胺选中态：高能波普色（电光粉、柠檬黄、电青交替贴纸），未选中态白底黑框

- [x] **Step 2: 重构检索输入框为等宽打字机风格**
- 羊皮纸模式下：输入框具备 `2px solid #000000` 黑框，`2px 2px 0 #000` 实体硬投影，占位符为高清晰等宽文字
- 多巴胺模式下：获焦时触发 `3px 3px 0 #ff007f` 实体硬阴影

- [x] **Step 3: 重构视图切换开关 (Bento / Matrix / Timeline)**
- 按钮采用机械档位开关风格，带清晰实体黑线框与硬投影

- [x] **Step 4: 运行构建测试验证**
Run: `npm run build`
Expected: 编译通过。

- [x] **Step 5: 提交 Task 4 修改**
```bash
git add src/components/GlobalCategoryBar.tsx src/index.css
git commit -m "feat(category-bar): implement brutalist sticker tabs and typewriter search input"
```

---

### Task 5: 核心情报卡片实体化与贴纸印章重构 (`src/components/GlobalNewsCard.tsx`)

**Files:**
- Modify: `src/components/GlobalNewsCard.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

- [ ] **Step 1: 升级卡片本体及内外边框**
- 羊皮纸模式下：卡片为瓷白实体底，外框 `2px solid #000`，圆角工整收紧为 `10px`，硬投影 `4px 4px 0 #000`
- 多巴胺模式下：外框 `2.5px solid #000`，硬投影 `4px 4px 0 #ff007f`
- 悬停浮起时触感位移与阴影同步放大

- [ ] **Step 2: 升级领域与影响等级徽章为打孔实体贴纸 (Sticker Badges)**
- 羊皮纸模式下：徽章不再使用半透明模糊，而是带有 `1.5px solid #000` 黑色轮廓与 `1.5px 1.5px 0 #000` 微硬投影（AI 天蓝、金融草绿、地缘琥珀黄、预警绯红）
- 多巴胺模式下：采用波普高饱和色块（粉、黄、青、绿）搭配黑框

- [ ] **Step 3: 添加机械工程虚线分隔符**
- 卡片下部元数据区分隔线在羊皮纸模式下呈现为 `1.5px dashed #000` 机械虚线

- [ ] **Step 4: 强化标题与正文对比度**
- 确保标题为纯黑高字重，正文为深炭灰，在羊皮纸与白卡片衬托下清晰易读

- [ ] **Step 5: 运行构建测试验证**
Run: `npm run build`
Expected: 编译通过。

- [x] **Step 6: 提交 Task 5 修改**
```bash
git add src/components/GlobalNewsCard.tsx src/index.css
git commit -m "feat(cards): implement tactile neo-brutalist news card with sticker badges"
```

---

### Task 6: 全球智库机密调查卷宗弹窗升级 (`src/components/IntelligenceDrawer.tsx`)

**Files:**
- Modify: `src/components/IntelligenceDrawer.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

- [x] **Step 1: 弹窗外壳重塑为物理调查卷宗 (Physical Dossier)**
- 羊皮纸模式下：弹窗底色为暖柔白 `#fffdfa`，外框强化为 `3px solid #000000`，右下带巨大实体硬阴影 `10px 10px 0 #000000`
- 多巴胺模式下：外框 `3px solid #000000`，右下带 `10px 10px 0 #ff007f` 实体粉影

- [x] **Step 2: 顶部栏与状态印章升级**
- 顶部栏增加实体工业钢印与档案编码展示风格
- 收藏与分享按钮采用机械小按键质感（黑框加硬阴影）

- [x] **Step 3: 双栏内容区排版适配**
- 左栏视觉媒体采用工业相框封边
- 右栏核心认知与洞见模块采用便利贴/备忘录纸感衬底，实体标签采用打孔贴纸样式

- [x] **Step 4: 运行构建测试验证**
Run: `npm run build`
Expected: 编译通过。

- [x] **Step 5: 提交 Task 6 修改**
```bash
git add src/components/IntelligenceDrawer.tsx src/index.css
git commit -m "feat(drawer): transform intelligence drawer into physical archival dossier"
```

---

### Task 7: 端到端全站视觉回归与多视图验证 (E2E Verification)

**Files:**
- Verify: `src/index.css`
- Verify: `src/components/*`
- Verify: `src/components/views/*`
- Test: `npm run build`

- [x] **Step 1: 运行全量 TypeScript 与生产环境打包**
Run: `npm run build`
Expected: 0 warnings/errors, build succeeds cleanly.

- [x] **Step 2: 验证暗夜黑曜石主题隔离**
切换至暗夜主题：确认玻璃拟态、冷青发光完全正常，绝无黑色硬边框或非预期实体阴影残留。

- [x] **Step 3: 验证淡色（P2 经典档案羊皮纸）全量表现**
切换至淡色主题：确认背景呈现温润深邃的暖黄羊皮纸色（`#f4ebd9`），所有卡片、仪表盘、分类栏均呈现清晰纯黑实体边框与 0 模糊硬阴影，悬停浮起手感利落。

- [x] **Step 4: 验证多巴胺（高能波普艺术）全量表现**
切换至多巴胺主题：确认电光热粉硬投影、波普撞色贴纸与微旋转悬停动效表现正常。

- [x] **Step 5: 验证三种视图 (Bento, Matrix, Timeline) 兼容性**
分别切换 Bento 瀑布流、Matrix 多列矩阵流与 Timeline 时间轴，确认各视图下卡片样式在三套主题下均完美呈现。

- [x] **Step 6: 提交最终全量验收记录**
```bash
git add -A
git commit -m "chore: complete neo-brutalist themes verification and visual regression"
```

