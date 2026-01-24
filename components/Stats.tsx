
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChantRecord, UserSettings, Vow } from '../types';
import { format, subDays, startOfToday, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import { Target, TrendingUp, Calendar, SlidersHorizontal, ArrowUp, ArrowDown, X, Check, Plus, Trash2, Milestone } from 'lucide-react';

interface Props {
  records: ChantRecord[];
  settings: UserSettings;
  setSettings: (updater: (prev: UserSettings) => UserSettings) => void;
}

const Stats: React.FC<Props> = ({ records, settings, setSettings }) => {
  // 決定顯示順序：使用 settings.statsTabOrder，若無則依注音排序補上
  const effectiveChantOrder = useMemo(() => {
    const savedOrder = settings.statsTabOrder || [];
    const available = settings.availableChants;
    
    // 1. 存在於 savedOrder 且存在於 available 中的項目 (維持自訂順序)
    const orderedExisting = savedOrder.filter(c => available.includes(c));
    
    // 2. 存在於 available 但不在 savedOrder 中的項目 (新法門)，依注音排序
    const remainder = available
      .filter(c => !savedOrder.includes(c))
      .sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));

    return [...orderedExisting, ...remainder];
  }, [settings.availableChants, settings.statsTabOrder]);

  const sortedItems = effectiveChantOrder;

  // 修改：預設選中 '全部'
  const [selectedItem, setSelectedItem] = useState<string>('全部');
  
  useEffect(() => {
    if (selectedItem === '全部') return; 

    if (sortedItems.length > 0 && (!selectedItem || !sortedItems.includes(selectedItem))) {
      setSelectedItem(sortedItems[0]);
    }
  }, [sortedItems, selectedItem]);

  // 排序模式狀態
  const [isReordering, setIsReordering] = useState(false);
  const [tempOrder, setTempOrder] = useState<string[]>([]);

  // 發願模式狀態
  const [isAddingVow, setIsAddingVow] = useState(false);
  const [confirmDeleteVowId, setConfirmDeleteVowId] = useState<string | null>(null); // 新增刪除確認狀態
  const [newVow, setNewVow] = useState<{ chant: string; period: Vow['period']; target: string }>({
    chant: sortedItems[0] || '',
    period: 'day',
    target: '108'
  });

  // 確保 newVow.chant 始終指向有效的法門
  useEffect(() => {
    if (sortedItems.length > 0 && !sortedItems.includes(newVow.chant)) {
      setNewVow(prev => ({ ...prev, chant: sortedItems[0] }));
    }
  }, [sortedItems, newVow.chant]);

  const openReorder = () => {
    setTempOrder([...effectiveChantOrder]);
    setIsReordering(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...tempOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setTempOrder(newOrder);
    }
  };

  const saveOrder = () => {
    setSettings(prev => ({ ...prev, statsTabOrder: tempOrder }));
    setIsReordering(false);
  };

  // 發願相關邏輯
  const handleAddVow = () => {
    const targetNum = parseInt(newVow.target);
    if (!newVow.chant || isNaN(targetNum) || targetNum <= 0) return;

    const vow: Vow = {
      id: Date.now().toString(),
      chant: newVow.chant,
      period: newVow.period,
      target: targetNum,
      createdAt: new Date().toISOString()
    };

    setSettings(prev => ({
      ...prev,
      vows: [...(prev.vows || []), vow]
    }));
    setIsAddingVow(false);
  };

  const handleRemoveVowClick = (id: string) => {
    if (confirmDeleteVowId === id) {
      // 確認刪除
      setSettings(prev => ({
        ...prev,
        vows: prev.vows.filter(v => v.id !== id)
      }));
      setConfirmDeleteVowId(null);
    } else {
      // 進入確認狀態
      setConfirmDeleteVowId(id);
      setTimeout(() => setConfirmDeleteVowId(null), 3000); // 3秒後自動取消
    }
  };

  const calculateVowProgress = (vow: Vow) => {
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');
    const monthStart = startOfMonth(new Date());
    const yearStart = startOfYear(new Date());

    const itemRecords = records.filter(r => r.item === vow.chant);

    if (vow.period === 'day') {
      return itemRecords.filter(r => r.date === todayStr).reduce((s, r) => s + r.count, 0);
    } else if (vow.period === 'month') {
      return itemRecords.filter(r => isAfter(parseISO(r.date), monthStart) || r.date === format(monthStart, 'yyyy-MM-dd')).reduce((s, r) => s + r.count, 0);
    } else if (vow.period === 'year') {
      return itemRecords.filter(r => isAfter(parseISO(r.date), yearStart) || r.date === format(yearStart, 'yyyy-MM-dd')).reduce((s, r) => s + r.count, 0);
    } else {
      return itemRecords.reduce((s, r) => s + r.count, 0);
    }
  };

  const groupedVows = useMemo(() => {
    const groups = {
      day: [] as Vow[],
      month: [] as Vow[],
      year: [] as Vow[],
      lifetime: [] as Vow[]
    };
    (settings.vows || []).forEach(v => {
      // 過濾掉已經被刪除的法門的願望
      if (settings.availableChants.includes(v.chant)) {
        if (groups[v.period]) groups[v.period].push(v);
      }
    });
    return groups;
  }, [settings.vows, settings.availableChants]);

  const last7Days = useMemo(() => {
    const days = [];
    const today = startOfToday();
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = records
        .filter(r => r.date === dateStr && (selectedItem === '全部' ? true : r.item === selectedItem))
        .reduce((sum, r) => sum + r.count, 0);
      days.push({
        label: format(d, 'MM/dd'),
        count
      });
    }
    return days;
  }, [records, selectedItem]);

  const streak = useMemo(() => {
    let currentStreak = 0;
    const today = startOfToday();
    let d = today;
    const datesWithActivity = new Set(records.map(r => r.date));
    while (datesWithActivity.has(format(d, 'yyyy-MM-dd'))) {
      currentStreak++;
      d = subDays(d, 1);
    }
    return currentStreak;
  }, [records]);

  const periodLabels = {
    day: '每日定課',
    month: '每月定課',
    year: '年度計畫',
    lifetime: '終生大願'
  };

  return (
    <div className="py-4 space-y-6 pb-12">
      <div className="px-2 flex justify-between items-end">
        <div>
          <h2 className="serif-font text-2xl font-bold text-[#4E342E] mb-1">修行進度</h2>
          <p className="text-sm text-gray-400 font-medium">不積跬步，無以至千里</p>
        </div>
      </div>

      {/* 總結卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#A8584C] to-[#8D4439] p-5 rounded-[1.5rem] shadow-lg text-white">
          <div className="flex items-center gap-2 opacity-80 mb-2">
            <Calendar size={14} />
            <span className="text-xs font-black uppercase tracking-widest">連續精進</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">{streak}</span>
            <span className="text-sm font-bold">天</span>
          </div>
        </div>
        <div className="bg-white/60 p-5 rounded-[1.5rem] shadow-sm border border-[#e7e5e4]">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp size={14} />
            <span className="text-xs font-black uppercase tracking-widest">總計次數</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-[#4E342E]">
              {records.reduce((s,r) => s+r.count, 0).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#4E342E]">遍</span>
          </div>
        </div>
      </div>

      {/* 發願進度總覽 */}
      <div className="bg-white/80 p-6 rounded-[2rem] shadow-sm border border-[#e7e5e4] space-y-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Milestone size={18} className="text-[#A8584C]" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">發願進度總覽</h3>
          </div>
          <button 
            onClick={() => setIsAddingVow(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-[#A8584C] bg-[#F2E6E4] px-3 py-1.5 rounded-full border border-[#A8584C]/10 active:scale-95 transition-all"
          >
            <Plus size={12} />
            <span>新增願望</span>
          </button>
        </div>

        {Object.keys(groupedVows).every(k => groupedVows[k as Vow['period']].length === 0) ? (
          <div className="text-center py-8 text-gray-400 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#e7e5e4]">
            <p className="text-sm font-medium">尚無發願，請點擊右上方按鈕新增</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['day', 'month', 'year', 'lifetime'] as const).map(period => {
              const vows = groupedVows[period];
              if (vows.length === 0) return null;
              return (
                <div key={period} className="space-y-3">
                  <h4 className="text-xs font-black text-[#5D4037] uppercase opacity-70 border-b border-[#e7e5e4] pb-1">{periodLabels[period]}</h4>
                  <div className="grid gap-3">
                    {vows.map(vow => {
                      const current = calculateVowProgress(vow);
                      const percent = Math.min((current / vow.target) * 100, 100);
                      return (
                        <div key={vow.id} className="relative bg-[#FAF7F2] p-4 rounded-xl border border-[#e7e5e4]">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="serif-font text-base font-bold text-[#4E342E]">{vow.chant}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#A8584C]">{percent.toFixed(0)}%</span>
                              <button 
                                onClick={() => handleRemoveVowClick(vow.id)} 
                                className={`transition-all rounded-lg flex items-center justify-center ${
                                  confirmDeleteVowId === vow.id 
                                    ? 'bg-red-500 text-white px-2 py-1 shadow-sm' 
                                    : 'text-gray-300 hover:text-red-400 p-1'
                                }`}
                              >
                                {confirmDeleteVowId === vow.id ? (
                                  <span className="text-[10px] font-bold">確認?</span>
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className="h-full bg-[#A8584C]"
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium text-right tabular-nums">
                            {current.toLocaleString()} / {vow.target.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 修行項目篩選區 */}
      <div className="flex items-center gap-2 px-1">
        <button 
          onClick={openReorder}
          className="p-3 bg-white/60 rounded-full border border-[#e7e5e4] text-gray-400 hover:text-[#A8584C] shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <SlidersHorizontal size={18} />
        </button>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
          {['全部', ...sortedItems].map(item => (
            <button
              key={item}
              onClick={() => setSelectedItem(item)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                selectedItem === item 
                ? 'bg-[#A8584C] text-white border-[#A8584C]' 
                : 'bg-white/60 text-gray-400 border-[#e7e5e4] hover:border-[#A8584C]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* 長條圖 */}
      <div className="bg-white/80 p-6 rounded-[2rem] shadow-sm border border-[#e7e5e4]">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">近七日趨勢 ({selectedItem})</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#F2E6E4', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#FAF7F2' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                {last7Days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#A8584C' : '#E0B0A8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 新增發願 Modal */}
      <AnimatePresence>
        {isAddingVow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2c2c2c]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#FAF7F2] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-[#e7e5e4] flex justify-between items-center bg-white/50">
                <h3 className="serif-font text-lg font-bold text-[#4E342E]">新增願望</h3>
                <button onClick={() => setIsAddingVow(false)} className="text-gray-400"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">選擇法門</label>
                  <select 
                    value={newVow.chant} 
                    onChange={e => setNewVow({...newVow, chant: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#e7e5e4] rounded-xl text-sm font-bold text-[#4E342E] outline-none focus:border-[#A8584C]"
                  >
                    {sortedItems.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">週期</label>
                  <select 
                    value={newVow.period} 
                    onChange={e => setNewVow({...newVow, period: e.target.value as Vow['period']})}
                    className="w-full px-4 py-3 bg-white border border-[#e7e5e4] rounded-xl text-sm font-bold text-[#4E342E] outline-none focus:border-[#A8584C]"
                  >
                    {Object.entries(periodLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">目標次數</label>
                  <input 
                    type="number"
                    value={newVow.target}
                    onChange={e => setNewVow({...newVow, target: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#e7e5e4] rounded-xl text-sm font-bold text-[#4E342E] outline-none focus:border-[#A8584C]"
                  />
                </div>
              </div>
              <div className="p-5 bg-white/50 border-t border-[#e7e5e4]">
                <button onClick={handleAddVow} className="w-full py-3 bg-[#A8584C] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#A8584C]/20 active:scale-95 transition-all hover:bg-[#8D4439]">
                  <Check size={18} />
                  <span>確認發願</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 排序調整 Modal */}
      <AnimatePresence>
        {isReordering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2c2c2c]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#FAF7F2] w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col max-h-[70vh]">
              <div className="p-5 border-b border-[#e7e5e4] flex justify-between items-center bg-white/50 rounded-t-[2rem]">
                <h3 className="serif-font text-lg font-bold text-[#4E342E]">調整顯示順序</h3>
                <button onClick={() => setIsReordering(false)} className="text-gray-400"><X size={20}/></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {tempOrder.map((item, index) => (
                  <div key={item} className="bg-white/80 p-3 rounded-xl border border-[#e7e5e4] flex justify-between items-center shadow-sm">
                    <span className="serif-font font-bold text-[#4E342E]">{item}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => moveItem(index, 'up')} 
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg ${index === 0 ? 'text-gray-200' : 'text-[#A8584C] hover:bg-[#F2E6E4]'}`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveItem(index, 'down')} 
                        disabled={index === tempOrder.length - 1}
                        className={`p-1.5 rounded-lg ${index === tempOrder.length - 1 ? 'text-gray-200' : 'text-[#A8584C] hover:bg-[#F2E6E4]'}`}
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

export default Stats;
