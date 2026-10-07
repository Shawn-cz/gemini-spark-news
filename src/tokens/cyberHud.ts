import { ThemeTokens } from './types';

/**
 * 方案 A: 赛博战术极客 HUD (Cyber Tactical HUD) 设计令牌
 */
export const cyberHudTokens: ThemeTokens = {
  id: 'cyber-hud',
  name: '方案 A: 赛博战术 HUD',
  description: '清爽高效的深色硬核战术界面，配备雷达脉冲微组件与 3D 原生全息投影研报',
  color: {
    bg: {
      base: '#060913',
      surface: 'rgba(9, 14, 26, 0.88)',
      elevated: '#0b1329',
      subtle: 'rgba(0, 240, 255, 0.05)',
      hover: 'rgba(0, 240, 255, 0.12)',
      active: 'rgba(0, 240, 255, 0.25)',
    },
    border: {
      subtle: 'rgba(0, 240, 255, 0.25)',
      default: 'rgba(0, 240, 255, 0.45)',
      strong: '#00f0ff',
      glow: '0 0 20px rgba(0, 240, 255, 0.35)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      inverse: '#020617',
      accent: '#00f0ff',
    },
    accent: {
      primary: '#00f0ff',
      secondary: '#ffb300',
      tertiary: '#ff3366',
      glow: 'rgba(0, 240, 255, 0.65)',
    },
    status: {
      critical: '#ff3366',
      high: '#ffb300',
      medium: '#00f0ff',
      positive: '#10b981',
      neutral: '#38bdf8',
      negative: '#f43f5e',
    },
  },
  geometry: {
    radius: {
      card: '16px',
      inner: '8px',
      pill: '6px',
      button: '8px',
      modal: '0px', // 3D 全息发射台斜切底座
      modalPane: '8px',
    },
    border: {
      width: '1px',
      style: 'solid',
    },
  },
  atmosphere: {
    shadow: {
      card: '0 0 20px -5px rgba(0, 240, 255, 0.25)',
      cardHover: '0 0 35px -5px rgba(0, 240, 255, 0.55)',
      button: '0 0 15px rgba(0, 240, 255, 0.6)',
      modal: '0 0 50px rgba(0, 240, 255, 0.4)',
      glow: '0 0 25px rgba(0, 240, 255, 0.5)',
    },
    backdrop: {
      blur: '16px',
      saturate: '120%',
    },
  },
  typography: {
    fontFamily: {
      heading: "'Chakra Petch', monospace, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'Chakra Petch', monospace",
    },
    letterSpacing: {
      tight: '-0.01em',
      normal: '0.02em',
      wide: '0.08em',
    },
  },
  motion: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '600ms',
    },
    easing: {
      default: 'cubic-bezier(0.16, 1, 0.3, 1)',
      smooth: 'ease-in-out',
    },
  },
  components: {
    header: {
      bg: 'rgba(15, 23, 42, 0.90)',
      border: '1px solid rgba(0, 240, 255, 0.5)',
      borderRadius: '12px',
      shadow: '0 0 20px -5px rgba(0, 240, 255, 0.35)',
      badgeBg: 'rgba(0, 240, 255, 0.15)',
      badgeText: '#00f0ff',
      telemetryDisplay: 'radar-spectrum',
    },
    categoryBar: {
      containerBg: 'rgba(15, 23, 42, 0.80)',
      containerBorder: '1px solid rgba(0, 240, 255, 0.35)',
      containerRadius: '12px',
      pillDefaultBg: '#020617',
      pillDefaultText: '#00f0ff',
      pillActiveBg: '#00f0ff',
      pillActiveText: '#020617',
      pillRadius: '6px',
      pillShadow: '0 0 12px rgba(0, 240, 255, 0.8)',
    },
    newsCard: {
      layoutVariant: 'tactical-hud',
      containerBg: 'rgba(9, 14, 26, 0.88)',
      containerBorder: '1px solid rgba(0, 240, 255, 0.40)',
      containerRadius: '16px',
      containerShadow: '0 0 20px rgba(0, 240, 255, 0.12)',
      containerHoverShadow: '0 0 30px rgba(0, 240, 255, 0.40)',
      mediaRadius: '10px',
      mediaAspect: '16/9',
      excerptBg: 'transparent',
      excerptBorder: 'none',
      excerptRadius: '0px',
      badgeStyle: 'corner-bracket',
      actionButton: {
        bg: 'linear-gradient(to right, #00f0ff, #38bdf8)',
        hoverBg: 'linear-gradient(to right, #38bdf8, #7dd3fc)',
        text: '#020617',
        radius: '8px',
        shadow: '0 0 15px rgba(0, 240, 255, 0.6)',
      },
    },
    dossierModal: {
      modalVariant: '3d-holographic',
      backdropBg: 'rgba(6, 9, 19, 0.95)',
      backdropBlur: '24px',
      windowBg: 'transparent',
      windowBorder: 'none',
      windowRadius: '0px',
      windowShadow: 'none',
      paneBg: 'rgba(15, 23, 42, 0.85)',
      paneBorder: '1px solid rgba(0, 240, 255, 0.65)',
      paneRadius: '8px',
      paneShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
    },
  },
};
