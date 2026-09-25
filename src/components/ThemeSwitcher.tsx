import React from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, ThemeType } from '../context/ThemeContext';

interface ThemeOption {
  key: ThemeType;
  label: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  activeClass: string;
  dotColor: string;
}

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

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

  return (
    <div 
      className="inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-black/30 dark:bg-black/40 backdrop-blur-md border border-white/10 shadow-inner theme-capsule-container"
      role="radiogroup"
      aria-label="全站色彩主题切换胶囊"
    >
      {themes.map((t) => {
        const isSelected = theme === t.key;
        const Icon = t.icon;

        const inactiveClass =
          theme === 'light'
            ? 'text-slate-800 hover:text-black hover:bg-black/5 border border-transparent'
            : theme === 'dopamine'
            ? 'text-slate-900 hover:text-black hover:bg-black/5 border border-transparent'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent';

        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(t.key)}
            title={`切换为【${t.label}】(${t.sub})`}
            className={`relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-300 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              isSelected
                ? t.activeClass
                : inactiveClass
            }`}
          >
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected && t.key === 'dopamine' ? 'animate-bounce-gentle' : ''}`} />
            <span className="font-sans text-[11px] sm:text-xs font-medium tracking-tight">
              {t.label}
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
