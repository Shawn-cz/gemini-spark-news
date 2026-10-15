import { ThemeTokens } from './types';

/**
 * 方案 B: 波普潮玩多巴胺 (Pop Dopamine Art) 设计令牌
 */
export const popDopamineTokens: ThemeTokens = {
  id: 'pop-dopamine',
  name: '方案 B: 波普潮玩多巴胺',
  description: '高饱和对比度的波普艺术、3px 纯黑硬边框、拍立得装裱与超解压 Q 弹果冻物理动画',
  color: {
    bg: {
      base: '#090d16',
      surface: '#ffffff',
      elevated: '#fef08a',
      subtle: 'rgba(255, 255, 255, 0.08)',
      hover: '#fce7f3',
      active: '#fbcfe8',
    },
    border: {
      subtle: '#334155',
      default: '#0f172a',
      strong: '#000000',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff',
      accent: '#ec4899',
    },
    accent: {
      primary: '#ec4899', // 多巴胺粉
      secondary: '#eab308', // 柠檬黄
      tertiary: '#8b5cf6', // 电光紫
    },
    status: {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      positive: '#10b981',
      neutral: '#6366f1',
      negative: '#f43f5e',
    },
  },
  geometry: {
    radius: {
      card: '24px',
      inner: '16px',
      pill: '14px',
      button: '14px',
      modal: '28px',
      modalPane: '16px',
    },
    border: {
      width: '1px',
      style: 'solid',
    },
  },
  atmosphere: {
    shadow: {
      card: '0 0 0 2px #0f172a, 6px 6px 0px 0px #0f172a',
      cardHover: '0 0 0 2px #0f172a, 10px 10px 0px 0px #0f172a',
      button: '3px 3px 0px 0px #0f172a',
      modal: '12px 12px 0px 0px #0f172a',
    },
    backdrop: {
      blur: '0px',
      saturate: '100%',
    },
  },
  typography: {
    fontFamily: {
      heading: "'Fredoka', cursive, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'Fredoka', monospace",
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.04em',
    },
  },
  motion: {
    duration: {
      fast: '120ms',
      normal: '220ms',
      slow: '450ms',
    },
    easing: {
      default: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring Bounce 果冻回弹
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  components: {
    header: {
      bg: '#ffffff',
      border: '3px solid #0f172a',
      borderRadius: '20px',
      shadow: '6px 6px 0px 0px #0f172a',
      badgeBg: '#ec4899',
      badgeText: '#ffffff',
      telemetryDisplay: 'stats-tags',
    },
    categoryBar: {
      containerBg: '#ffffff',
      containerBorder: '3px solid #0f172a',
      containerRadius: '20px',
      pillDefaultBg: '#f1f5f9',
      pillDefaultText: '#0f172a',
      pillActiveBg: '#ec4899',
      pillActiveText: '#ffffff',
      pillRadius: '14px',
      pillShadow: '2px 2px 0px 0px #0f172a',
    },
    newsCard: {
      layoutVariant: 'pop-polaroid',
      containerBg: '#ffffff',
      containerBorder: '3px solid #0f172a',
      containerRadius: '24px',
      containerShadow: '6px 6px 0px 0px #0f172a',
      containerHoverShadow: '10px 10px 0px 0px #0f172a',
      mediaRadius: '16px',
      mediaAspect: '16/10',
      excerptBg: 'rgba(254, 243, 199, 0.60)',
      excerptBorder: '1px solid rgba(251, 191, 36, 0.80)',
      excerptRadius: '12px',
      badgeStyle: 'tilted-sticker',
      actionButton: {
        bg: '#facc15',
        hoverBg: '#fde047',
        text: '#0f172a',
        radius: '12px',
        shadow: '2px 2px 0px 0px #0f172a',
      },
    },
    dossierModal: {
      modalVariant: 'pop-comic-sheet',
      backdropBg: 'rgba(15, 23, 42, 0.70)',
      backdropBlur: '12px',
      windowBg: '#ffffff',
      windowBorder: '4px solid #0f172a',
      windowRadius: '28px',
      windowShadow: '12px 12px 0px 0px #0f172a',
      paneBg: '#fffbeb',
      paneBorder: '2px solid #0f172a',
      paneRadius: '16px',
      paneShadow: '4px 4px 0px 0px #0f172a',
    },
  },
};
