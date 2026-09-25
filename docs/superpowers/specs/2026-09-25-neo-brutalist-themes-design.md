# 全站新野兽派与波普高能双主题重构设计规范 (Neo-Brutalist & Pop Themes Spec)

- **创建日期**: 2026-09-25
- **方案代号**: Scheme C1 - Teenage Engineering Neo-Brutalist / Pop Art
- **作者**: Antigravity Pair Programmer
- **状态**: Approved (待实施)

---

## 1. 背景与重构目标 (Overview & Objectives)

本项目目前具备完整的三套色彩主题底座（暗夜、淡色、多巴胺），但现有淡色与多巴胺模式仅做了基础浅色调适配与发光微渐变，缺乏世界顶级前沿设计风格所具有的强烈视觉记忆点、层次辨识度与实体触感。

根据用户选定方案，本次重构将以 **新野兽派（Neo-Brutalism）与高能波普艺术（Pop Art）** 作为全站视觉革新方向：
1. **淡色主题重构为【经典档案羊皮纸（Classic Archival Parchment P2）】**：
   - 采用纯正深沉的暖黄羊皮纸色（`#f4ebd9`），融合工业机械线框（`2px solid #000`）与纯黑实体硬投影（`4px 4px 0 #000`）；
   - 彻底告别传统浅色界面的苍白与反光，构建具有历史档案质感、实体手账书卷气的高对比度认知看板。
2. **多巴胺主题重构为【高能波普艺术（High-Voltage Pop Dopamine）】**：
   - 采用纯黑几何骨架、电光热粉实体硬投影（`4px 4px 0 #ff007f`）与高饱和撞色贴纸（荧光黄 `#ffee00`、电青 `#00f0ff`、电紫 `#a855f7`）；
   - 赋予界面极高情绪张力与潮流科技感。
3. **严格隔离【深空黑曜石（Obsidian Dark）】**：
   - 保留原有深空玻璃拟态、冷青发光边框与动态粒子质感，绝不产生破坏或样式污染。

---

## 2. 色彩、材质与阴影系统 (Color & Surface System)

### 2.1 羊皮纸淡色主题 (Light: Archival Parchment P2)
- **画布背景 (Canvas Background)**: `#f4ebd9`（暖黄砂质档案纸色）。
- **底板微噪点/纹理 (Grid/Texture)**: 细微工程微网格 `radial-gradient(rgba(0,0,0,0.05) 1px, transparent 0)`，尺寸 `24px 24px`。
- **实体卡片底色 (Card Surface)**: 瓷白 `#ffffff` 或高纯暖白 `#fffdfa`。
- **结构轮廓 (Structural Borders)**: 全站统一 `2px solid #000000`（小组件 `1.5px solid #000`）。
- **实体硬投影 (Hard Offset Shadow)**:
  - 静止态：`box-shadow: 4px 4px 0px #000000;`（0px blur radius，纯色无羽化）
  - 悬停浮起态：`box-shadow: 7px 7px 0px #000000; transform: translate(-3px, -3px);`
  - 点击激活态：`box-shadow: 1.5px 1.5px 0px #000000; transform: translate(2px, 2px);`
- **墨水字色 (Ink Typography)**:
  - 主标题与关键指标：碳黑 `#000000`，字重加粗（`font-black` / `font-bold`）
  - 正文与摘要：深炭灰 `#1f2937`
  - 辅助文字与时间戳：档案灰 `#4b5563`
- **领域贴纸色系 (Sticker Accents)**:
  - AI 算力：天青蓝 `#38bdf8` 贴纸底，纯黑字
  - 宏观金融：草木绿 `#4ade80` 贴纸底，纯黑字
  - 地缘经贸：工装琥珀黄 `#fbbf24` 贴纸底，纯黑字
  - 气候能源：深电紫 `#818cf8` 贴纸底，纯黑字
  - 关键预警 (Critical)：警示绯红 `#fee2e2` 衬底，深红黑字 `#991b1b`，纯黑边框

### 2.2 高能波普多巴胺主题 (Dopamine: Pop Art)
- **画布背景 (Canvas Background)**: 蜜桃浅粉 `#fff0f5`。
- **实体卡片底色 (Card Surface)**: 纯白 `#ffffff`。
- **结构轮廓 (Structural Borders)**: 强刚性 `2.5px solid #000000`。
- **实体硬投影 (Hard Offset Shadow)**:
  - 静止态：`box-shadow: 4px 4px 0px #ff007f;`
  - 悬停浮起态：`box-shadow: 7px 7px 0px #ff007f; transform: translate(-3px, -3px) rotate(-0.5deg);`
  - 点击激活态：`box-shadow: 2px 2px 0px #ff007f; transform: translate(2px, 2px);`
