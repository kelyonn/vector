import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { INITIAL_ATTRS, DEFAULT_IRON_RULES } from '@/constants';
import type { DailySnapshot, ExportData, Goal, Task, TaskTemplate, VectorState } from '@/types';

const MAX_SNAPSHOTS = 365;

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
      goals: [],
      templates: [],

      addTask: (text, type, xpValue, isSystem = false, scheduledFor, dueDate, recurrence, reminderMinutes, priority) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          text,
          type,
          xpValue,
          completed: false,
          isSystem,
          scheduledFor,
          dueDate,
          recurrence: recurrence || 'none',
          reminderMinutes,
          priority: priority || 'medium',
          createdAt: new Date().toISOString(),
        };

        if (scheduledFor) {
          import('@/lib/taskScheduler').then(({ scheduleTaskNotification }) => {
            scheduleTaskNotification(newTask).then((notificationId) => {
              if (notificationId) {
                get().updateTask(newTask.id, { notificationId });
              }
            });
          });
        }

        return set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      addProtocol: (text, type, xpValue) =>
        set((state) => {
            const newProto: Task = { 
              id: crypto.randomUUID(), 
              text, 
              type, 
              xpValue, 
              completed: false, 
              isSystem: true,
              createdAt: new Date().toISOString(),
              priority: 'medium',
              recurrence: 'none',
            };
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

          setTimeout(() => {
            get().updateGoalProgress();
          }, 0);

          return newState;
        }),

      updateTask: (id, updates) =>
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === id);
          if (idx === -1) return state;

          const task = state.tasks[idx];
          const updatedTask = { ...task, ...updates };

          if (updates.scheduledFor && !task.scheduledFor) {
            import('@/lib/taskScheduler').then(({ scheduleTaskNotification }) => {
              scheduleTaskNotification(updatedTask).then((notificationId) => {
                if (notificationId) {
                  get().updateTask(id, { notificationId });
                }
              });
            });
          }

          if (updates.completed && task.notificationId) {
            import('@/lib/taskScheduler').then(({ cancelTaskNotification }) => {
              cancelTaskNotification(task.notificationId!);
            });
          }

          if (updates.completed && task.recurrence && task.recurrence !== 'none' && task.scheduledFor) {
            import('@/lib/taskScheduler').then(({ getNextScheduledDate }) => {
              const nextDate = getNextScheduledDate(task.scheduledFor!, task.recurrence!);
              if (nextDate) {
                const newTask: Task = {
                  ...updatedTask,
                  id: crypto.randomUUID(),
                  completed: false,
                  scheduledFor: nextDate,
                  createdAt: new Date().toISOString(),
                  notificationId: undefined,
                };
                get().addTask(
                  newTask.text,
                  newTask.type,
                  newTask.xpValue,
                  newTask.isSystem,
                  newTask.scheduledFor,
                  newTask.dueDate,
                  newTask.recurrence,
                  newTask.reminderMinutes,
                  newTask.priority
                );
              }
            });
          }

          const newTasks = [...state.tasks];
          newTasks[idx] = updatedTask;
          return { tasks: newTasks };
        }),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      checkDailyReset: () => 
        set((state) => {
            const today = new Date().toDateString();
            if (state.lastResetDate !== today) {
                
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

                const freshIronRules: Task[] = state.protocols.map(p => ({
                    ...p, 
                    id: crypto.randomUUID(), 
                    completed: false,
                    createdAt: new Date().toISOString(),
                }));

                // Preserve all non-system tasks (both completed and incomplete)
                const regularTasks = state.tasks.filter(t => !t.isSystem);

                return {
                    integrity: Math.max(0, state.integrity - damage),
                    energy: 100,
                    tasks: [...freshIronRules, ...regularTasks],
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
          
          setTimeout(() => {
            get().updateGoalProgress();
          }, 0);
      },

      exportData: () => {
        const state = get();
        const exportData: ExportData = {
          version: '2.0.0',
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
            goals: state.goals,
            templates: state.templates,
          },
          metadata: {
            appVersion: '2.0.0',
          },
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        
        setTimeout(async () => {
          const { getSyncStatus, pushToGist } = await import('@/lib/gistSync');
          const syncStatus = getSyncStatus();
          if (syncStatus.enabled && !syncStatus.syncing) {
            try {
              await pushToGist(jsonString);
            } catch (error) {
              console.error('Auto-sync failed:', error);
            }
          }
        }, 1000);
        
        return jsonString;
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
            goals: parsed.data.goals ?? [],
            templates: parsed.data.templates ?? [],
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
          goals: [],
          templates: [],
        });
      },

      addGoal: (goalData) => {
        const goal: Goal = {
          id: crypto.randomUUID(),
          ...goalData,
          completed: false,
          progress: 0,
        };
        set((state) => ({ goals: [...state.goals, goal] }));
      },

      removeGoal: (id) => {
        set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
      },

      updateGoalProgress: () => {
        set((state) => {
          const updatedGoals = state.goals.map(goal => {
            if (goal.completed) return goal;

            let currentValue = 0;
            let targetValue = goal.targetValue;

            switch (goal.targetType) {
              case 'attribute_level':
                if (goal.attributeType) {
                  currentValue = state.attributes[goal.attributeType]?.level || 0;
                }
                break;
              case 'tasks_completed':
                if (goal.type === 'daily') {
                  currentValue = state.tasks.filter(t => t.completed).length;
                } else {
                  currentValue = state.snapshots.reduce((sum, s) => sum + s.tasksCompleted, 0);
                }
                break;
              case 'integrity':
                currentValue = state.integrity;
                break;
              case 'evolution_stage':
                currentValue = state.evolutionStage;
                break;
            }

            const progress = Math.min(100, (currentValue / targetValue) * 100);
            const completed = currentValue >= targetValue;
            const completedAt = completed && !goal.completedAt ? new Date().toISOString() : goal.completedAt;

            return {
              ...goal,
              progress,
              completed,
              completedAt,
            };
          });

          return { goals: updatedGoals };
        });
      },

      addTemplate: (name, description, tasks) => {
        const template: TaskTemplate = {
          id: crypto.randomUUID(),
          name,
          description,
          tasks,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
      },

      removeTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter(t => t.id !== id) }));
      },

      applyTemplate: (templateId) => {
        const state = get();
        const template = state.templates.find(t => t.id === templateId);
        if (!template) return;

        const newTasks = template.tasks.map(task => ({
          ...task,
          id: crypto.randomUUID(),
          completed: false,
        }));

        set((s) => ({ tasks: [...s.tasks, ...newTasks] }));
      }
    }),
    { name: 'vector-storage', storage: createJSONStorage(() => localStorage) }
  )
);