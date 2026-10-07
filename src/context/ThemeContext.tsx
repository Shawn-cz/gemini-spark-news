import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'cyber-hud' | 'pop-dopamine' | 'ios-glass' | 'dark' | 'light' | 'dopamine';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
});

const THEME_STORAGE_KEY = 'gemini_spark_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType;
      if (['cyber-hud', 'pop-dopamine', 'ios-glass', 'dark', 'light', 'dopamine'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore storage access errors
    }
    return 'dark';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // 映射到 DOM 样式系统的激活标识:
    // pop-dopamine -> dopamine (匹配保留的方案 B 波普潮玩整套 Neo-Brutalist 样式)
    // cyber-hud -> dark (匹配方案 A 赛博战术暗黑 HUD 样式)
    // light -> ios-glass (新轻量白玻璃样式)
    const effectiveThemeAttr = 
      theme === 'pop-dopamine' ? 'dopamine' :
      theme === 'cyber-hud' ? 'dark' :
      theme === 'light' ? 'ios-glass' :
      theme;

    document.documentElement.setAttribute('data-theme', effectiveThemeAttr);
    document.body.setAttribute('data-theme', effectiveThemeAttr);
    document.documentElement.setAttribute('data-token-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
