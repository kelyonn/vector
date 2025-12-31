import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. NEW ATTRIBUTES (5 Pillars + Others)
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

export interface VectorState {
  attributes: Record<AttributeType, Attribute>;
  integrity: number;
  energy: number;
  wallet: number;
  tasks: Task[];
  protocols: Task[]; // The "Iron Rules" templates
  lastResetDate: string; // To track 00:00 resets
  evolutionStage: number;

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
}

const INITIAL_ATTRS: Record<AttributeType, Attribute> = {
  strength: { level: 1, currentXP: 0, xpToNextLevel: 100 },
  intellect: { level: 1, currentXP: 0, xpToNextLevel: 100 },
  create:    { level: 1, currentXP: 0, xpToNextLevel: 100 },
  mind:      { level: 1, currentXP: 0, xpToNextLevel: 100 },
  work:      { level: 1, currentXP: 0, xpToNextLevel: 100 },
  others:    { level: 1, currentXP: 0, xpToNextLevel: 100 },
};

// 2. DEFAULT IRON RULES (2.5 XP each)
const DEFAULT_IRON_RULES: Task[] = [
  { id: 'iron-1', text: 'Sleep 6hr+', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-2', text: 'Drink 3L Water', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-3', text: 'Clean Room', type: 'mind', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-4', text: 'Shower / Groom', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
];

export const useVectorStore = create<VectorState>()(
  persist(
    (set, get) => ({
      attributes: INITIAL_ATTRS,
      integrity: 100,
      energy: 100,
      wallet: 0,
      tasks: [...DEFAULT_IRON_RULES], 
      protocols: [...DEFAULT_IRON_RULES],
      lastResetDate: new Date().toDateString(),
      evolutionStage: 1,

      addTask: (text, type, xpValue, isSystem = false) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { id: crypto.randomUUID(), text, type, xpValue, completed: false, isSystem },
          ],
        })),

      addProtocol: (text, type, xpValue) =>
        set((state) => {
            const newProto = { id: crypto.randomUUID(), text, type, xpValue, completed: false, isSystem: true };
            return {
                protocols: [...state.protocols, newProto],
                // Add to current day immediately if added
                tasks: [...state.tasks, newProto]
            };
        }),

      removeProtocol: (id) =>
        set((state) => ({
            protocols: state.protocols.filter(p => p.id !== id),
            tasks: state.tasks.filter(t => t.id !== id) // Remove from active list too
        })),

      toggleTask: (id) =>
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === id);
          if (idx === -1) return state;

          const task = state.tasks[idx];
          const isCompleting = !task.completed;
          let newState = { ...state };

          if (isCompleting) {
            // XP Logic
            const attr = { ...newState.attributes[task.type] };
            attr.currentXP += task.xpValue;
            
            while (attr.currentXP >= attr.xpToNextLevel) {
              attr.currentXP -= attr.xpToNextLevel;
              attr.level++;
              attr.xpToNextLevel = Math.floor(attr.xpToNextLevel * 1.5);
              newState.integrity = Math.min(100, newState.integrity + 5);
              newState.energy = Math.min(100, newState.energy + 5);
            }
            newState.attributes[task.type] = attr;
            newState.energy = Math.max(0, newState.energy - 1); // Small cost
          }

          newState.tasks = [...state.tasks];
          newState.tasks[idx] = { ...task, completed: isCompleting };

          // Evolution
          const totalLevels = Object.values(newState.attributes).reduce((acc, curr) => acc + curr.level, 0);
          newState.evolutionStage = Math.max(1, Math.floor(totalLevels / 5));

          return newState;
        }),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      // 3. AUTO-RESET LOGIC
      checkDailyReset: () => 
        set((state) => {
            const today = new Date().toDateString();
            if (state.lastResetDate !== today) {
                console.log("00:00 DETECTED. RESETTING CYCLE.");
                
                // Calculate Penalty for missed Iron Rules
                const missedIron = state.tasks.filter(t => t.isSystem && !t.completed).length;
                const damage = missedIron * 10;

                // Regenerate Tasks (Keep manual tasks? No, let's clear all for a fresh day, or keep manual? 
                // Usually a fresh day clears everything except Iron Rules which regenerate.)
                const freshIronRules = state.protocols.map(p => ({
                    ...p, 
                    id: crypto.randomUUID(), 
                    completed: false 
                }));

                return {
                    integrity: Math.max(0, state.integrity - damage),
                    energy: 100, // Sleep restores energy
                    tasks: freshIronRules, // Only Iron Rules persist to new day
                    lastResetDate: today
                };
            }
            return state;
        }),

      setIntegrity: (v) => set({ integrity: v }),
      updateWallet: (v) => set((s) => ({ wallet: s.wallet + v })),
      
      processFocusSession: (mins, success, distract) => {
          const s = get();
          if (!success) { set({ integrity: Math.max(0, s.integrity - 5) }); return; }
          
          const penalty = distract * 10;
          const xp = Math.max(0, mins - penalty);
          
          // Focus = Work XP (or Mind?) -> Let's do Work
          const attr = { ...s.attributes.work };
          attr.currentXP += xp;
           while (attr.currentXP >= attr.xpToNextLevel) {
              attr.currentXP -= attr.xpToNextLevel;
              attr.level++;
              attr.xpToNextLevel = Math.floor(attr.xpToNextLevel * 1.5);
            }
          
          set((prev) => ({ 
              attributes: { ...prev.attributes, work: attr } 
          }));
      }
    }),
    { name: 'vector-storage', storage: createJSONStorage(() => localStorage) }
  )
);