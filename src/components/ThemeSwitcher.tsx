import React from 'react';
import { Terminal, Sparkles, Layers } from 'lucide-react';
import { useTheme, ThemeType } from '../context/ThemeContext';

interface ThemeOption {
  key: ThemeType;
  alias?: ThemeType[];
  label: string;
  shortLabel: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  activeClass: string;
  dotColor: string;
}

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: ThemeOption[] = [
    {
      key: 'cyber-hud',
      alias: ['dark'],
      label: '方案A·HUD',
      shortLabel: 'A·HUD',
      sub: '赛博战术全息',
      icon: Terminal,
      activeClass: 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.4)]',
      dotColor: 'bg-cyan-400',
    },
    {
      key: 'pop-dopamine',
      alias: ['dopamine'],
      label: '方案B·波普',
      shortLabel: 'B·波普',
      sub: '高能波普潮玩',
      icon: Sparkles,
      activeClass: 'bg-[#ff007f] text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-bold',
      dotColor: 'bg-yellow-300',
    },
    {
      key: 'ios-glass',
      alias: ['light'],
      label: '方案C·iOS',
      shortLabel: 'C·iOS',
      sub: '白色流体微圆角',
      icon: Layers,
      activeClass: 'bg-white text-blue-600 border border-slate-200/80 shadow-[0_4px_14px_rgba(37,99,235,0.25)] font-semibold',
      dotColor: 'bg-blue-600',
    },
  ];

  return (
    <div 
      className={`inline-flex items-center p-0.5 sm:p-1 rounded-xl backdrop-blur-md border shadow-inner theme-capsule-container transition-all flex-shrink-0 ${
        theme === 'ios-glass' || theme === 'light'
          ? 'bg-white/80 border-slate-200/80'
          : theme === 'pop-dopamine' || theme === 'dopamine'
          ? 'bg-white border-2 border-black shadow-[2px_2px_0px_#000000]'
          : 'bg-black/40 border-white/10'
      }`}
      role="radiogroup"
      aria-label="全站三大方案设计风格切换胶囊"
    >
      {themes.map((t) => {
        const isSelected = theme === t.key || t.alias?.includes(theme);
        const Icon = t.icon;

        const inactiveClass =
          theme === 'ios-glass' || theme === 'light'
            ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-transparent'
            : theme === 'pop-dopamine' || theme === 'dopamine'
            ? 'text-slate-800 hover:text-black hover:bg-slate-100 border border-transparent'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent';

        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(t.key)}
            title={`切换为【${t.label}】(${t.sub})`}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-300 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              isSelected
                ? t.activeClass
                : inactiveClass
            }`}
          >
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected && (t.key === 'pop-dopamine' || theme === 'dopamine') ? 'animate-bounce-gentle' : ''}`} />
            <span className="font-sans text-[11px] sm:text-xs font-medium tracking-tight">
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </span>
            {isSelected && (
              <span className={`w-1.5 h-1.5 rounded-full ${t.dotColor} animate-pulse hidden sm:inline-block`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

