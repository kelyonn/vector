export type AttributeType = 'strength' | 'intellect' | 'create' | 'mind' | 'work' | 'others';

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'weekends';

export interface Task {
  id: string;
  text: string;
  type: AttributeType;
  completed: boolean;
  xpValue: number;
  isSystem?: boolean; // "Iron Rule" flag
  
  // Scheduling
  scheduledFor?: string; // ISO datetime string
  dueDate?: string; // ISO date string
  recurrence?: RecurrencePattern;
  reminderMinutes?: number; // Minutes before scheduled time to remind (e.g., 15, 30, 60)
  notificationId?: number; // ID of scheduled notification
  
  // Metadata
  createdAt: string;
  completedAt?: string;
  priority?: 'low' | 'medium' | 'high';
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
  addTask: (text: string, type: AttributeType, xpValue: number, isSystem?: boolean, scheduledFor?: string, dueDate?: string, recurrence?: RecurrencePattern, reminderMinutes?: number, priority?: 'low' | 'medium' | 'high') => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
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
  
  goals: Goal[];
  templates: TaskTemplate[];
  addGoal: (goal: Omit<Goal, 'id' | 'completed' | 'completedAt' | 'progress'>) => void;
  removeGoal: (id: string) => void;
  updateGoalProgress: () => void;
  addTemplate: (name: string, description: string, tasks: Omit<Task, 'id' | 'completed'>[]) => void;
  removeTemplate: (id: string) => void;
  applyTemplate: (templateId: string) => void;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  data: Omit<VectorState, 'addTask' | 'toggleTask' | 'deleteTask' | 'updateTask' | 'addProtocol' | 'removeProtocol' | 'checkDailyReset' | 'setIntegrity' | 'processFocusSession' | 'updateWallet' | 'exportData' | 'importData' | 'resetData' | 'addGoal' | 'removeGoal' | 'updateGoalProgress' | 'addTemplate' | 'removeTemplate' | 'applyTemplate'>;
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
  attributeGrowth: Record<AttributeType, number>;
}

export type GoalType = 'daily' | 'weekly' | 'monthly';
export type GoalTargetType = 'attribute_level' | 'tasks_completed' | 'integrity' | 'evolution_stage';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  targetType: GoalTargetType;
  targetValue: number;
  attributeType?: AttributeType;
  startDate: string;
  endDate?: string;
  completed: boolean;
  completedAt?: string;
  progress: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Omit<Task, 'id' | 'completed'>[];
  createdAt: string;
}

