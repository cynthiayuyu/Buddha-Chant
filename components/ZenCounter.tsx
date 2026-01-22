
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { UserSettings, Vow, ChantRecord } from '../types';
import { ChevronDown, Plus, RotateCcw, Check, RefreshCcw } from 'lucide-react';
import { startOfMonth, startOfYear, isAfter, parseISO, format } from 'date-fns';

interface Props {
  currentChant: string;
  setCurrentChant: (val: string) => void;
  availableChants: string[];
  onAdd: (count: number) => void;
  settings: UserSettings;
  todayCount: number;
  records: ChantRecord[];
  vows: Vow[];
}

type ViewMode = 'day' | 'month' | 'year' | 'lifetime';

const ZenCounter: React.FC<Props> = ({ 
  currentChant, 
  setCurrentChant, 
  availableChants,
  onAdd, 
  settings, 
  todayCount, 
  records,
  vows
}) => {
  const [sessionCount, setSessionCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [manualInputValue, setManualInputValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  const controls = useAnimation();
  const audioContextRef = useRef<AudioContext | null>(null);

  const sortedChants = availableChants;

  const playFeedback = useCallback(async (isLong = false) => {
    if (settings.feedback !== 'none') {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (settings.feedback === 'woodfish') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(isLong ? 120 : 160, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + (isLong ? 0.2 : 0.08));
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isLong ? 0.3 : 0.1));
      } else if (settings.feedback === 'bell') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      } else {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      }
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.6);
    }

    if (settings.vibrate && navigator.vibrate) {
      const isThreshold = (todayCount + 1) % settings.threshold === 0;
      navigator.vibrate(isThreshold || isLong ? [150, 50, 150] : 30);
    }
  }, [settings, todayCount]);

  const handleIncrement = () => {
    playFeedback();
    onAdd(1);
    setSessionCount(prev => prev + 1);
    controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.1, ease: "easeOut" }
    });
  };

  const handleManualAdd = () => {
    const val = parseInt(manualInputValue);
    if (!isNaN(val) && val > 0) {
      playFeedback(true);
      onAdd(val);
      setSessionCount(prev => prev + val);
      setManualInputValue('');
    }
  };

  // 統計邏輯
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const yearStart = startOfYear(new Date());
    
    // 過濾出當前法門的所有紀錄
    const itemRecords = records.filter(r => r.item === currentChant);
    
    // 計算各個維度的累計值
    const monthCount = itemRecords
      .filter(r => isAfter(parseISO(r.date), monthStart) || r.date === format(monthStart, 'yyyy-MM-dd'))
      .reduce((s, r) => s + r.count, 0);

    const yearCount = itemRecords
      .filter(r => isAfter(parseISO(r.date), yearStart) || r.date === format(yearStart, 'yyyy-MM-dd'))
      .reduce((s, r) => s + r.count, 0);
    
    const lifetimeCount = itemRecords.reduce((s, r) => s + r.count, 0);

    return {
      day: todayCount,
      month: monthCount,
      year: yearCount,
      lifetime: lifetimeCount
    };
  }, [records, currentChant, todayCount]);

  // 取得當前 ViewMode 對應的發願目標
  const currentVow = useMemo(() => {
    return vows.find(v => v.chant === currentChant && v.period === viewMode);
  }, [vows, currentChant, viewMode]);

  const hasGoal = !!currentVow;
  const currentCount = stats[viewMode];
  const targetCount = currentVow ? currentVow.target : 0;
  const progressPercentage = hasGoal ? Math.min((currentCount / targetCount) * 100, 100) : 0;

  // 切換模式
  const cycleViewMode = () => {
    const modes: ViewMode[] = ['day', 'month', 'year', 'lifetime'];
    const currentIndex = modes.indexOf(viewMode);
    setViewMode(modes[(currentIndex + 1) % modes.length]);
  };

  const modeLabels: Record<ViewMode, string> = {
    day: '今日已修',
    month: '本月已修',
    year: '今年已修',
    lifetime: '累計已修'
  };

  return (
    <div className="flex flex-col h-full w-full py-4 relative">
      <div className="relative w-full z-30 mb-2 px-2">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-white/60 backdrop-blur-md px-6 py-5 rounded-[2rem] shadow-sm border border-[#e7e5e4] hover:border-[#A8584C]/30 transition-all"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">當前修持</span>
            <span className="serif-font text-2xl font-bold text-[#4E342E] truncate max-w-[200px]">{currentChant}</span>
          </div>
          <ChevronDown size={24} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-2 right-2 mt-2 bg-[#FAF7F2] rounded-[2rem] shadow-2xl border border-[#e7e5e4] z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {sortedChants.map((chant) => (
                  <button key={chant} onClick={() => { setCurrentChant(chant); setIsDropdownOpen(false); }} className={`w-full text-left px-6 py-5 serif-font text-lg transition-colors ${currentChant === chant ? 'text-[#A8584C] font-bold bg-[#F2E6E4]/50' : 'text-[#5D4037] hover:bg-[#F2E6E4]/30'}`}>{chant}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* 可點擊區域，切換顯示模式 */}
          <button onClick={cycleViewMode} className="absolute inset-0 z-20 rounded-full cursor-pointer outline-none active:scale-95 transition-transform" aria-label="切換統計週期" />

          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 288 288">
            <circle cx="144" cy="144" r="122" stroke="#e7e5e4" strokeWidth="8" fill="transparent" />
            <motion.circle
              cx="144" cy="144" r="122" stroke="#A8584C" strokeWidth="8" fill="transparent"
              strokeDasharray={2 * Math.PI * 122}
              animate={{ 
                strokeDashoffset: hasGoal 
                  ? (1 - progressPercentage / 100) * (2 * Math.PI * 122) 
                  : 2 * Math.PI * 122
              }}
              transition={{ type: 'spring', stiffness: 40, damping: 15 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center justify-center text-center pointer-events-none z-10">
            <motion.div 
               key={viewMode}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-1 mb-2"
            >
               <span className="text-gray-400 text-sm font-black tracking-[0.2em] uppercase">{modeLabels[viewMode]}</span>
               <div className="bg-gray-200 text-gray-400 rounded-full p-0.5"><RefreshCcw size={8} /></div>
            </motion.div>
            
            <motion.span className="text-6xl font-black text-[#A8584C] tracking-tighter tabular-nums" animate={controls}>
                {currentCount.toLocaleString()}
            </motion.span>
            
            {hasGoal ? (
              <div className="mt-4 px-4 py-1.5 bg-[#F2E6E4] rounded-full border border-[#A8584C]/20">
                <span className="text-xs font-bold text-[#8D4439] uppercase">目標 {targetCount.toLocaleString()} • {progressPercentage.toFixed(0)}%</span>
              </div>
            ) : (
              <div className="mt-4 px-4 py-1.5 rounded-full">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">隨緣修持</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6 pb-6 mt-auto">
        {settings.counterMode === 'button' ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.9 }} onClick={handleIncrement} className="w-40 h-40 rounded-full bg-gradient-to-br from-[#A8584C] to-[#8D4439] shadow-[0_15px_40px_-10px_rgba(168,88,76,0.5)] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-2 border border-white/20 rounded-full" />
            <div className="flex flex-col items-center text-white z-10">
              <Plus size={48} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mt-2">精進持誦</span>
            </div>
          </motion.button>
        ) : (
          <div className="w-full px-4 max-w-xs">
            <div className="bg-white/80 p-5 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] space-y-3">
              <div className="flex items-center gap-3">
                <input type="number" inputMode="numeric" value={manualInputValue} onChange={(e) => setManualInputValue(e.target.value)} placeholder="次數" className="flex-1 min-w-0 text-2xl font-black bg-[#FAF7F2] border-b-2 border-[#F2E6E4] focus:border-[#A8584C] outline-none px-4 py-2 text-center text-[#4E342E]" />
                <button onClick={handleManualAdd} className="bg-[#A8584C] text-white p-3 rounded-2xl shadow-lg active:scale-90 h-12 w-12 flex items-center justify-center hover:bg-[#8D4439]"><Check size={22} strokeWidth={3} /></button>
              </div>
              <div className="flex justify-center gap-2">
                {[21, 54, 108].map(p => (
                  <button key={p} onClick={() => setManualInputValue(p.toString())} className="px-3 py-2 bg-[#FAF7F2] border border-[#e7e5e4] rounded-xl text-xs font-bold text-gray-400 hover:text-[#A8584C] hover:border-[#A8584C]/30">+{p}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="px-8 py-3 bg-white/60 rounded-2xl shadow-sm border border-[#e7e5e4] flex flex-col items-center">
            <span className="text-xs text-gray-400 font-black tracking-widest uppercase mb-1">本次連唸</span>
            <span className="text-2xl font-black text-[#5D4037] tabular-nums">{sessionCount}</span>
          </div>
          <button onClick={() => setSessionCount(0)} className="p-4 bg-white/60 text-gray-400 rounded-full border border-[#e7e5e4] hover:text-[#A8584C] active:rotate-180 transition-all shadow-sm"><RotateCcw size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default ZenCounter;
