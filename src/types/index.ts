export type AttributeType = 'strength' | 'intellect' | 'create' | 'mind' | 'work' | 'others';

export interface Task {
  id: string;
  text: string;
  type: AttributeType;
  completed: boolean;
  xpValue: number;
  isSystem?: boolean; // "Iron Rule" flag
}

export interface Attribute {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
}

export interface DailySnapshot {
  date: string; // ISO date string (YYYY-MM-DD)
  attributes: Record<AttributeType, Attribute>;
  integrity: number;
  energy: number;
  wallet: number;
  tasksCompleted: number;
  tasksTotal: number;
  evolutionStage: number;
}

export interface VectorState {
  attributes: Record<AttributeType, Attribute>;
  integrity: number;
  energy: number;
  wallet: number;
  tasks: Task[];
  protocols: Task[]; // The "Iron Rules" templates
  lastResetDate: string; // To track 00:00 resets
  evolutionStage: number;
  snapshots: DailySnapshot[]; // Historical daily snapshots

  // Actions
  addTask: (text: string, type: AttributeType, xpValue: number, isSystem?: boolean) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  
  // Iron Rules Management
  addProtocol: (text: string, type: AttributeType, xpValue: number) => void;
  removeProtocol: (id: string) => void;
  
  // System
  checkDailyReset: () => void; // The 00:00 logic
  setIntegrity: (val: number) => void;
  processFocusSession: (minutes: number, success: boolean, distractions: number) => void;
  updateWallet: (amount: number) => void;
  
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  resetData: () => void;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  data: Omit<VectorState, 'addTask' | 'toggleTask' | 'deleteTask' | 'addProtocol' | 'removeProtocol' | 'checkDailyReset' | 'setIntegrity' | 'processFocusSession' | 'updateWallet' | 'exportData' | 'importData' | 'resetData'>;
  metadata?: {
    appVersion?: string;
  };
}

export type AchievementType = 
  | 'first_day'
  | 'week_streak'
  | 'month_streak'
  | 'level_10'
  | 'level_25'
  | 'level_50'
  | 'level_100'
  | 'perfectionist'
  | 'task_master'
  | 'evolution_5'
  | 'evolution_10';

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon?: string;
}

export interface Statistics {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  averageIntegrity: number;
  averageEnergy: number;
  totalTasksCompleted: number;
  bestDay?: {
    date: string;
    tasksCompleted: number;
  };
  attributeGrowth: Record<AttributeType, number>; // Total levels gained
}

