import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { INITIAL_ATTRS, DEFAULT_IRON_RULES } from '@/constants';
import type { DailySnapshot, ExportData, VectorState } from '@/types';

const MAX_SNAPSHOTS = 365; // Keep last 365 days of history

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
      snapshots: [],

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
                tasks: [...state.tasks, newProto]
            };
        }),

      removeProtocol: (id) =>
        set((state) => ({
            protocols: state.protocols.filter(p => p.id !== id),
            tasks: state.tasks.filter(t => t.id !== id)
        })),

      toggleTask: (id) =>
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === id);
          if (idx === -1) return state;

          const task = state.tasks[idx];
          const isCompleting = !task.completed;
          let newState = { ...state };

          if (isCompleting) {
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
            newState.energy = Math.max(0, newState.energy - 1);
          }

          newState.tasks = [...state.tasks];
          newState.tasks[idx] = { ...task, completed: isCompleting };

          const totalLevels = Object.values(newState.attributes).reduce((acc, curr) => acc + curr.level, 0);
          newState.evolutionStage = Math.max(1, Math.floor(totalLevels / 5));

          return newState;
        }),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      checkDailyReset: () => 
        set((state) => {
            const today = new Date().toDateString();
            if (state.lastResetDate !== today) {
                console.log("00:00 DETECTED. RESETTING CYCLE.");
                
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const snapshotDate = yesterday.toISOString().split('T')[0];
                
                const completedTasks = state.tasks.filter(t => t.completed).length;
                const snapshot: DailySnapshot = {
                  date: snapshotDate,
                  attributes: { ...state.attributes },
                  integrity: state.integrity,
                  energy: state.energy,
                  wallet: state.wallet,
                  tasksCompleted: completedTasks,
                  tasksTotal: state.tasks.length,
                  evolutionStage: state.evolutionStage,
                };

                const updatedSnapshots = [snapshot, ...state.snapshots].slice(0, MAX_SNAPSHOTS);
                
                const missedIron = state.tasks.filter(t => t.isSystem && !t.completed).length;
                const damage = missedIron * 10;

                const freshIronRules = state.protocols.map(p => ({
                    ...p, 
                    id: crypto.randomUUID(), 
                    completed: false 
                }));

                return {
                    integrity: Math.max(0, state.integrity - damage),
                    energy: 100,
                    tasks: freshIronRules,
                    lastResetDate: today,
                    snapshots: updatedSnapshots,
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
      },

      exportData: () => {
        const state = get();
        const exportData: ExportData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          data: {
            attributes: state.attributes,
            integrity: state.integrity,
            energy: state.energy,
            wallet: state.wallet,
            tasks: state.tasks,
            protocols: state.protocols,
            lastResetDate: state.lastResetDate,
            evolutionStage: state.evolutionStage,
            snapshots: state.snapshots,
          },
          metadata: {
            appVersion: '1.0.0',
          },
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: (jsonString: string) => {
        try {
          const parsed: ExportData = JSON.parse(jsonString);
          
          if (!parsed.data || !parsed.data.attributes || !parsed.data.tasks) {
            throw new Error('Invalid data format');
          }

          set({
            attributes: parsed.data.attributes,
            integrity: parsed.data.integrity ?? 100,
            energy: parsed.data.energy ?? 100,
            wallet: parsed.data.wallet ?? 0,
            tasks: parsed.data.tasks,
            protocols: parsed.data.protocols ?? parsed.data.tasks.filter(t => t.isSystem),
            lastResetDate: parsed.data.lastResetDate ?? new Date().toDateString(),
            evolutionStage: parsed.data.evolutionStage ?? 1,
            snapshots: parsed.data.snapshots ?? [],
          });

          return true;
        } catch (error) {
          console.error('Import failed:', error);
          return false;
        }
      },

      resetData: () => {
        set({
          attributes: INITIAL_ATTRS,
          integrity: 100,
          energy: 100,
          wallet: 0,
          tasks: [...DEFAULT_IRON_RULES],
          protocols: [...DEFAULT_IRON_RULES],
          lastResetDate: new Date().toDateString(),
          evolutionStage: 1,
          snapshots: [],
        });
      }
    }),
    { name: 'vector-storage', storage: createJSONStorage(() => localStorage) }
  )
);