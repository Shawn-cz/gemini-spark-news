import React, { useRef, useEffect, useCallback } from 'react';
import { NobelQuote } from '../types/news';
import { useTheme } from '../context/ThemeContext';

export interface NobelQuoteBannerProps {
  activeQuote: NobelQuote;
  onShuffleQuote?: () => void;
  className?: string;
}

/**
 * 诺贝尔文学奖名言灵感胶囊
 * 
 * 特性：
 * 1. 严格锁定 Header 度量衡 h-[42px]；
 * 2. 页面进入/切换名言时，超长文字自动进行一次平滑跑马灯预览（首端静读 -> 匀速向右展示全貌 -> 尾端停顿 -> 顺滑回弹至起始位）；
 * 3. 一次预览结束后停止自动滚动，支持用户在手机端通过手指触控拖拽（Touch Drag）或桌面鼠标抓取左右自如滑动查看整句与作者；
 * 4. 用户一旦发生任何主动触控或拖拽，立即中止自动动画，将控制权完全移交用户。
 */
export const NobelQuoteBanner: React.FC<NobelQuoteBannerProps> = ({
  activeQuote,
  onShuffleQuote,
  className = ''
}) => {
  const { theme } = useTheme();
  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  const containerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const timerIdsRef = useRef<NodeJS.Timeout[]>([]);

  // 桌面鼠标拖拽状态
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);

  // 清除所有在途定时器与 RAF 帧
  const cancelAllAnimations = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    timerIdsRef.current.forEach(id => clearTimeout(id));
    timerIdsRef.current = [];
  }, []);

  // 用户主动交互时立即打断自动动画
  const handleUserInteractionStart = useCallback(() => {
    isUserInteractingRef.current = true;
    cancelAllAnimations();
  }, [cancelAllAnimations]);

  // 进入页面 / 切换名言时执行“仅滚动一次”动效
  useEffect(() => {
    cancelAllAnimations();
    isUserInteractingRef.current = false;

    const el = containerRef.current;
    if (!el) return;

    // 复位到最左侧
    el.scrollLeft = 0;

    // 检查是否有减弱动效偏好 (prefers-reduced-motion)
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    // 等待 DOM 渲染与字体排版稳定 (400ms)
    const initTimer = setTimeout(() => {
      if (!containerRef.current || isUserInteractingRef.current || prefersReducedMotion) return;

      const container = containerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;

      // 若未溢出，无需滚动
      if (maxScroll <= 4) return;

      // 阶段 1：首端停留 1100ms 供用户阅读句子开头
      const startPauseTimer = setTimeout(() => {
        if (!containerRef.current || isUserInteractingRef.current) return;

        const forwardDuration = Math.min(5200, Math.max(2400, maxScroll * 26)); // 平滑适读速度
        const startTime = performance.now();
        const startScroll = container.scrollLeft;

        // 阶段 2：向右匀速平滑滚动到底
        const stepForward = (now: number) => {
          if (!containerRef.current || isUserInteractingRef.current) return;

          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / forwardDuration);
          // 匀速线性推进，方便视线阅读文字
          container.scrollLeft = startScroll + maxScroll * progress;

          if (progress < 1) {
            rafIdRef.current = requestAnimationFrame(stepForward);
          } else {
            // 滚动到底，阶段 3：尾端停留 1300ms 供阅读作者出处
            const endPauseTimer = setTimeout(() => {
              if (!containerRef.current || isUserInteractingRef.current) return;

              const returnDuration = 1100; // 回弹稍微利落
              const returnStartTime = performance.now();
              const returnStartScroll = container.scrollLeft;

              // 阶段 4：平滑回弹至初始位
              const stepReturn = (returnNow: number) => {
                if (!containerRef.current || isUserInteractingRef.current) return;

                const returnElapsed = returnNow - returnStartTime;
                const returnProgress = Math.min(1, returnElapsed / returnDuration);
                // 使用 ease-in-out 回弹
                const ease = returnProgress < 0.5 
                  ? 2 * returnProgress * returnProgress 
                  : -1 + (4 - 2 * returnProgress) * returnProgress;

                container.scrollLeft = returnStartScroll * (1 - ease);

                if (returnProgress < 1) {
                  rafIdRef.current = requestAnimationFrame(stepReturn);
                } else {
                  container.scrollLeft = 0;
                  // 阶段 5：一次滚动彻底完成，停止一切自动运动
                }
              };

              rafIdRef.current = requestAnimationFrame(stepReturn);
            }, 1300);

            timerIdsRef.current.push(endPauseTimer);
          }
        };

        rafIdRef.current = requestAnimationFrame(stepForward);
      }, 1100);

      timerIdsRef.current.push(startPauseTimer);
    }, 400);

    timerIdsRef.current.push(initTimer);

    return () => {
      cancelAllAnimations();
    };
  }, [activeQuote.zh, cancelAllAnimations]);

  // 鼠标拖拽支持 (Desktop Drag-to-Scroll)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleUserInteractionStart();
    const el = containerRef.current;
    if (!el) return;

    isMouseDownRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    e.preventDefault();
    const el = containerRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  return (
    <div 
      className={`h-[42px] flex-1 min-w-0 rounded-xl px-2.5 sm:px-3.5 flex items-center gap-2 sm:gap-2.5 overflow-hidden transition-all ${
        isPopDopamine
          ? 'border-2 border-slate-900 bg-yellow-50/90 shadow-[2px_2px_0px_#000] text-slate-900'
          : isCyberHud
          ? 'border border-cyan-500/40 bg-cyan-950/30 text-cyan-100 shadow-[inset_0_0_12px_rgba(0,240,255,0.1)]'
          : 'border border-slate-200/80 bg-white/80 text-slate-800 shadow-sm'
      } ${className}`}
      title={`${activeQuote.year} · ${activeQuote.author}《${activeQuote.work}》: ${activeQuote.zh}`}
    >
      {/* 1. 诺奖专属徽章 (固定在左侧，不随内容滚动) */}
      <div className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full select-none ${
        isPopDopamine
          ? 'bg-pink-500 text-white border border-slate-900 shadow-[1px_1px_0px_#000]'
          : isCyberHud
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono'
          : 'bg-blue-600 text-white font-semibold'
      }`}>
        <span className="text-xs">🕊️</span>
        <span className="hidden xs:inline">{activeQuote.year}</span>
        <span className="xs:hidden font-mono">诺奖</span>
      </div>

      {/* 2. 可左右拖动/滑动的名言与出处容器 (支持初次平滑跑马灯 + 手指拖拽滚动) */}
      <div
        ref={containerRef}
        onTouchStart={handleUserInteractionStart}
        onWheel={handleUserInteractionStart}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing touch-pan-x py-1 pr-2.5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* 箴言正文 (不截断，供滚动展示) */}
        <span 
          className={`font-serif font-bold whitespace-nowrap tracking-wide leading-none flex-shrink-0 ${
            activeQuote.zh.length > 38 ? 'text-[11.5px]' : activeQuote.zh.length > 25 ? 'text-xs' : 'text-xs sm:text-[13px]'
          } ${
            isPopDopamine ? 'text-slate-900' : isCyberHud ? 'text-cyan-100' : 'text-slate-900'
          }`}
        >
          {activeQuote.zh}
        </span>

        <span className={`flex-shrink-0 text-[11px] font-bold whitespace-nowrap leading-none ${
          isPopDopamine ? 'text-slate-700' : isCyberHud ? 'text-cyan-400/80 font-mono' : 'text-slate-600'
        }`}>
          <span className="hidden sm:inline">—— {activeQuote.author}《{activeQuote.work}》</span>
          <span className="sm:hidden">—— {activeQuote.author.split('·').pop() || activeQuote.author}</span>
        </span>

        {/* 尾端留白缓冲占位，确保最右端作者文字绝不被骰子按键遮挡 */}
        <span className="w-5 sm:w-6 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* 3. 换一句微交互按键 (固定在右侧，不随内容滚动) */}
      {onShuffleQuote && (
        <button
          type="button"
          onClick={onShuffleQuote}
          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs transition-transform active:rotate-45 cursor-pointer ml-auto select-none ${
            isPopDopamine
              ? 'bg-black/5 hover:bg-black/10 text-slate-800'
              : isCyberHud
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="点击换一句诺奖名言"
          aria-label="换一句诺贝尔文学奖名言"
        >
          🎲
        </button>
      )}
    </div>
  );
};
