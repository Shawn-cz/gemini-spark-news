/**
 * Gemini Spark News · 设计令牌统一导出与注册中心 (Design Tokens Registry)
 */

export * from './types';
export { cyberHudTokens } from './cyberHud';
export { popDopamineTokens } from './popDopamine';
export { iosGlassTokens } from './iosGlass';

import { ThemeId, ThemeTokens } from './types';
import { cyberHudTokens } from './cyberHud';
import { popDopamineTokens } from './popDopamine';
import { iosGlassTokens } from './iosGlass';

export const THEME_TOKENS_REGISTRY: Record<ThemeId, ThemeTokens> = {
  'cyber-hud': cyberHudTokens,
  'pop-dopamine': popDopamineTokens,
  'ios-glass': iosGlassTokens,
};

/**
 * 根据主题标识获取对应的全套设计令牌
 */
export function getThemeTokens(themeId: ThemeId = 'cyber-hud'): ThemeTokens {
  return THEME_TOKENS_REGISTRY[themeId] || cyberHudTokens;
}

/**
 * 获取所有支持的设计令牌列表
 */
export function getAllThemeTokens(): ThemeTokens[] {
  return Object.values(THEME_TOKENS_REGISTRY);
}
