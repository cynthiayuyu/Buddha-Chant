
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings, FeedbackType, ItemGoal, CounterMode } from '../types';
import {
  Music, Bell, MousePointer2, VolumeX, Vibrate, Target, BookText, Plus, Trash2,
  Settings as SettingsIcon, MousePointer, Keyboard, ChevronRight, ChevronDown,
  Cloud, CloudUpload, CloudDownload, RefreshCw, AlertCircle, CheckCircle2,
  Copy, Check, Key
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface Props {
  settings: UserSettings;
  setSettings: (updater: (prev: UserSettings) => UserSettings) => void;
  onCloudBackup?: () => Promise<boolean>;
  onCloudRestore?: () => Promise<boolean>;
  onRestoreByRecoveryCode?: (code: string) => Promise<boolean>;
  isSyncing?: boolean;
  syncError?: string | null;
  isLoggedIn?: boolean;
  userId?: string | null;
}

const Settings: React.FC<Props> = ({
  settings,
  setSettings,
  onCloudBackup,
  onCloudRestore,
  onRestoreByRecoveryCode,
  isSyncing = false,
  syncError = null,
  isLoggedIn = false,
  userId = null
}) => {
  const [newChant, setNewChant] = useState('');
  const [editingChantGoal, setEditingChantGoal] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copiedUserId, setCopiedUserId] = useState(false);

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

      {/* 雲端備份區塊 */}
      <section className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border border-[#e7e5e4] space-y-5">
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-[#A8584C]" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">雲端備份</h3>
        </div>

        {/* 狀態顯示 */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#e7e5e4]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <RefreshCw size={16} className="text-[#A8584C] animate-spin" />
              ) : settings.cloudBackupEnabled ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Cloud size={16} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-600">
                {isSyncing ? '同步中...' : settings.cloudBackupEnabled ? '已啟用雲端備份' : '未啟用雲端備份'}
              </span>
            </div>
          </div>
          {settings.lastSyncTime && (
            <p className="text-xs text-gray-400 mt-2">
              上次同步：{format(new Date(settings.lastSyncTime), 'MM/dd HH:mm', { locale: zhTW })}
            </p>
          )}
          {syncError && (
            <div className="flex items-center gap-2 mt-2 text-red-500">
              <AlertCircle size={14} />
              <span className="text-xs">{syncError}</span>
            </div>
          )}
        </div>

        {/* 恢復碼顯示 */}
        {userId && (
          <div className="bg-[#F2E6E4]/30 rounded-2xl p-4 border border-[#A8584C]/10">
            <div className="flex items-center gap-2 mb-2">
              <Key size={14} className="text-[#A8584C]" />
              <span className="text-xs font-bold text-gray-500">您的恢復碼（請妥善保存）</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded-lg text-xs font-mono text-[#4E342E] border border-[#e7e5e4] overflow-x-auto">
                {userId}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  setCopiedUserId(true);
                  setTimeout(() => setCopiedUserId(false), 2000);
                }}
                className="p-2 rounded-lg bg-white border border-[#e7e5e4] text-gray-500 hover:text-[#A8584C] active:scale-95 transition-all"
              >
                {copiedUserId ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              換設備時可用此碼恢復資料
            </p>
          </div>
        )}

        {/* 備份與恢復按鈕 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCloudBackup}
            disabled={isSyncing}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
              isSyncing
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#F2E6E4]/50 border-[#A8584C]/30 text-[#4E342E] hover:bg-[#F2E6E4] active:scale-95'
            }`}
          >
            <CloudUpload size={24} />
            <span className="text-xs font-bold">備份到雲端</span>
          </button>
          <button
            onClick={onCloudRestore}
            disabled={isSyncing}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
              isSyncing
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
            }`}
          >
            <CloudDownload size={24} />
            <span className="text-xs font-bold">從雲端恢復</span>
          </button>
        </div>

        {/* 使用恢復碼恢復 */}
        <div className="pt-4 border-t border-[#e7e5e4]">
          {!showRecoveryInput ? (
            <button
              onClick={() => setShowRecoveryInput(true)}
              className="w-full text-center text-xs text-[#A8584C] font-medium hover:underline"
            >
              使用恢復碼恢復資料
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500">輸入恢復碼</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="貼上恢復碼..."
                  className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#e7e5e4] rounded-xl text-sm outline-none focus:border-[#A8584C] font-mono"
                />
                <button
                  onClick={async () => {
                    if (recoveryCode.trim() && onRestoreByRecoveryCode) {
                      const success = await onRestoreByRecoveryCode(recoveryCode.trim());
                      if (success) {
                        setShowRecoveryInput(false);
                        setRecoveryCode('');
                      }
                    }
                  }}
                  disabled={isSyncing || !recoveryCode.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSyncing || !recoveryCode.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#A8584C] text-white hover:bg-[#8D4439] active:scale-95'
                  }`}
                >
                  恢復
                </button>
              </div>
              <button
                onClick={() => {
                  setShowRecoveryInput(false);
                  setRecoveryCode('');
                }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
              >
                取消
              </button>
            </div>
          )}
        </div>

        {/* 自動備份開關 */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e7e5e4]">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-500">自動雲端備份</span>
            <span className="text-xs text-gray-400">資料變更時自動同步</span>
          </div>
          <button
            onClick={() => updateSetting('cloudBackupEnabled', !settings.cloudBackupEnabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${settings.cloudBackupEnabled ? 'bg-[#A8584C]' : 'bg-gray-200'}`}
          >
            <motion.div animate={{ x: settings.cloudBackupEnabled ? 26 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          資料將以匿名方式儲存於 Firebase 雲端
        </p>
      </section>
    </div>
  );
};

export default Settings;
