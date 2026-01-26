
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Share2, Check, Loader2, Edit3 } from 'lucide-react';
import { MERIT_TEMPLATE } from '../constants';
import html2canvas from 'html2canvas';

interface Props {
  onClose: () => void;
  todayCount: number;
  currentChant: string;
  customMeritText: string;
}

const DedicationModal: React.FC<Props> = ({ onClose, todayCount, currentChant, customMeritText }) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 初始化編輯內容：合併公版迴向文與個人設定的願望
  const [editableText, setEditableText] = useState(() => {
    let text = MERIT_TEMPLATE;
    if (customMeritText) {
      text += `\n\n${customMeritText}`;
    }
    return text;
  });

  // 日期格式改為 YYYY.MM.DD
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}`;

  // 複製的文字內容改為使用當前編輯框內的文字
  const fullTextToCopy = [
    `【今日修持圓滿】`,
    `日期：${dateStr}`,
    `法門：${currentChant}`,
    `數量：${todayCount.toLocaleString()} 遍`,
    `\n【迴向】\n${editableText}`
  ].join('\n').trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTextToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // 確保 DOM 更新完成
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = cardRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // 降低縮放比例以提高成功率，2x 對手機來說清晰度已足夠
        backgroundColor: '#FAF7F2',
        useCORS: true,
        logging: false,
        width: 375, // 強制設定寬度
        height: element.offsetHeight, // 強制設定高度
        windowWidth: 375,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        const file = new File([blob], `merit-${dateStr}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '靜心念佛 - 修持圓滿',
            });
          } catch (error) {
            console.log('Share canceled or failed', error);
          }
        } else {
          const link = document.createElement('a');
          link.download = `靜心念佛-迴向卡-${dateStr}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          alert('已為您下載精美迴向卡！');
        }
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      console.error('Generation failed', error);
      alert('圖片生成失敗，請稍後再試');
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2c2c2c]/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#FAF7F2] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">

        {/* 關閉按鈕 */}
        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-white/50 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* 內容預覽區 */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <div className="text-center space-y-2 mb-4">
            <h2 className="calligraphy-font text-3xl font-bold text-[#A8584C]">功德圓滿</h2>
            <p className="text-xs text-gray-400 font-bold tracking-[0.3em] uppercase pl-[0.3em]">{dateStr}</p>
          </div>

          <div className="bg-[#F2E6E4]/40 p-6 rounded-[2rem] border border-[#F2E6E4] text-center space-y-2">
            <p className="serif-font text-xl font-bold text-[#4E342E]">{currentChant}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black text-[#A8584C]">{todayCount.toLocaleString()}</span>
              <span className="text-sm font-bold text-[#A8584C]/80 mt-4">遍</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center opacity-50">
              <div className="h-[1px] w-8 bg-[#A8584C]"></div>
              <span className="text-[10px] font-bold text-[#A8584C] tracking-widest pl-[0.1em]">迴向文</span>
              <div className="h-[1px] w-8 bg-[#A8584C]"></div>
            </div>

            {/* 可編輯區域 */}
            <div className="relative group">
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full min-h-[12rem] bg-transparent text-center serif-font text-[#5D4037] text-base leading-loose italic resize-none outline-none p-4 rounded-xl focus:bg-white/40 focus:shadow-inner transition-all border border-transparent focus:border-[#A8584C]/20 placeholder-gray-300"
                placeholder="請輸入迴向內容..."
              />
              <div className="absolute top-2 right-2 text-[#A8584C] opacity-20 group-hover:opacity-100 pointer-events-none transition-opacity">
                <Edit3 size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/60 border-t border-[#e7e5e4] flex gap-3 z-20 backdrop-blur-sm">
          <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all">
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            <span>複製文字</span>
          </button>
          <button
            onClick={handleShareImage}
            disabled={isGenerating}
            className="flex-[1.5] flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#A8584C] text-white font-bold text-sm hover:bg-[#8D4439] active:scale-95 transition-all shadow-lg shadow-[#A8584C]/20"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            <span>{isGenerating ? '製作中...' : '分享精美圖卡'}</span>
          </button>
        </div>

        {/* --- 隱藏的截圖區域 (Off-screen rendering) --- */}
        {/* 改為使用 absolute 和負座標隱藏，比 opacity:0 更穩定，確保 html2canvas 能抓取 */}
        <div className="absolute top-0 left-[-9999px] pointer-events-none">
          <div
            ref={cardRef}
            style={{
              width: '375px',
              height: '667px',
              backgroundColor: '#FAF7F2',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '12px solid #F2E6E4',
              boxSizing: 'border-box'
            }}
          >
            {/* 裝飾框線 */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              border: '1px solid #A8584C',
              opacity: 0.2,
              borderRadius: '2rem',
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: '1px solid #A8584C',
              opacity: 0.1,
              borderRadius: '1.8rem',
              pointerEvents: 'none'
            }}></div>

            {/* 內容容器 - 用負 margin 往上調整 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              marginTop: '-30px'
            }}>
              {/* 頂部：日期與標題 */}
              <div style={{
                width: '100%',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <p style={{
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '0.5em',
                color: '#A8584C',
                textTransform: 'uppercase',
                paddingLeft: '0.5em',
                margin: '0 0 16px 0'
              }}>{dateStr}</p>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#4E342E',
                letterSpacing: '0.1em',
                paddingLeft: '0.1em',
                margin: '0 0 16px 0',
                fontFamily: '"Kaiti", "STKaiti", "BiauKai", serif'
              }}>功德圓滿</h1>
              <div style={{
                width: '48px',
                height: '4px',
                backgroundColor: '#A8584C',
                margin: '0 auto',
                opacity: 0.3,
                borderRadius: '9999px'
              }}></div>
            </div>

            {/* 中間：核心數據 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#5D4037',
                marginBottom: '12px',
                fontFamily: '"FangSong", "STFangsong", "SimSun", serif'
              }}>{currentChant}</div>
              <div style={{
                fontSize: '4.5rem',
                fontWeight: '900',
                color: '#A8584C',
                letterSpacing: '-0.05em',
                lineHeight: '1',
                marginBottom: '12px',
                fontFamily: '"FangSong", "STFangsong", "SimSun", serif'
              }}>{todayCount.toLocaleString()}</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#A8584C',
                letterSpacing: '0.2em',
                borderTop: '1px solid rgba(168, 88, 76, 0.2)',
                borderBottom: '1px solid rgba(168, 88, 76, 0.2)',
                padding: '4px 24px',
                paddingLeft: 'calc(24px + 0.2em)'
              }}>遍數總結</div>
            </div>

            {/* 底部：迴向文 */}
            <div style={{
              width: '100%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                color: '#5D4037',
                lineHeight: '2',
                fontStyle: 'italic',
                opacity: 0.9,
                padding: '0 16px',
                whiteSpace: 'pre-wrap',
                marginBottom: '24px',
                fontFamily: '"FangSong", "STFangsong", "SimSun", serif'
              }}>
                {editableText}
              </div>

              {/* Footer Logo Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                {/* Logo Box */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '2px solid #A8584C',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#A8584C', lineHeight: '1' }}>靜心</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#A8584C', lineHeight: '1' }}>念佛</span>
                </div>

                {/* Text Label */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  textAlign: 'left'
                }}>
                  <p style={{
                    fontSize: '10px',
                    color: '#9CA3AF',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    lineHeight: '1',
                    margin: '0 0 4px 0'
                  }}>APP</p>
                  <p style={{
                    fontSize: '12px',
                    color: '#A8584C',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    lineHeight: '1',
                    margin: '0'
                  }}>靜心念佛</p>
                </div>
              </div>
            </div>
            {/* 關閉內容容器 */}
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default DedicationModal;
