
export interface ChantRecord {
  id: string;
  date: string; // ISO String (YYYY-MM-DD)
  item: string;
  count: number;
}

export interface Sutra {
  id: string;
  title: string;
  content: string;
}

export type FeedbackType = 'woodfish' | 'bell' | 'click' | 'none';
export type CounterMode = 'button' | 'manual';

export interface ItemGoal {
  day: number;
  month: number;
  year: number;
  lifetime: number;
}

export interface Vow {
  id: string;
  chant: string;
  period: 'day' | 'month' | 'year' | 'lifetime';
  target: number;
  createdAt: string;
}

export interface UserSettings {
  feedback: FeedbackType;
  vibrate: boolean;
  threshold: number;
  customMeritText: string;
  availableChants: string[];
  counterMode: CounterMode;
  itemGoals: { [chant: string]: ItemGoal };
  vows: Vow[]; // 新增：使用者的發願列表
  sutras: Sutra[];
  statsTabOrder?: string[];
}
