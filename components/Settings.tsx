
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings, FeedbackType, ItemGoal, CounterMode } from '../types';
import { 
  Music, Bell, MousePointer2, VolumeX, Vibrate, Target, BookText, Plus, Trash2, 
  Settings as SettingsIcon, MousePointer, Keyboard, ChevronRight, ChevronDown 
} from 'lucide-react';

interface Props {
  settings: UserSettings;
  setSettings: (updater: (prev: UserSettings) => UserSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings }) => {
  const [newChant, setNewChant] = useState('');
  const [editingChantGoal, setEditingChantGoal] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // 恢復：使用注音排序
  const sortedAvailableChants = useMemo(() => {
    return [...settings.availableChants].sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));
  }, [settings.availableChants]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddChant = () => {
    const trimmed = newChant.trim();
    if (trimmed && !settings.availableChants.includes(trimmed)) {
      setSettings(prev => ({
        ...prev,
        availableChants: [...prev.availableChants, trimmed],
        itemGoals: {
          ...prev.itemGoals,
          [trimmed]: { day: 1080, month: 30000, year: 360000, lifetime: 1000000 }
        }
      }));
      setNewChant('');
    }
  };

  const handleRemoveChant = (chantToRemove: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (settings.availableChants.length <= 1) {
      alert("必須保留至少一個法門。");
      return;
    }

    if (confirmDelete === chantToRemove) {
      setSettings(prev => {
        const nextChants = prev.availableChants.filter(c => c !== chantToRemove);
        const nextGoals = { ...prev.itemGoals };
        delete nextGoals[chantToRemove];
        return {
          ...prev,
          availableChants: nextChants,
          itemGoals: nextGoals
        };
      });
      setConfirmDelete(null);
      if (editingChantGoal === chantToRemove) setEditingChantGoal(null);
    } else {
      setConfirmDelete(chantToRemove);
      setTimeout(() => setConfirmDelete(null), 3000); 
    }
  };

  const feedbacks: { type: FeedbackType; icon: any; label: string }[] = [
    { type: 'woodfish', icon: Music, label: '木魚' },
    { type: 'bell', icon: Bell, label: '引磬' },
    { type: 'click', icon: MousePointer2, label: '滴答' },
    { type: 'none', icon: VolumeX, label: '靜音' },
  ];

  const modes: { type: CounterMode; icon: any; label: string; desc: string }[] = [
    { type: 'button', icon: MousePointer, label: '大按鈕', desc: '手持點擊' },
    { type: 'manual', icon: Keyboard, label: '手動輸入', desc: '配合念珠' },
  ];

  return (
    <div className="py-4 space-y-6 pb-24 px-1">
      <div className="px-2">
        <h2 className="serif-font text-2xl font-bold text-[#4E342E] mb-1">修持設定</h2>
        <p className="text-sm text-gray-400 font-medium">個人化的修行空間</p>
      </div>

      <section className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={18} className="text-[#A8584C]" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">計數模式</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {modes.map(mode => (
            <button 
              key={mode.type} 
              onClick={() => updateSetting('counterMode', mode.type)} 
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all text-center ${settings.counterMode === mode.type ? 'bg-[#F2E6E4]/50 border-[#A8584C] text-[#4E342E]' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              <mode.icon size={24} />
              <div className="flex flex-col">
                <span className="text-xs font-black">{mode.label}</span>
                <span className="text-[10px] opacity-70 mt-1">{mode.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BookText size={18} className="text-[#A8584C]" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">法門管理</h3>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newChant} 
            onChange={(e) => setNewChant(e.target.value)} 
            placeholder="新增法門名稱..." 
            className="flex-1 px-4 py-3 bg-[#FAF7F2] border border-[#e7e5e4] rounded-xl text-base outline-none focus:border-[#A8584C]" 
          />
          <button onClick={handleAddChant} className="p-3 bg-[#A8584C] text-white rounded-xl active:scale-95 shadow-md shadow-[#A8584C]/20 hover:bg-[#8D4439]"><Plus size={24} /></button>
        </div>

        <div className="space-y-2 mt-4">
          {sortedAvailableChants.map((chant) => (
            <div key={chant} className="bg-[#FAF7F2] border border-[#e7e5e4] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div 
                  className="flex items-center gap-2 flex-1 py-1"
                >
                  <span className="serif-font text-lg font-bold text-[#4E342E]">{chant}</span>
                </div>
                
                <button 
                  type="button"
                  onClick={(e) => handleRemoveChant(chant, e)} 
                  className={`p-3 transition-all z-10 rounded-xl flex items-center gap-1 ${
                    confirmDelete === chant 
                      ? 'bg-red-500 text-white shadow-md' 
                      : 'text-gray-300 hover:text-red-400 active:scale-90'
                  }`}
                >
                  {confirmDelete === chant ? (
                    <span className="text-xs font-bold px-1">確認?</span>
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] space-y-5">
        <div className="flex items-center gap-2">
          <Music size={18} className="text-[#A8584C]" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">點擊反饋</h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {feedbacks.map((f) => (
            <button 
              key={f.type} 
              onClick={() => updateSetting('feedback', f.type)} 
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${settings.feedback === f.type ? 'bg-[#F2E6E4]/50 border-[#A8584C] text-[#4E342E]' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              <f.icon size={20} />
              <span className="text-[10px] font-black">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
          <div className="flex items-center gap-2">
            <Vibrate size={18} className="text-[#A8584C]" />
            <span className="text-sm font-bold text-gray-500">觸覺震動回饋</span>
          </div>
          <button 
            onClick={() => updateSetting('vibrate', !settings.vibrate)}
            className={`w-12 h-6 rounded-full relative transition-colors ${settings.vibrate ? 'bg-[#A8584C]' : 'bg-gray-200'}`}
          >
            <motion.div animate={{ x: settings.vibrate ? 26 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
