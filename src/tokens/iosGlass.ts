import { ThemeTokens } from './types';

/**
 * 方案 C: 白色 iOS 流体透明玻璃 (Apple VisionOS / Liquid Glassmorphism) 设计令牌
 */
export const iosGlassTokens: ThemeTokens = {
  id: 'ios-glass',
  name: '方案 C: 白色 iOS 流体透明玻璃',
  description: '苹果 VisionOS 顶级美学：白色流体磨砂玻璃、10px 微圆角窗格、极光流体环境柔光与杂志级 Bento 编排',
  color: {
    bg: {
      base: '#f8fafc',
      surface: 'rgba(255, 255, 255, 0.75)',
      elevated: 'rgba(255, 255, 255, 0.88)',
      subtle: 'rgba(0, 0, 0, 0.02)',
      hover: 'rgba(255, 255, 255, 0.90)',
      active: 'rgba(255, 255, 255, 0.98)',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.70)',
      default: 'rgba(255, 255, 255, 0.85)',
      strong: 'rgba(255, 255, 255, 0.95)',
      glow: '0 0 16px rgba(255, 255, 255, 0.60)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      inverse: '#ffffff',
      accent: '#2563eb', // Apple System Blue
    },
    accent: {
      primary: '#2563eb',
      secondary: '#4f46e5',
      tertiary: '#06b6d4',
      glow: 'rgba(37, 99, 235, 0.35)',
    },
    status: {
      critical: '#f43f5e',
      high: '#d97706',
      medium: '#2563eb',
      positive: '#059669',
      neutral: '#64748b',
      negative: '#e11d48',
    },
  },
  geometry: {
    radius: {
      card: '10px',       // 用户专门指定的微圆角 (Micro-rounded corners)
      inner: '8px',       // 内部图片与缩略图同心微圆角
      pill: '9999px',     // 原生分段控制器药丸
      button: '9999px',   // iOS 经典胶囊主操作按键
      modal: '12px',      // 研报视窗外框微圆角
      modalPane: '8px',   // 研报视窗内部窗格微圆角
    },
    border: {
      width: '1px',
      style: 'solid',
    },
  },
  atmosphere: {
    shadow: {
      card: '0 10px 30px -10px rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.02), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
      cardHover: '0 20px 45px -12px rgba(37, 99, 235, 0.14), inset 0 1px 2px 0 #ffffff',
      button: '0 4px 14px rgba(37, 99, 235, 0.35)',
      modal: '0 40px 90px -20px rgba(0, 0, 0, 0.22), inset 0 1px 2px 0 #ffffff',
      glow: '0 0 24px rgba(255, 255, 255, 0.8)',
    },
    backdrop: {
      blur: '28px',
      saturate: '190%',
    },
  },
  typography: {
    fontFamily: {
      heading: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
      body: "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '-0.01em',
      wide: '0.02em',
    },
  },
  motion: {
    duration: {
      fast: '160ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.16, 1, 0.3, 1)',
      smooth: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
  },
  components: {
    header: {
      bg: 'rgba(255, 255, 255, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.85)',
      borderRadius: '10px', // 微圆角
      shadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
      badgeBg: 'rgba(37, 99, 235, 0.10)',
      badgeText: '#2563eb',
      telemetryDisplay: 'segmented-atmosphere',
    },
    categoryBar: {
      containerBg: 'rgba(255, 255, 255, 0.75)',
      containerBorder: '1px solid rgba(255, 255, 255, 0.85)',
      containerRadius: '10px', // 微圆角
      pillDefaultBg: 'transparent',
      pillDefaultText: '#64748b',
      pillActiveBg: '#ffffff',
      pillActiveText: '#0f172a',
      pillRadius: '9999px',
      pillShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    newsCard: {
      layoutVariant: 'editorial-bento', // 杂志级头条 Bento 编排
      containerBg: 'rgba(255, 255, 255, 0.72)',
      containerBorder: '1px solid rgba(255, 255, 255, 0.85)',
      containerRadius: '10px', // 微圆角
      containerShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.06), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
      containerHoverShadow: '0 20px 45px -12px rgba(37, 99, 235, 0.14), inset 0 1px 2px 0 #ffffff',
      mediaRadius: '8px',     // 内部缩略图微圆角
      mediaAspect: '16/10',
      excerptBg: 'rgba(0, 0, 0, 0.02)',
      excerptBorder: '1px solid rgba(255, 255, 255, 0.80)',
      excerptRadius: '8px',   // 摘要嵌槽微圆角
      badgeStyle: 'floating-pill',
      actionButton: {
        bg: '#2563eb',
        hoverBg: '#1d4ed8',
        text: '#ffffff',
        radius: '9999px',
        shadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
      },
    },
    dossierModal: {
      modalVariant: 'visionos-liquid-glass',
      backdropBg: 'rgba(15, 23, 42, 0.35)',
      backdropBlur: '32px',
      windowBg: 'rgba(255, 255, 255, 0.82)',
      windowBorder: '1px solid rgba(255, 255, 255, 0.95)',
      windowRadius: '12px',   // 弹窗外框微圆角
      windowShadow: '0 40px 90px -20px rgba(0, 0, 0, 0.22), inset 0 1px 2px 0 #ffffff',
      paneBg: 'rgba(255, 255, 255, 0.65)',
      paneBorder: '1px solid rgba(255, 255, 255, 0.85)',
      paneRadius: '8px',     // 内部 3 块窗格微圆角
      paneShadow: '0 4px 20px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
    },
  },
};
