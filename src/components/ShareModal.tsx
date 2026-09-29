import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, MessageSquare, ExternalLink, Share2, Smartphone, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { GlobalNewsItem } from '../types/news';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: GlobalNewsItem | null;
  onShowToast?: (message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  news,
  onShowToast
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'all' | 'link' | null>(null);
  const [isWeChat, setIsWeChat] = useState<boolean>(false);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const inWeChat = /micromessenger/i.test(ua);
      const isMobile = /android|iphone|ipad|ipod/i.test(ua);
      setIsWeChat(inWeChat);
      // 仅在非微信且为移动端且支持 share API 时开启原生调用选项
      setCanNativeShare(!inWeChat && isMobile && !!navigator.share);
    }
  }, []);

  // 生成当前研报专属深度直达链接
  const targetDate = news ? (news.batchDate || (news.publishTime ? news.publishTime.slice(0, 10) : '2026-09-29')) : '';
  const shareUrl = news && typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?date=${encodeURIComponent(targetDate)}&newsId=${encodeURIComponent(news.id)}`
    : '';

  // 生成微信富文本分享卡片文案
  const generateShareText = (): string => {
    if (!news) return '';
    const source = `${news.source}${news.sourceCountry ? ` (${news.sourceCountry})` : ''}`;
    const cleanSummary = (news.summary || '')
      .replace(/^【.*?】\s*/, '')
      .slice(0, 150) + ((news.summary && news.summary.length > 150) ? '...' : '');

    return `【Gemini Spark 智库研报】${news.title}

📅 归档日期：${targetDate}
🌐 权威信源：${source}
💡 深度提炼：${cleanSummary}

🔗 研报免翻专属直达：
${shareUrl}`;
  };

  // 生成二维码
  useEffect(() => {
    if (isOpen && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR Code:', err));
    }
  }, [isOpen, shareUrl]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !news) return null;

  // 剪贴板安全写入
  const copyToClipboard = async (text: string, type: 'all' | 'link', toastMsg: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
      if (onShowToast) {
        onShowToast(toastMsg);
      }
    } catch {
      if (onShowToast) {
        onShowToast('复制失败，请手动选中文本进行复制');
      }
    }
  };

  // 可选的原生分享
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `【智库研报】${news.title}`,
        text: `${news.title} —— Gemini Spark 24H 深度智库简报`,
        url: shareUrl
      });
      if (onShowToast) {
        onShowToast('✅ 已调用系统分享');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // 出错时自动降级复制
        await copyToClipboard(shareUrl, 'link', '🔗 已为您复制研报直达链接！');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗主体容器 */}
      <div 
        className="share-modal-window relative w-full max-w-xl bg-obsidian-950 border-2 border-black sm:border-3 rounded-2xl shadow-[6px_6px_0px_0px_#000] overflow-hidden z-10 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="share-modal-header p-4 sm:p-5 border-b-2 border-black flex items-center justify-between bg-obsidian-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2">
                分享智库研报
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  WECHAT READY
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                支持手机微信扫码直达、朋友圈转发与图文摘要复制
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/10"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 微信内置浏览器专属指引横幅 */}
        {isWeChat && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 p-3 sm:px-5 flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
            <MessageSquare className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>💡 提示：您正在微信内浏览，点击右上角「···」菜单，即可直接发送给好友或分享到朋友圈！</span>
          </div>
        )}

        {/* 核心内容区 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* 上部：双通道分享选项 (微信扫码 + 一键图文复制) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* 左侧：微信扫码直达卡片 */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-obsidian-900/60 border border-white/10 text-center">
              <div className="p-2.5 bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] inline-block">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="微信扫码直达二维码" 
                    className="w-36 h-36 sm:w-40 sm:h-40 block mx-auto"
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-xs text-slate-400 font-mono">
                    生成二维码中...
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>微信「扫一扫」直达</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                手机微信扫码秒开<br />
                支持右上角一键转发朋友圈
              </p>
            </div>

            {/* 右侧：预格式化微信研报文案预览 */}
            <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-xl bg-obsidian-900/60 border border-white/10">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    微信聊天文案预览
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    AUTO FORMATTED
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                  {generateShareText()}
                </div>
              </div>

              {/* 快捷操作按键组 */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generateShareText(), 'all', '✅ 微信图文文案已复制！可直接在微信聊天框中粘贴发送')}
                  className="flex-1 py-2 px-3 rounded-lg border-2 border-black bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedType === 'all' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
                      <span>已复制文案！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制微信图文文案</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(shareUrl, 'link', '🔗 专属研报直达链接已复制到剪贴板！')}
                  className="py-2 px-3 rounded-lg border border-black bg-white hover:bg-neutral-100 text-black font-mono text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                  title="仅复制 URL 链接"
                >
                  {copiedType === 'link' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已复制！</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>仅复制链接</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* 底部：移动端原生系统分享安全调用 (仅在支持且非微信时渲染) */}
          {canNativeShare && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                手机原生环境支持直接唤起系统分享
              </span>
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-1.5 px-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>调用系统分享面板</span>
              </button>
            </div>
          )}

          {/* 优势特征提示 */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-cyan-300/80 flex items-center justify-between">
            <span>🛡️ 境内免翻直连 · Gemini 24H 深度提炼 · 权威信源交叉验证</span>
            <span className="text-cyan-400 font-bold">100% AVAILABLE</span>
          </div>

        </div>

      </div>
    </div>
  );
};
