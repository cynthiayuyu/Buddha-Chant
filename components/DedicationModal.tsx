
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
          <div ref={cardRef} className="w-[375px] bg-[#FAF7F2] p-8 flex flex-col items-center relative border-[12px] border-[#F2E6E4]">
            {/* 背景紋理 */}
            {/* <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div> */}

            {/* 裝飾框線 */}
            <div className="absolute inset-4 border border-[#A8584C] opacity-20 rounded-[2rem]"></div>
            <div className="absolute inset-5 border border-[#A8584C] opacity-10 rounded-[1.8rem]"></div>

            {/* 頂部：日期與標題 */}
            <div className="w-full text-center space-y-4 pt-6 pb-4 z-10">
              {/* 使用 indent (縮排) 來平衡 letter-spacing，比 padding 更準確 */}
              <p className="text-sm font-bold tracking-[0.5em] text-[#A8584C] uppercase indent-[0.5em]">{dateStr}</p>
              <h1 className="calligraphy-font text-4xl font-bold text-[#4E342E] tracking-widest indent-[0.1em]">功德圓滿</h1>
              <div className="w-12 h-1 bg-[#A8584C] mx-auto opacity-30 rounded-full"></div>
            </div>

            {/* 中間：核心數據 */}
            <div className="flex flex-col items-center w-full py-6 space-y-4 z-10">
              <div className="serif-font text-2xl font-bold text-[#5D4037]">{currentChant}</div>
              <div className="relative">
                <div className="absolute -inset-6 bg-[#A8584C] opacity-5 blur-2xl rounded-full"></div>
                <div className="text-7xl font-black text-[#A8584C] serif-font tracking-tighter">{todayCount.toLocaleString()}</div>
              </div>
              {/* 這裡使用 padding-left 來平衡，因為是帶邊框的區塊 */}
              <div className="text-sm font-bold text-[#A8584C] tracking-[0.2em] border-t border-b border-[#A8584C]/20 py-1 px-6 pl-[calc(1.5rem+0.2em)]">遍數總結</div>
            </div>

            {/* 底部：迴向文 */}
            <div className="w-full space-y-6 pt-4 pb-6 z-10">
              <div className="serif-font text-center text-[#5D4037] text-base leading-loose italic opacity-90 px-4 whitespace-pre-wrap">
                {editableText}
              </div>

              {/* Footer Logo Section - Using Table/Flex Hybrid for Maximum Stability */}
              <div
                className="w-full flex justify-center items-center pt-2"
                style={{
                  height: '60px', // Explicit height
                  marginTop: '10px'
                }}
              >
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
                    opacity: 0.9,
                    backgroundColor: 'transparent' // Ensure bg is transparent
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#A8584C', lineHeight: '1', display: 'block' }}>靜心</span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#A8584C', lineHeight: '1', display: 'block' }}>念佛</span>
                  </div>

                  {/* Text Label */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '48px', // Match Logo Height
                    textAlign: 'left'
                  }}>
                    <p style={{
                      fontSize: '10px',
                      color: '#9CA3AF', // gray-400
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      lineHeight: '1',
                      margin: '0 0 4px 0', // Explicit margin
                      paddingLeft: '2px' // indentation
                    }}>APP</p>
                    <p style={{
                      fontSize: '12px',
                      color: '#A8584C',
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      lineHeight: '1',
                      margin: '0',
                      paddingLeft: '2px'
                    }}>靜心念佛</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default DedicationModal;