- **波普高光色盘 (Pop Swatches)**:
  - 电光热粉：`#ff007f`
  - 荧光柠檬黄：`#ffee00`
  - 电光青蓝：`#00f0ff`
  - 酸性薄荷：`#00e676`
  - 霓虹紫：`#a855f7`
- **墨水字色**: 纯黑 `#000000`，辅以电光粉与高饱和色彩强调。

### 2.3 暗夜主题 (Dark: Obsidian)
- 完全保留：`#030712` 黑色底色，半透明 `rgba(13, 19, 34, 0.75)` 毛玻璃，冷青微发光边框，不加入任何黑框或硬阴影。

---

## 3. 核心组件结构重构规范 (Component Specifications)

### 3.1 顶部导视栏与 5 维仪表盘 (`IntelligenceHeader.tsx`)
- **Header 容器**:
  - 羊皮纸：背景 `#fffdf8` 或 `#f4ebd9`，底部 `2px solid #000`，下边投影 `0 3px 0 #000`。
  - 多巴胺：背景 `#ffffff`，底部 `2.5px solid #000`，投影 `0 4px 0 #ff007f`。
- **5-Metric 仪表盘栅格**:
  - 指标卡全面改造为“微型物理铭牌”（Micro Badges）：
    - 羊皮纸：白底、`1.5px solid #000` 黑色细框、`2px 2px 0 #000` 实体微硬影；
    - 多巴胺：白底、`2px solid #000` 黑框、分别交替带粉/黄/青/紫微硬影。
  - 内部文本由发灰低对比度改造为高对比度黑灰，脉冲指示灯（RUNNING / COMPLETED）以高饱和实心圆呈现。
- **控制按键 (DevTools, 批次同步, 模式切换)**:
  - 实体机械按键风格：纯黑实线框、`2px 2px 0 #000` 硬阴影，按下时位移 `translate(1px, 1px)`。

### 3.2 全站主题切换胶囊 (`ThemeSwitcher.tsx`)
- **外壳容器**:
  - 羊皮纸：瓷白底 `#ffffff`，`2px solid #000` 结构框，`3px 3px 0 #000` 硬阴影。
  - 多巴胺：瓷白底，`2px solid #000` 结构框，`3px 3px 0 #ff007f` 霓虹粉投影。
  - 暗夜：维持原有深色半透磨砂外壳。
- **文案定义**:
  1. `dark` -> **暗夜** (黑曜智库)
  2. `light` -> **淡色** (档案羊皮纸)
  3. `dopamine` -> **多巴胺** (高能波普)
- **激活态滑块**:
  - 羊皮纸下选中：纯黑底白字实体贴纸（`bg-black text-white`）或工装警示黄底黑字（`bg-amber-400 text-black`），具微实体阴影。
  - 多巴胺下选中：热粉底白字（`bg-[#ff007f] text-white`），硬黑边框。

### 3.3 全局分类与检索组件 (`GlobalCategoryBar.tsx`)
- **分类切换选项 (Tabs)**:
  - 羊皮纸模式：
    - 选中 Tab：纯黑实体贴纸（`bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000]`）；
    - 未选中 Tab：白底黑框（`bg-white text-black border-1.5 border-black shadow-[2px_2px_0px_#000]`）。
  - 多巴胺模式：选中 Tab 呈现为高饱和波普彩块（热粉、柠檬黄、电青交替）。
- **检索输入框 (Search Bar)**:
  - 羊皮纸：瓷白底，`2px solid #000` 黑框，`2px 2px 0 #000` 硬影，等宽打字机光标与占位符。
  - 多巴胺：获焦（Focus）时激活 `3px 3px 0 #ff007f` 实体粉影。
- **视图切换开关 (Bento / Matrix / Timeline)**:
  - 改造为机械档位开关（Mechanical Stepper Switch），硬黑边框与实体微下沉。

### 3.4 核心资讯卡片 (`GlobalNewsCard.tsx` 及视图流)
- **卡片基座**:
  - 羊皮纸：纯白底板，`2px solid #000`，圆角调整为工整刚性的 `10px`，硬投影 `4px 4px 0 #000`。
  - 多巴胺：纯白底板，`2.5px solid #000`，硬投影 `4px 4px 0 #ff007f`。
