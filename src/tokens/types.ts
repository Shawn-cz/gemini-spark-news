/**
 * Gemini Spark News · 设计令牌体系类型规范 (Design Token Schema)
 * 涵盖：基础系统令牌 (Global Design Tokens) 与组件语义令牌 (Component Semantic Tokens)
 * 适用于后续所有业务组件、网页迭代与多套设计系统无缝切换。
 */

export type ThemeId = 'cyber-hud' | 'pop-dopamine' | 'ios-glass';

export interface ColorTokens {
  bg: {
    base: string;
    surface: string;
    elevated: string;
    subtle: string;
    hover: string;
    active: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    glow?: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    accent: string;
  };
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
    glow?: string;
  };
  status: {
    critical: string;
    high: string;
    medium: string;
    positive: string;
    neutral: string;
    negative: string;
  };
}

export interface GeometryTokens {
  radius: {
    card: string;       // 卡片四角圆角 (微圆角: 10px / 实体圆角: 24px)
    inner: string;      // 内部嵌槽/缩略图圆角 (微圆角: 8px)
    pill: string;       // 药丸胶囊圆角 (9999px / 12px)
    button: string;     // 操作按键圆角
    modal: string;      // 研报弹窗外框圆角
    modalPane: string;  // 研报弹窗内部窗格圆角
  };
  border: {
    width: string;      // 边框粗细 (1px / 2px / 3px)
    style: string;      // solid
  };
}

export interface AtmosphereTokens {
  shadow: {
    card: string;
    cardHover: string;
    button: string;
    modal: string;
    glow?: string;
  };
  backdrop: {
    blur: string;       // 高斯模糊 (0px / 20px / 28px)
    saturate: string;   // 饱和度提升 (100% / 190%)
  };
}

export interface TypographyTokens {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface MotionTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    bounce?: string;
    smooth: string;
  };
}

export interface HeaderComponentTokens {
  bg: string;
  border: string;
  borderRadius: string;
  shadow: string;
  badgeBg: string;
  badgeText: string;
  telemetryDisplay: 'radar-spectrum' | 'stats-tags' | 'segmented-atmosphere';
}

export interface CategoryBarComponentTokens {
  containerBg: string;
  containerBorder: string;
  containerRadius: string;
  pillDefaultBg: string;
  pillDefaultText: string;
  pillActiveBg: string;
  pillActiveText: string;
  pillRadius: string;
  pillShadow: string;
}

export interface NewsCardComponentTokens {
  layoutVariant: 'tactical-hud' | 'pop-polaroid' | 'editorial-bento';
  containerBg: string;
  containerBorder: string;
  containerRadius: string;
  containerShadow: string;
  containerHoverShadow: string;
  mediaRadius: string;
  mediaAspect: string;
  excerptBg: string;
  excerptBorder: string;
  excerptRadius: string;
  badgeStyle: 'corner-bracket' | 'tilted-sticker' | 'floating-pill';
  actionButton: {
    bg: string;
    hoverBg: string;
    text: string;
    radius: string;
    shadow: string;
  };
}

export interface DossierModalComponentTokens {
  modalVariant: '3d-holographic' | 'pop-comic-sheet' | 'visionos-liquid-glass';
  backdropBg: string;
  backdropBlur: string;
  windowBg: string;
  windowBorder: string;
  windowRadius: string;
  windowShadow: string;
  paneBg: string;
  paneBorder: string;
  paneRadius: string;
  paneShadow: string;
}

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  description: string;
  color: ColorTokens;
  geometry: GeometryTokens;
  atmosphere: AtmosphereTokens;
  typography: TypographyTokens;
  motion: MotionTokens;
  components: {
    header: HeaderComponentTokens;
    categoryBar: CategoryBarComponentTokens;
    newsCard: NewsCardComponentTokens;
    dossierModal: DossierModalComponentTokens;
  };
}
