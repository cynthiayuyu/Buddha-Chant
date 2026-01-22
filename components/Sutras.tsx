
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings, Sutra } from '../types';
import { Book, Plus, Trash2, ChevronRight, ArrowLeft, Edit2, Check, X, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  settings: UserSettings;
  setSettings: (updater: (prev: UserSettings) => UserSettings) => void;
}

const Sutras: React.FC<Props> = ({ settings, setSettings }) => {
  const [selectedSutra, setSelectedSutra] = useState<Sutra | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // 排序相關狀態
  const [isReordering, setIsReordering] = useState(false);
  const [tempSutras, setTempSutras] = useState<Sutra[]>([]);
  
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');

  const handleSaveAdd = () => {
    if (tempTitle.trim() && tempContent.trim()) {
      const newSutra: Sutra = { id: Date.now().toString(), title: tempTitle, content: tempContent };
      setSettings(prev => ({ ...prev, sutras: [...prev.sutras, newSutra] }));
      setIsAdding(false);
      setTempTitle('');
      setTempContent('');
    }
  };

  const handleSaveEdit = () => {
    if (selectedSutra && tempTitle.trim() && tempContent.trim()) {
      setSettings(prev => ({
        ...prev,
        sutras: prev.sutras.map(s => s.id === selectedSutra.id ? { ...s, title: tempTitle, content: tempContent } : s)
      }));
      setSelectedSutra({ ...selectedSutra, title: tempTitle, content: tempContent });
      setIsEditing(false);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirmDeleteId === id) {
      setSettings(prev => ({ ...prev, sutras: prev.sutras.filter(s => s.id !== id) }));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  // 開啟排序 Modal
  const openReorder = () => {
    setTempSutras([...settings.sutras]);
    setIsReordering(true);
  };

  // 移動項目
  const moveSutra = (index: number, direction: 'up' | 'down') => {
    const newSutras = [...tempSutras];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSutras.length) {
      [newSutras[index], newSutras[targetIndex]] = [newSutras[targetIndex], newSutras[index]];
      setTempSutras(newSutras);
    }
  };

  // 儲存排序
  const saveOrder = () => {
    setSettings(prev => ({ ...prev, sutras: tempSutras }));
    setIsReordering(false);
  };

  if (selectedSutra) {
    return (
      <div className="py-4 h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center px-1">
          <button onClick={() => { setSelectedSutra(null); setIsEditing(false); }} className="flex items-center gap-2 text-[#A8584C] font-bold text-sm"><ArrowLeft size={16} /> 返回</button>
          {!isEditing && <button onClick={() => { setTempTitle(selectedSutra.title); setTempContent(selectedSutra.content); setIsEditing(true); }} className="p-2 text-[#A8584C]"><Edit2 size={20} /></button>}
        </div>
        <div className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4 h-full flex flex-col">
              <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="w-full serif-font text-xl font-bold text-[#4E342E] border-b border-[#F2E6E4] pb-2 outline-none bg-transparent" />
              <textarea value={tempContent} onChange={(e) => setTempContent(e.target.value)} className="flex-1 w-full serif-font text-[#2c2c2c] leading-relaxed text-lg outline-none resize-none bg-transparent" />
              <div className="flex gap-2"><button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-2xl bg-gray-50 text-gray-400">取消</button><button onClick={handleSaveEdit} className="flex-1 py-3 rounded-2xl bg-[#A8584C] text-white font-bold hover:bg-[#8D4439]">保存</button></div>
            </div>
          ) : (
            <div>
              <h2 className="serif-font text-2xl font-bold text-[#4E342E] text-center mb-8 border-b border-[#F2E6E4] pb-4">{selectedSutra.title}</h2>
              <div className="serif-font text-[#2c2c2c] leading-loose text-2xl whitespace-pre-wrap px-2 tracking-wide">{selectedSutra.content}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6 pb-20 h-full">
      <div className="px-2 flex justify-between items-center">
        <div><h2 className="serif-font text-2xl font-bold text-[#4E342E] mb-1">大藏經</h2><p className="text-sm text-gray-400 font-medium">深入經藏，智慧如海</p></div>
        <div className="flex gap-2">
          <button onClick={openReorder} className="p-3 bg-white/60 text-gray-400 rounded-full shadow-sm border border-[#e7e5e4] hover:text-[#A8584C] active:scale-95 transition-all"><SlidersHorizontal size={24} /></button>
          <button onClick={() => setIsAdding(true)} className="p-3 bg-[#A8584C] text-white rounded-full shadow-lg active:scale-90 hover:bg-[#8D4439]"><Plus size={24} /></button>
        </div>
      </div>
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-[#e7e5e4] space-y-4">
            <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} placeholder="經名" className="w-full px-4 py-3 bg-[#FAF7F2] rounded-2xl outline-none border border-[#e7e5e4]" />
            <textarea value={tempContent} onChange={(e) => setTempContent(e.target.value)} placeholder="內容..." className="w-full h-48 px-4 py-3 bg-[#FAF7F2] rounded-2xl outline-none resize-none" />
            <div className="flex gap-2"><button onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-2xl bg-gray-50">取消</button><button onClick={handleSaveAdd} className="flex-1 py-3 bg-[#A8584C] text-white rounded-2xl font-bold hover:bg-[#8D4439]">存入</button></div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid gap-3">
        {settings.sutras.map(s => (
          <div key={s.id} className="bg-white/80 p-5 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] flex justify-between items-center group cursor-pointer hover:border-[#A8584C]/30 transition-all">
            <div className="flex-1 flex items-center gap-4" onClick={() => setSelectedSutra(s)}>
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-full flex items-center justify-center text-[#A8584C] group-hover:bg-[#A8584C] group-hover:text-white transition-all"><Book size={20} /></div>
              <span className="serif-font text-xl font-bold text-[#4E342E]">{s.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={(e) => handleRemove(s.id, e)} 
                className={`p-3 transition-all z-10 rounded-xl flex items-center ${
                  confirmDeleteId === s.id 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'text-gray-300 hover:text-red-400 active:scale-90'
                }`}
              >
                {confirmDeleteId === s.id ? <span className="text-xs font-bold px-1">確認?</span> : <Trash2 size={20} />}
              </button>
              <ChevronRight size={24} className="text-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* 排序調整 Modal */}
      <AnimatePresence>
        {isReordering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2c2c2c]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#FAF7F2] w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col max-h-[70vh]">
              <div className="p-5 border-b border-[#e7e5e4] flex justify-between items-center bg-white/50 rounded-t-[2rem]">
                <h3 className="serif-font text-lg font-bold text-[#4E342E]">調整經文順序</h3>
                <button onClick={() => setIsReordering(false)} className="text-gray-400"><X size={20}/></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {tempSutras.map((sutra, index) => (
                  <div key={sutra.id} className="bg-white/80 p-3 rounded-xl border border-[#e7e5e4] flex justify-between items-center shadow-sm">
                    <span className="serif-font font-bold text-[#4E342E]">{sutra.title}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => moveSutra(index, 'up')} 
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg ${index === 0 ? 'text-gray-200' : 'text-[#A8584C] hover:bg-[#F2E6E4]'}`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveSutra(index, 'down')} 
                        disabled={index === tempSutras.length - 1}
                        className={`p-1.5 rounded-lg ${index === tempSutras.length - 1 ? 'text-gray-200' : 'text-[#A8584C] hover:bg-[#F2E6E4]'}`}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-[#e7e5e4] bg-white/50 rounded-b-[2rem]">
                <button onClick={saveOrder} className="w-full py-3 bg-[#A8584C] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#A8584C]/20 active:scale-95 transition-all hover:bg-[#8D4439]">
                  <Check size={18} />
                  <span>儲存順序</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sutras;
