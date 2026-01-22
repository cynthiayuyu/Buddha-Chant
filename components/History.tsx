
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChantRecord } from '../types';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subMonths,
  addMonths,
  startOfToday
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, X } from 'lucide-react';

interface Props {
  records: ChantRecord[];
}

const History: React.FC<Props> = ({ records }) => {
  // 修改預設為 list 模式
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = startOfToday();

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayTotal = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records
      .filter(r => r.date === dateStr)
      .reduce((sum, r) => sum + r.count, 0);
  };

  const getDayRecords = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.filter(r => r.date === dateStr);
  };

  const groupedRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const groups: { [key: string]: ChantRecord[] } = {};
    sorted.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return Object.entries(groups);
  }, [records]);

  return (
    <div className="py-4 space-y-6 pb-20">
      <div className="px-2 flex justify-between items-end">
        <div>
          <h2 className="serif-font text-2xl font-bold text-[#4E342E] mb-1">修持日誌</h2>
          <p className="text-sm text-gray-400 font-medium">記錄每一份功德與精進</p>
        </div>
        <div className="flex bg-white/60 rounded-xl p-1 shadow-sm border border-[#e7e5e4]">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#A8584C] text-white shadow-sm' : 'text-gray-400'}`}><List size={20} /></button>
          <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-[#A8584C] text-white shadow-sm' : 'text-gray-400'}`}><CalendarIcon size={20} /></button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'calendar' ? (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between px-4 bg-white/60 py-4 rounded-[2rem] shadow-sm border border-[#e7e5e4]">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-gray-400 hover:text-[#A8584C]"><ChevronLeft size={24} /></button>
              <span className="serif-font text-xl font-bold text-[#4E342E]">{format(currentMonth, 'yyyy年 MMM', { locale: zhTW })}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-gray-400 hover:text-[#A8584C]"><ChevronRight size={24} /></button>
            </div>
            <div className="bg-white/60 p-4 rounded-[2.5rem] shadow-sm border border-[#e7e5e4]">
              <div className="grid grid-cols-7 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const total = getDayTotal(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(day, today);
                  return (
                    <button
                      key={idx}
                      onClick={() => isCurrentMonth && setSelectedDate(day)}
                      className={`relative aspect-square flex flex-col items-center justify-start pt-2 rounded-2xl transition-all ${isCurrentMonth ? 'hover:bg-[#F2E6E4]/50' : 'opacity-10 pointer-events-none'} ${isToday ? 'border-2 border-[#A8584C]/30' : ''}`}
                    >
                      <span className={`text-base font-bold ${isToday ? 'text-[#A8584C]' : 'text-[#5D4037]'}`}>{format(day, 'd')}</span>
                      {total > 0 && (
                        <div className="flex flex-col items-center mt-0.5">
                          <span className="text-[9px] font-medium text-gray-400/80">{total > 9999 ? `${(total/1000).toFixed(0)}k` : total}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#A8584C]" style={{ opacity: Math.min(0.3 + total/2000, 1) }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {groupedRecords.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic serif-font text-gray-400 text-lg">尚無修行紀錄</div>
            ) : (
              groupedRecords.map(([date, dayRecords]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-xs font-black text-[#A8584C] bg-[#F2E6E4] px-3 py-1.5 rounded-full border border-[#A8584C]/10">{format(parseISO(date), 'MM/dd EEEE', { locale: zhTW })}</span>
                    <div className="flex-1 h-[1px] bg-[#e7e5e4]" />
                  </div>
                  <div className="grid gap-2">
                    {dayRecords.map(r => (
                      <div key={r.id} className="bg-white/80 p-5 rounded-2xl shadow-sm border border-[#e7e5e4] flex justify-between items-center hover:border-[#A8584C]/20 transition-all">
                        <span className="serif-font text-lg font-bold text-[#4E342E]">{r.item}</span>
                        <span className="text-xl font-black text-[#A8584C]">{r.count.toLocaleString()} <small className="text-xs font-bold text-[#A8584C]/60">遍</small></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#2c2c2c]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FAF7F2] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[#e7e5e4] flex justify-between items-center bg-white/50">
                <div>
                  <h3 className="serif-font text-xl font-bold text-[#4E342E]">修行明細</h3>
                  <p className="text-xs text-gray-400 font-bold tracking-widest">{format(selectedDate, 'yyyy年MM月dd日', { locale: zhTW })}</p>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-2 text-gray-300 hover:text-[#A8584C]"><X size={24}/></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                {getDayRecords(selectedDate).length === 0 ? (
                  <div className="text-center py-10 opacity-30 italic">該日無修持紀錄</div>
                ) : (
                  getDayRecords(selectedDate).map(r => (
                    <div key={r.id} className="bg-white/80 p-5 rounded-2xl border border-[#e7e5e4] flex justify-between items-center shadow-sm">
                      <span className="serif-font text-lg font-bold text-[#5D4037]">{r.item}</span>
                      <span className="text-2xl font-black text-[#A8584C]">{r.count.toLocaleString()}</span>
                    </div>
                  ))
                )}
                <div className="pt-4 mt-2 border-t border-[#e7e5e4] flex justify-between px-2">
                    <span className="text-base font-bold text-gray-400">當日總計</span>
                    <span className="text-2xl font-black text-[#8D4439]">{getDayTotal(selectedDate).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-6 bg-white/50"><button onClick={() => setSelectedDate(null)} className="w-full py-4 bg-[#A8584C] text-white rounded-2xl font-bold shadow-lg shadow-[#A8584C]/20 hover:bg-[#8D4439]">關閉</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
