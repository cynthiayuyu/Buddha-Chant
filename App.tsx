
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flower2,
  History as HistoryIcon,
  Settings as SettingsIcon,
  BarChart3 as StatsIcon,
  BookOpen,
  Library
} from 'lucide-react';
import { format } from 'date-fns'; // Import format for local time
import ZenCounter from './components/ZenCounter';
import History from './components/History';
import Stats from './components/Stats';
import Settings from './components/Settings';
import Sutras from './components/Sutras';
import DedicationModal from './components/DedicationModal';
import { ChantRecord, UserSettings, ItemGoal, Sutra } from './types';
import { DEFAULT_CHANTS, DEFAULT_SUTRAS } from './constants';
import { User } from 'firebase/auth';
import { onAuthChange, signInAnonymouslyUser, saveToCloud, loadFromCloud } from './firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'counter' | 'history' | 'sutras' | 'stats' | 'settings'>('counter');

  // 優化：直接在初始化時讀取 localStorage，確保狀態立即生效
  const [records, setRecords] = useState<ChantRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zen_records');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const defaultItemGoal: ItemGoal = { day: 1080, month: 30000, year: 360000, lifetime: 1000000 };

  // 優化：直接在初始化時讀取並合併設定，解決設定延遲載入的問題
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('zen_settings');
      const parsed = saved ? JSON.parse(saved) : {};

      return {
        feedback: 'woodfish',
        vibrate: true,
        threshold: 108,
        customMeritText: '',
        counterMode: 'button',
        itemGoals: DEFAULT_CHANTS.reduce((acc, chant) => ({ ...acc, [chant]: { ...defaultItemGoal } }), {}),
        statsTabOrder: [],
        ...parsed,
        // 確保陣列型別的資料正確性
        availableChants: parsed.availableChants || [...DEFAULT_CHANTS],
        sutras: parsed.sutras || [...DEFAULT_SUTRAS],
        vows: parsed.vows || []
      };
    } catch (e) {
      return {
        feedback: 'woodfish',
        vibrate: true,
        threshold: 108,
        customMeritText: '',
        availableChants: [...DEFAULT_CHANTS],
        counterMode: 'button',
        itemGoals: DEFAULT_CHANTS.reduce((acc, chant) => ({ ...acc, [chant]: { ...defaultItemGoal } }), {}),
        vows: [],
        sutras: [...DEFAULT_SUTRAS],
        statsTabOrder: []
      };
    }
  });

  const [currentChant, setCurrentChant] = useState(DEFAULT_CHANTS[0]);
  const [showDedication, setShowDedication] = useState(false);

  // Firebase 認證狀態
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastSyncRef = useRef<number>(0);

  // 監聽 Firebase 認證狀態
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 雲端備份函數
  const handleCloudBackup = useCallback(async () => {
    if (!firebaseUser) {
      // 自動匿名登入
      const user = await signInAnonymouslyUser();
      if (!user) {
        setSyncError('無法連接雲端服務');
        return false;
      }
      setFirebaseUser(user);
    }

    const userId = firebaseUser?.uid;
    if (!userId) {
      setSyncError('請先登入');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const success = await saveToCloud(userId, records, settings);
      if (success) {
        const now = new Date().toISOString();
        setSettings(prev => ({ ...prev, lastSyncTime: now, cloudBackupEnabled: true }));
        lastSyncRef.current = Date.now();
        return true;
      } else {
        setSyncError('備份失敗，請稍後再試');
        return false;
      }
    } catch (error) {
      setSyncError('備份失敗，請檢查網路連線');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUser, records, settings]);

  // 從雲端恢復函數
  const handleCloudRestore = useCallback(async () => {
    if (!firebaseUser) {
      const user = await signInAnonymouslyUser();
      if (!user) {
        setSyncError('無法連接雲端服務');
        return false;
      }
      setFirebaseUser(user);
    }

    const userId = firebaseUser?.uid;
    if (!userId) {
      setSyncError('請先登入');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const cloudData = await loadFromCloud(userId);
      if (cloudData) {
        setRecords(cloudData.records);
        setSettings(prev => ({
          ...prev,
          ...cloudData.settings,
          lastSyncTime: cloudData.lastUpdated?.toISOString() || prev.lastSyncTime
        }));
        return true;
      } else {
        setSyncError('雲端沒有備份資料');
        return false;
      }
    } catch (error) {
      setSyncError('恢復失敗，請檢查網路連線');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUser]);

  // 自動備份（當資料變化時，且距離上次同步超過 5 分鐘）
  useEffect(() => {
    if (settings.cloudBackupEnabled && firebaseUser && !isSyncing) {
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync > 5 * 60 * 1000) { // 5 分鐘
        handleCloudBackup();
      }
    }
  }, [records, settings.cloudBackupEnabled, firebaseUser, isSyncing]);

  // 恢復注音排序邏輯
  const sortedChants = useMemo(() => {
    return [...settings.availableChants].sort((a, b) => a.localeCompare(b, 'zh-Hant-TW'));
  }, [settings.availableChants]);

  // 移除舊的初始化 useEffect，保留儲存邏輯
  useEffect(() => {
    localStorage.setItem('zen_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('zen_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!settings.availableChants.includes(currentChant)) {
      setCurrentChant(settings.availableChants[0] || '');
    }
  }, [settings.availableChants, currentChant]);

  const handleAddCount = useCallback((count: number) => {
    if (count <= 0) return;
    // 使用 date-fns format 獲取本地時間的 YYYY-MM-DD，解決跨夜問題
    const today = format(new Date(), 'yyyy-MM-dd');

    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.date === today && r.item === currentChant);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], count: updated[existingIdx].count + count };
        return updated;
      }
      return [...prev, { id: Date.now().toString(), date: today, item: currentChant, count }];
    });
  }, [currentChant]);

  const chantTodayTotal = useMemo(() => {
    // 同樣使用本地時間
    const today = format(new Date(), 'yyyy-MM-dd');
    return records
      .filter(r => r.date === today && r.item === currentChant)
      .reduce((sum, r) => sum + r.count, 0);
  }, [records, currentChant]);

  const navItems = [
    { id: 'counter', icon: Flower2, label: '修持' },
    { id: 'sutras', icon: Library, label: '經藏' },
    { id: 'history', icon: HistoryIcon, label: '日誌' },
    { id: 'stats', icon: StatsIcon, label: '精進' },
    { id: 'settings', icon: SettingsIcon, label: '設定' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#FAF7F2] relative shadow-2xl overflow-hidden">
      {/* <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" /> */}

      <header className="pt-8 pb-4 px-6 flex justify-between items-end relative z-10 bg-[#FAF7F2]/80 backdrop-blur-sm">
        <div>
          {/* 修改為書法字體，顏色改為柔和赤陶紅 */}
          <h1 className="calligraphy-font text-3xl font-bold text-[#A8584C]">靜心念佛</h1>
          <p className="text-xs text-gray-500 font-bold tracking-[0.2em] uppercase mt-1">Mindful Repetition</p>
        </div>
        <button
          onClick={() => setShowDedication(true)}
          className="flex items-center gap-1.5 text-xs bg-[#F2E6E4] text-[#A8584C] px-5 py-2.5 rounded-full font-bold shadow-sm active:scale-95 transition-all border border-[#A8584C]/20"
        >
          <BookOpen size={16} />
          <span>迴向</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 relative z-10 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'counter' && (
            <motion.div key="counter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ZenCounter
                currentChant={currentChant}
                setCurrentChant={setCurrentChant}
                availableChants={sortedChants}
                onAdd={handleAddCount}
                settings={settings}
                todayCount={chantTodayTotal}
                records={records}
                vows={settings.vows}
              />
            </motion.div>
          )}
          {activeTab === 'sutras' && (
            <motion.div key="sutras" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <Sutras settings={settings} setSettings={setSettings} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full">
              <History records={records} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full">
              <Stats
                records={records}
                settings={settings}
                setSettings={setSettings}
              />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full">
              <Settings
                settings={settings}
                setSettings={setSettings}
                onCloudBackup={handleCloudBackup}
                onCloudRestore={handleCloudRestore}
                isSyncing={isSyncing}
                syncError={syncError}
                isLoggedIn={!!firebaseUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#FAF7F2]/90 backdrop-blur-xl border-t border-[#e7e5e4] flex justify-around items-center py-4 pb-8 px-2 z-40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all relative flex-1 ${activeTab === item.id ? 'text-[#A8584C]' : 'text-gray-400'
              }`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-[#A8584C] rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {showDedication && (
          <DedicationModal
            onClose={() => setShowDedication(false)}
            todayCount={chantTodayTotal}
            currentChant={currentChant}
            customMeritText={settings.customMeritText}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