- **悬停位移动效**:
  - 羊皮纸：`hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_#000]`。
  - 多巴胺：`hover:translate-x-[-3px] hover:translate-y-[-3px] hover:rotate-[-0.5deg] hover:shadow-[7px_7px_0px_#ff007f]`。
- **媒体流展示区**:
  - 保持防漏色 `card-media-frame` 与 `contain: paint`，下层蒙层无缝覆盖。
- **领域与等级标签**:
  - 由毛玻璃胶囊升级为实体打孔贴纸（Sticker Badges）：`1.5px solid #000`，实体硬阴影 `1.5px 1.5px 0 #000`。
- **分隔线**:
  - 羊皮纸模式下采用工程虚线 `1.5px dashed #000`；
  - 多巴胺模式下采用黑实线 `2px solid #000`。

### 3.5 全球智库认知档案弹窗 (`IntelligenceDrawer.tsx`)
- **弹窗整体形态**:
  - 呈现为“实体机密调查卷宗”（Physical Confidential Dossier）。
  - 羊皮纸模式：底色为羊皮纸柔白 `#fffdfa`，外框为 `3px solid #000`，右下带巨大实体硬阴影 `10px 10px 0 #000`。
  - 多巴胺模式：外框 `3px solid #000`，热粉硬阴影 `10px 10px 0 #ff007f`。
- **卷宗内页**:
  - 顶部栏增加条形码与红色/黑色实体检验章（`AUDITED / ARCHIVED`）；
  - 左栏相框式工业装订边框；
  - 右栏核心认知与洞见模块采用黄色便利贴/便签纸质感衬底，标签为打孔贴纸风。

---

## 4. 技术实施架构与 CSS 方案 (Technical Architecture)

### 4.1 CSS 分层策略
所有针对羊皮纸与波普多巴胺的新野兽派样式，均集中管理于 `src/index.css`，严格限定在 `[data-theme="light"]` 与 `[data-theme="dopamine"]` 作用域下，确保暗夜主题不受任何影响：
```css
/* 羊皮纸全局规则 */
[data-theme="light"] body {
  background-color: #f4ebd9 !important;
  color: #0f172a !important;
}

[data-theme="light"] .glass-card {
  background: #ffffff !important;
  border: 2px solid #000000 !important;
  box-shadow: 4px 4px 0px #000000 !important;
  border-radius: 10px !important;
}

[data-theme="light"] .glass-card-hover:hover {
  transform: translate(-3px, -3px) !important;
  box-shadow: 7px 7px 0px #000000 !important;
}

/* 多巴胺全局规则 */
[data-theme="dopamine"] body {
  background-color: #fff0f5 !important;
  color: #000000 !important;
}

[data-theme="dopamine"] .glass-card {
  background: #ffffff !important;
  border: 2.5px solid #000000 !important;
  box-shadow: 4px 4px 0px #ff007f !important;
  border-radius: 10px !important;
}

[data-theme="dopamine"] .glass-card-hover:hover {
  transform: translate(-3px, -3px) rotate(-0.5deg) !important;
  box-shadow: 7px 7px 0px #ff007f !important;
}
```

### 4.2 组件微调
- 适当针对 `ThemeSwitcher.tsx`、`GlobalNewsCard.tsx`、`GlobalCategoryBar.tsx`、`IntelligenceDrawer.tsx` 中的贴纸标签类名做增强支持，使羊皮纸下的贴纸黑框和硬影原生生效。

---

## 5. 验收测试与验证标准 (Acceptance Criteria)

1. **色调与视觉还原度**:
   - 切换为“淡色”主题时，背景应呈现浓郁温润的 P2 经典羊皮纸底色（`#f4ebd9`），且无苍白反光；
   - 卡片在羊皮纸上清晰悬浮，具备清晰的纯黑 2px 边框与 4px 4px 实体硬黑影；
   - 切换为“多巴胺”主题时，呈现电光热粉硬投影与高饱和波普撞色。
2. **交互手感**:
   - 鼠标悬停卡片与按键时，呈现利落的向上微浮（Elevate）与硬阴影扩展；
   - 点击时呈现机械微按压（Active Press）；
   - 卡片悬停缩放时，底图接缝完全无漏色、无白边溢出。
3. **隔离性验证**:
   - 切换为“暗夜”主题时，原有黑曜石玻璃拟态、冷青发光完全保持原样，无任何黑框或硬阴影残留。
4. **编译与功能完整性**:
   - `npm run build` / TypeScript 类型检查 0 报错；
   - Bento、Matrix、Timeline 三种视图切换自如；
   - 研报弹窗正常呼出、展示与关闭。
