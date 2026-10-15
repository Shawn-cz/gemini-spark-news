import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  FastForward, 
  Sparkles, 
  Headphones,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface AudioBriefingData {
  date: string;
  title: string;
  estimatedDurationSeconds: number;
  intro: string;
  sections: {
    newsId: string;
    category: string;
    headline: string;
    source: string;
    scriptText: string;
  }[];
  outro: string;
  sentences: string[];
  fullScript: string;
  nobelQuote: {
    author: string;
    work: string;
    zh: string;
  };
}

interface AudioBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

/**
 * 播放硬件声音校验蜂鸣（Web Audio API 双音阶，100% 浏览器原生硬件输出测试）
 */
function playHardwareChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch {}
}

export const AudioBriefingModal: React.FC<AudioBriefingModalProps> = ({ isOpen, onClose, date }) => {
  const [data, setData] = useState<AudioBriefingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [rate, setRate] = useState<number>(1.25);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('系统默认语音');
  const { theme } = useTheme();

  const isIosGlass = theme === 'ios-glass' || theme === 'light';
  const isPopDopamine = theme === 'pop-dopamine' || theme === 'dopamine';
  const isCyberHud = theme === 'cyber-hud' || theme === 'dark' || (!isIosGlass && !isPopDopamine);

  const sentencesRef = useRef<string[]>([]);
  const currentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const rateRef = useRef<number>(rate);
  const teleprompterRef = useRef<HTMLDivElement | null>(null);
  const activeSentenceRef = useRef<HTMLParagraphElement | null>(null);
  // 核心防御：持有全局 Utterance 强引用，彻底杜绝 V8 GC 导致静默中断 Bug
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步 refs
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // 环境特性嗅探与可用中文语音包发现
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
      return;
    }

    const scanVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => 
        v.lang.toLowerCase().includes('zh') || 
        v.lang.toLowerCase().includes('cmn') ||
        v.name.includes('Chinese') ||
        v.name.includes('Huihui') ||
        v.name.includes('Xiaoxiao')
      );
      if (zhVoice) {
        setActiveVoiceName(zhVoice.name.replace(/\(.*?\)/g, '').trim());
      } else if (voices.length > 0) {
        setActiveVoiceName(voices[0].name.replace(/\(.*?\)/g, '').trim());
      }
    };

    scanVoices();
    window.speechSynthesis.onvoiceschanged = scanVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 清理语音合成
  const stopSpeech = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsPlaying(false);
  }, []);

  // 卸载或关闭弹窗时强制清理语音队列
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // 队列接力朗读核心驱动
  const speakSentence = useCallback((index: number) => {
    const list = sentencesRef.current;
    if (!hasSpeechSupport || index >= list.length || index < 0) {
      stopSpeech();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // 更新索引与状态
    setCurrentIdx(index);
    setIsPlaying(true);

    const sentence = list[index];
    const utterance = new SpeechSynthesisUtterance(sentence);
    activeUtteranceRef.current = utterance; // 强引用避开 V8 GC

    utterance.rate = rateRef.current;
    utterance.pitch = 1.0;
    utterance.lang = 'zh-CN';

    // 智能尝试选择中文语音包
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => 
      v.lang.toLowerCase().includes('zh') || 
      v.lang.toLowerCase().includes('cmn') ||
      v.name.includes('Chinese') ||
      v.name.includes('Huihui') ||
      v.name.includes('Xiaoxiao')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      // 提词器自动平滑居中滚动
      if (activeSentenceRef.current) {
        activeSentenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    utterance.onend = () => {
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < list.length) {
          // 接力下一句，小延迟 60ms 确保 Chrome 音频 IPC 管道连贯
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakSentence(nextIdx);
            }
          }, 60);
        } else {
          stopSpeech();
          setCurrentIdx(0);
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[WebSpeech] Utterance error:', e.error);
        stopSpeech();
      }
    };

    // 确保唤醒 Chrome 休眠的语音引擎
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();
  }, [hasSpeechSupport, stopSpeech]);

  // 拉取早茶文稿
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      return;
    }

    let active = true;
    setIsLoading(true);
    fetch(`/api/briefing/${date}/audio`)
      .then(res => res.json())
      .then(body => {
        if (active && body.code === 200 && body.data) {
          setData(body.data);
          sentencesRef.current = body.data.sentences || [];
          setCurrentIdx(0);
        }
      })
      .catch((err) => {
        console.warn('[AudioBriefing] 获取文稿失败:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      stopSpeech();
    };
  }, [isOpen, date, stopSpeech]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      playHardwareChime();
      setIsPlaying(true);
      speakSentence(currentIdx);
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    rateRef.current = newRate;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakSentence(currentIdx), 80);
    }
  };

  const handlePrevSentence = () => {
    const target = Math.max(0, currentIdx - 1);
    setCurrentIdx(target);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakSentence(target), 80);
    }
  };

  const handleNextSentence = () => {
    const maxIdx = (data?.sentences?.length || 1) - 1;
    const target = Math.min(maxIdx, currentIdx + 1);
    setCurrentIdx(target);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakSentence(target), 80);
    }
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  if (!isOpen) return null;

  const sentences = data?.sentences || [];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className={`w-full max-w-xl p-6 sm:p-7 rounded-2xl relative my-auto shadow-2xl transition-all border ${
          isPopDopamine
            ? 'bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#111827] text-slate-900'
            : isIosGlass
            ? 'bg-white/95 border border-white shadow-2xl backdrop-blur-xl text-slate-900'
            : 'bg-slate-950 border border-cyan-500/50 shadow-[0_0_35px_rgba(0,240,255,0.25)] text-slate-100 font-mono'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题与关闭按钮 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isPopDopamine
                ? 'bg-yellow-300 border-2 border-slate-900 text-slate-900'
                : isIosGlass
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-cyan-950 text-cyan-400 border border-cyan-500/50'
            }`}>
              <Headphones className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-mono flex items-center gap-2">
                <span>{data?.title || 'Gemini Spark 每日智库早茶'}</span>
                {isPlaying && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    LIVE 播音中
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-sans flex items-center gap-2">
                <span>3分钟宏观前沿串联 · 诺奖哲思结语</span>
                <span className="text-[10px] opacity-75">🎙️ {activeVoiceName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isPopDopamine
                ? 'bg-slate-100 border border-slate-900 hover:bg-slate-200'
                : isIosGlass
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-cyan-950 text-cyan-400 border border-cyan-500/30'
            }`}
            title="关闭早茶"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 音频律动波形动画条 (12-bar CSS Equalizer) */}
        <div className="h-10 flex items-center justify-center gap-1.5 mb-4 px-4 py-2 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl relative overflow-hidden">
          {[18, 32, 24, 40, 16, 36, 28, 44, 20, 30, 22, 38].map((baseH, barIdx) => (
            <span
              key={barIdx}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPopDopamine
                  ? 'bg-pink-500'
                  : isIosGlass
                  ? 'bg-blue-600'
                  : 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]'
              }`}
              style={{
                height: isPlaying ? `${Math.max(8, (baseH * (0.6 + Math.random() * 0.7)))}px` : '6px',
                opacity: isPlaying ? 1 : 0.35
              }}
            />
          ))}
          {!isPlaying && !isLoading && (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 bg-black/10 dark:bg-black/30 backdrop-blur-xs font-mono">
              ⏸ 点击下方按钮即可恢复语音播报
            </span>
          )}
        </div>

        {/* 提词器字幕滚动视窗 */}
        <div 
          ref={teleprompterRef}
          className={`h-56 overflow-y-auto p-4 rounded-xl space-y-3 mb-5 border scroll-smooth text-xs leading-relaxed ${
            isPopDopamine
              ? 'bg-amber-50/70 border-slate-300 font-["Plus_Jakarta_Sans"]'
              : isIosGlass
              ? 'bg-slate-50 border-slate-200/80 font-sans'
              : 'bg-black/60 border-cyan-500/20 font-mono text-slate-300'
          }`}
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              <span>正在合成早茶播报文稿与声波引擎...</span>
            </div>
          ) : (
            sentences.map((sent, sIdx) => {
              const isCurrent = sIdx === currentIdx;
              return (
                <p
                  key={sIdx}
                  ref={isCurrent ? activeSentenceRef : null}
                  onClick={() => {
                    playHardwareChime();
                    setCurrentIdx(sIdx);
                    speakSentence(sIdx);
                  }}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                    isCurrent
                      ? isPopDopamine
                        ? 'bg-yellow-200 font-bold border-l-4 border-slate-900 text-slate-950 scale-[1.01]'
                        : isIosGlass
                        ? 'bg-blue-50 text-blue-900 font-semibold border-l-4 border-blue-600 shadow-xs'
                        : 'bg-cyan-950/80 text-cyan-200 font-bold border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'opacity-65 hover:opacity-100 hover:bg-slate-500/10'
                  }`}
                >
                  <span className="text-[10px] font-mono mr-2 opacity-50">[{sIdx + 1}/{sentences.length}]</span>
                  {sent}
                </p>
              );
            })
          )}
        </div>

        {/* 底部播控工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* 进度与扬声器测试 */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>句段: {sentences.length > 0 ? `${currentIdx + 1}/${sentences.length}` : '0/0'}</span>
            <button
              type="button"
              onClick={playHardwareChime}
              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-500/30 hover:border-cyan-400 hover:text-cyan-400 transition"
              title="测试设备喇叭发声"
            >
              🔔 测喇叭
            </button>
          </div>

          {/* 核心播放/切句按键 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSentence}
              className={`p-2 rounded-lg transition cursor-pointer ${
                isPopDopamine ? 'bg-slate-100 hover:bg-slate-200 border border-slate-900' : 'bg-slate-800/60 hover:bg-slate-800'
              }`}
              title="上一句"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isPopDopamine
                  ? 'bg-yellow-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#000] hover:bg-yellow-400'
                  : isIosGlass
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? '暂停播报' : '立即播报早茶'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextSentence}
              className={`p-2 rounded-lg transition cursor-pointer ${
                isPopDopamine ? 'bg-slate-100 hover:bg-slate-200 border border-slate-900' : 'bg-slate-800/60 hover:bg-slate-800'
              }`}
              title="下一句"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* 倍速控制胶囊 */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {[1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleRateChange(speed)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  rate === speed
                    ? isPopDopamine
                      ? 'bg-slate-900 text-white font-bold'
                      : isIosGlass
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
