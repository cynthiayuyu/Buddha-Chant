import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ChantRecord, UserSettings } from './types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8vubeXg1j8XrkaHp9yjqdsdVxqOOOXjQ",
  authDomain: "buddha-chant-counter.firebaseapp.com",
  projectId: "buddha-chant-counter",
  storageBucket: "buddha-chant-counter.firebasestorage.app",
  messagingSenderId: "295517826410",
  appId: "1:295517826410:web:63e1a361d16d4af0b44913"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Anonymous sign in
export const signInAnonymouslyUser = async (): Promise<User | null> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous sign in failed:', error);
    return null;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Cloud backup data structure
interface CloudBackupData {
  records: ChantRecord[];
  settings: UserSettings;
  lastUpdated: ReturnType<typeof serverTimestamp>;
  deviceInfo?: string;
}

// Save data to cloud
export const saveToCloud = async (
  userId: string,
  records: ChantRecord[],
  settings: UserSettings
): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const data: CloudBackupData = {
      records,
      settings,
      lastUpdated: serverTimestamp(),
      deviceInfo: navigator.userAgent
    };
    await setDoc(userDocRef, data);
    return true;
  } catch (error) {
    console.error('Save to cloud failed:', error);
    return false;
  }
};

// Load data from cloud
export const loadFromCloud = async (
  userId: string
): Promise<{ records: ChantRecord[]; settings: UserSettings; lastUpdated: Date | null } | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CloudBackupData;
      return {
        records: data.records || [],
        settings: data.settings,
        lastUpdated: data.lastUpdated ? (data.lastUpdated as any).toDate() : null
      };
    }
    return null;
  } catch (error) {
    console.error('Load from cloud failed:', error);
    return null;
  }
};

// Get last sync time
export const getLastSyncTime = async (userId: string): Promise<Date | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.lastUpdated ? (data.lastUpdated as any).toDate() : null;
    }
    return null;
  } catch (error) {
    console.error('Get last sync time failed:', error);
    return null;
  }
};

// Load data from cloud using recovery code (any user ID)
export const loadFromCloudByRecoveryCode = async (
  recoveryCode: string
): Promise<{ records: ChantRecord[]; settings: UserSettings; lastUpdated: Date | null } | null> => {
  try {
    // 清理恢復碼（移除空格等）
    const cleanCode = recoveryCode.trim();
    if (!cleanCode) return null;

    const userDocRef = doc(db, 'users', cleanCode);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CloudBackupData;
      return {
        records: data.records || [],
        settings: data.settings,
        lastUpdated: data.lastUpdated ? (data.lastUpdated as any).toDate() : null
      };
    }
    return null;
  } catch (error) {
    console.error('Load from cloud by recovery code failed:', error);
    return null;
  }
};
