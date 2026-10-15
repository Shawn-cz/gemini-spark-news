import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface PulseTrendPoint {
  date: string;
  total: number;
  avgSentimentScore: number;
  sentimentIndex: number; // 0~100
  distribution: { positive: number; neutral: number; negative: number };
  categoryCounts: { ai: number; finance: number; geopolitics: number; climate: number };
}

export interface MacroPulseData {
  days: number;
  trends: PulseTrendPoint[];
  summary: {
    latestIndex: number;
    deltaFromPrevious: number;
    overallMood: string;
  };
}

interface MacroPulseSparklineProps {
  className?: string;
}

export const MacroPulseSparkline: React.FC<MacroPulseSparklineProps> = ({ className = '' }) => {
  const [pulseData, setPulseData] = useState<MacroPulseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<PulseTrendPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const { theme } = useTheme();

  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  useEffect(() => {
    let active = true;
    fetch('/api/stats/pulse?days=7')
      .then(res => res.json())
      .then(body => {
        if (active && body.code === 200 && body.data) {
          setPulseData(body.data);
        }
      })
      .catch(() => {
        // 优雅静默容错
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const trends = pulseData?.trends || [];

  // 计算 SVG 坐标点 (宽度 130，高度 30，留 4px padding)
  const svgWidth = 130;
  const svgHeight = 28;
  const paddingX = 6;
  const paddingY = 4;

  const points = useMemo(() => {
    if (trends.length < 2) return [];
    const minVal = 0;
    const maxVal = 100;

    const innerW = svgWidth - paddingX * 2;
    const innerH = svgHeight - paddingY * 2;

    return trends.map((t, idx) => {
      const x = paddingX + (idx / (trends.length - 1)) * innerW;
      const normalizedY = (t.sentimentIndex - minVal) / (maxVal - minVal || 1);
      const y = svgHeight - paddingY - normalizedY * innerH;
      return { x, y, data: t };
    });
  }, [trends]);

  // 生成折线 SVG path 与闭合渐变区域 path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${svgHeight} L ${first.x} ${svgHeight} Z`;
  }, [linePath, points]);

  if (isLoading && !pulseData) {
    return (
      <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-[11px] animate-pulse ${
        isPopDopamine 
          ? 'bg-white border-slate-900 shadow-[2px_2px_0px_#000]' 
          : isIosGlass 
          ? 'bg-white/80 border-slate-200' 
          : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400'
      } ${className}`}>
        <Activity className="w-3.5 h-3.5 animate-spin" />
        <span>脉搏测算中...</span>
      </div>
    );
  }

  if (!pulseData || trends.length === 0) return null;

  const { latestIndex, deltaFromPrevious, overallMood } = pulseData.summary;
  const isUp = deltaFromPrevious >= 0;

  // 主题配色变量
  const strokeColor = isPopDopamine ? '#0f172a' : isIosGlass ? '#2563eb' : '#00f0ff';
  const gradientId = `pulse-grad-${theme}`;

  return (
    <div className={`hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-xl transition-all relative select-none group border ${
      isPopDopamine
        ? 'bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#111827] text-slate-900'
        : isIosGlass
        ? 'bg-white/80 border border-slate-200/90 shadow-xs text-slate-800'
        : 'bg-cyan-950/30 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] text-cyan-300'
    } ${className}`}>
      
      {/* 头部微指标 */}
      <div className="flex flex-col text-[10px] font-mono leading-tight flex-shrink-0">
        <div className="flex items-center gap-1">
          <Activity className={`w-3 h-3 ${isPopDopamine ? 'text-pink-600' : isIosGlass ? 'text-blue-600' : 'text-cyan-400'} animate-pulse`} />
          <span className="font-bold tracking-tight">宏观心电图</span>
          <span className="font-extrabold text-[12px] ml-0.5">{latestIndex}</span>
        </div>

        <div className="flex items-center gap-1 text-[9px]">
          <span className={`font-semibold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {isUp ? `+${deltaFromPrevious}` : deltaFromPrevious}
          </span>
          <span className="text-slate-400 font-sans">({overallMood})</span>
        </div>
      </div>

      {/* 原生 SVG 矢量折线与渐变填充 */}
      <div className="relative flex-shrink-0 cursor-crosshair">
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          className="overflow-visible"
          onMouseLeave={() => { setHoveredPoint(null); setHoverPos(null); }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isPopDopamine ? "0.2" : "0.35"} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 填充面积 */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* 核心折线 */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth={isPopDopamine ? "2.5" : "1.8"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* 数据关键点交互圆圈 */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx === points.length - 1 ? 3.5 : 2}
              fill={idx === points.length - 1 ? (isPopDopamine ? '#ec4899' : strokeColor) : '#ffffff'}
              stroke={strokeColor}
              strokeWidth={1.5}
              className="transition-transform hover:scale-150 cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredPoint(pt.data);
                const rect = e.currentTarget.getBoundingClientRect();
                setHoverPos({ x: pt.x, y: pt.y });
              }}
            />
          ))}
        </svg>

        {/* 交互 Tooltip 浮窗 */}
        {hoveredPoint && hoverPos && (
          <div 
            className={`absolute z-50 pointer-events-none p-2 rounded-lg text-[10px] font-mono whitespace-nowrap shadow-xl transition-opacity border -top-16 left-1/2 -translate-x-1/2 ${
              isPopDopamine
                ? 'bg-slate-900 text-white border-slate-700'
                : isIosGlass
                ? 'bg-white/95 text-slate-800 border-slate-200 shadow-md'
                : 'bg-black/90 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            }`}
          >
            <div className="font-bold flex items-center justify-between gap-2 border-b pb-1 mb-1 border-white/10">
              <span>📅 {hoveredPoint.date}</span>
              <span className="text-emerald-400 font-bold">指数: {hoveredPoint.sentimentIndex}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-slate-300">
              <span>AI:{hoveredPoint.categoryCounts.ai}</span>
              <span>金融:{hoveredPoint.categoryCounts.finance}</span>
              <span>地缘:{hoveredPoint.categoryCounts.geopolitics}</span>
              <span>看多:{hoveredPoint.distribution.positive}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
