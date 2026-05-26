import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { INITIAL_ATTRS, DEFAULT_IRON_RULES } from '@/constants';
import {
  applyCompletionRewards,
  reverseFromLedger,
  reverseCompletionRewards,
  createDaySnapshot,
  migrateExportData,
  migratePersistedState,
  migrateTask,
  parseResetDate,
  addDays,
  toDateString,
  getSnapshotsInRange,
  setLastExportAt,
  taskFromTemplateEntry,
  PERSIST_SCHEMA_VERSION,
  type PersistedGameState,
} from '@/lib/taskStoreHelpers';
import { idbStorage } from '@/lib/persistStorage';
import { useStorageErrorStore } from '@/store/useStorageErrorStore';
import type { ExportData, Goal, Task, TaskTemplate, VectorState } from '@/types';

const MAX_SNAPSHOTS = 365;
const MAX_RESET_ITERATIONS = 365;

type GetState = () => VectorState;

function scheduleNotificationsForTask(get: GetState, task: Task) {
  if (!task.scheduledFor) return;
  import('@/lib/taskScheduler').then(({ scheduleTaskNotification }) => {
    scheduleTaskNotification(task).then((notificationIds) => {
      if (notificationIds) {
        get().updateTask(task.id, { notificationIds });
      }
    });
  });
}

function cancelNotificationsForTask(task: Task) {
  import('@/lib/taskScheduler').then(({ cancelTaskNotifications }) => {
    cancelTaskNotifications(task.notificationIds);
    if (task.notificationId != null && !task.notificationIds) {
      cancelTaskNotifications({ at: task.notificationId });
    }
  });
}

function handleRecurringCompletion(get: GetState, task: Task) {
  if (!task.recurrence || task.recurrence === 'none' || !task.scheduledFor) return;

  import('@/lib/taskScheduler').then(({ getNextScheduledDate }) => {
    const nextDate = getNextScheduledDate(task.scheduledFor!, task.recurrence!);
    if (!nextDate) return;

    get().addTask(
      task.text,
      task.type,
      task.xpValue,
      task.isSystem,
      nextDate,
      task.dueDate,
      task.recurrence,
      task.reminderMinutes,
      task.priority
    );
  });
}

function runOneDayReset(
  state: VectorState,
  snapshotDate: string,
  synthetic: boolean
): Partial<VectorState> {
  const snapshot = createDaySnapshot(state, snapshotDate, synthetic);

  const missedIron = state.tasks.filter((t) => t.isSystem && !t.completed).length;
  const damage = missedIron * 10;

  const freshIronRules: Task[] = state.protocols.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    completed: false,
    completedAt: undefined,
    lastCompletionLedger: undefined,
    createdAt: new Date().toISOString(),
    notificationIds: undefined,
    notificationId: undefined,
  }));

  const regularTasks = state.tasks.filter((t) => !t.isSystem);

  return {
    integrity: Math.max(0, state.integrity - damage),
    protocols: freshIronRules,
    tasks: [...freshIronRules, ...regularTasks],
    snapshots: [snapshot, ...state.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}

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

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        if (scheduledFor) {
          scheduleNotificationsForTask(get, newTask);
        }
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
            tasks: [...state.tasks, newProto],
          };
        }),

      removeProtocol: (id) =>
        set((state) => {
          const protocol = state.protocols.find((p) => p.id === id);
          if (!protocol) return state;

          const isDefault = DEFAULT_IRON_RULES.some((d) => d.text === protocol.text);
          if (isDefault) return state;

          return {
            protocols: state.protocols.filter((p) => p.id !== id),
            tasks: state.tasks.filter((t) => t.id !== id),
          };
        }),

      toggleTask: (id) =>
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === id);
          if (idx === -1) return state;

          const task = state.tasks[idx];
          const isCompleting = !task.completed;
          let slice: Pick<VectorState, 'attributes' | 'integrity' | 'energy' | 'evolutionStage'> = {
            attributes: state.attributes,
            integrity: state.integrity,
            energy: state.energy,
            evolutionStage: state.evolutionStage,
          };

          let ledger = task.lastCompletionLedger;

          if (isCompleting) {
            const result = applyCompletionRewards(
              { ...state, ...slice, tasks: state.tasks, protocols: state.protocols },
              task
            );
            slice = result.state;
            ledger = result.ledger;
          } else if (ledger) {
            slice = reverseFromLedger(
              { ...state, ...slice, tasks: state.tasks, protocols: state.protocols },
              ledger
            );
          } else {
            slice = reverseCompletionRewards(
              { ...state, ...slice, tasks: state.tasks, protocols: state.protocols },
              task
            );
          }

          const updatedTask: Task = {
            ...task,
            completed: isCompleting,
            completedAt: isCompleting ? new Date().toISOString() : undefined,
            lastCompletionLedger: isCompleting ? ledger : undefined,
          };

          const newTasks = [...state.tasks];
          newTasks[idx] = updatedTask;

          if (isCompleting) {
            cancelNotificationsForTask(task);
            setTimeout(() => handleRecurringCompletion(get, task), 0);
          }

          setTimeout(() => get().updateGoalProgress(), 0);

          return {
            ...slice,
            tasks: newTasks,
          };
        }),

      updateTask: (id, updates) => {
        const state = get();
        const idx = state.tasks.findIndex((t) => t.id === id);
        if (idx === -1) return;

        const task = state.tasks[idx];
        const wasCompleted = task.completed;
        const willComplete = updates.completed === true && !wasCompleted;

        if (updates.scheduledFor && !task.scheduledFor) {
          const draft = { ...task, ...updates };
          scheduleNotificationsForTask(get, draft);
        }

        if (updates.completed && wasCompleted === false) {
          cancelNotificationsForTask(task);
          setTimeout(() => handleRecurringCompletion(get, { ...task, ...updates }), 0);
        }

        set((s) => {
          const i = s.tasks.findIndex((t) => t.id === id);
          if (i === -1) return s;
          const newTasks = [...s.tasks];
          let updated = { ...newTasks[i], ...updates };
          if (willComplete) {
            updated = { ...updated, completedAt: new Date().toISOString() };
          }
          newTasks[i] = updated;
          return { tasks: newTasks };
        });
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) cancelNotificationsForTask(task);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      checkDailyReset: () =>
        set((state) => {
          const today = new Date().toDateString();
          if (state.lastResetDate === today) return state;

          let working: VectorState = { ...state };
          let last = parseResetDate(working.lastResetDate);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          let iterations = 0;

          const firstCloseDay = addDays(parseResetDate(working.lastResetDate), 1);
          const willRunMultipleDays =
            working.lastResetDate !== today && firstCloseDay < todayDate;

          while (working.lastResetDate !== today && iterations < MAX_RESET_ITERATIONS) {
            iterations++;
            const closeDay = addDays(last, 1);
            if (closeDay > todayDate) break;
            const snapshotDate = toDateString(addDays(closeDay, -1));
            const synthetic = willRunMultipleDays && closeDay.toDateString() !== today;
            const partial = runOneDayReset(working, snapshotDate, synthetic);
            working = {
              ...working,
              ...partial,
              lastResetDate: closeDay.toDateString(),
            };
            last = closeDay;
          }

          return {
            ...working,
            energy: 100,
            lastResetDate: today,
          };
        }),

      setIntegrity: (v) => set({ integrity: v }),
      updateWallet: (v) => set((s) => ({ wallet: s.wallet + v })),

      processFocusSession: (mins, success, distract) => {
        const s = get();
        if (!success) {
          set({ integrity: Math.max(0, s.integrity - 5) });
          return;
        }

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
          attributes: { ...prev.attributes, work: attr },
        }));

        setTimeout(() => get().updateGoalProgress(), 0);
      },

      exportData: () => {
        const state = get();
        const exportedAt = new Date().toISOString();
        const exportPayload: ExportData = {
          version: '2.0.0',
          exportedAt,
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
          metadata: { appVersion: '2.0.0' },
        };
        const jsonString = JSON.stringify(exportPayload, null, 2);
        setLastExportAt(exportedAt);

        void (async () => {
          const { getSyncStatus, pushToGistDebounced } = await import('@/lib/gistSync');
          const syncStatus = getSyncStatus();
          if (syncStatus.enabled) {
            try {
              await pushToGistDebounced(jsonString);
            } catch (error) {
              console.error('Auto-sync failed:', error);
            }
          }
        })();

        return jsonString;
      },

      importData: (jsonString: string) => {
        try {
          const parsed = migrateExportData(JSON.parse(jsonString) as ExportData);
          const tasks = parsed.data.tasks.map(migrateTask);

          set({
            attributes: parsed.data.attributes,
            integrity: parsed.data.integrity ?? 100,
            energy: parsed.data.energy ?? 100,
            wallet: parsed.data.wallet ?? 0,
            tasks,
            protocols: parsed.data.protocols.map(migrateTask),
            lastResetDate: parsed.data.lastResetDate ?? new Date().toDateString(),
            evolutionStage: parsed.data.evolutionStage ?? 1,
            snapshots: parsed.data.snapshots ?? [],
            goals: parsed.data.goals ?? [],
            templates: parsed.data.templates ?? [],
          });

          if (parsed.exportedAt) setLastExportAt(parsed.exportedAt);

          const now = new Date();
          tasks.forEach((task) => {
            if (task.scheduledFor && !task.completed && new Date(task.scheduledFor) > now) {
              scheduleNotificationsForTask(get, { ...task, notificationIds: undefined, notificationId: undefined });
            }
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
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      },

      updateGoalProgress: () => {
        set((state) => {
          const updatedGoals = state.goals.map((goal) => {
            if (goal.completed) return goal;

            let currentValue = 0;
            const targetValue = goal.targetValue;
            const now = new Date();

            switch (goal.targetType) {
              case 'attribute_level':
                if (goal.attributeType) {
                  currentValue = state.attributes[goal.attributeType]?.level || 0;
                }
                break;
              case 'tasks_completed':
                if (goal.type === 'daily') {
                  currentValue = state.tasks.filter((t) => t.completed).length;
                } else if (goal.type === 'weekly') {
                  const weekStart = new Date(now);
                  weekStart.setDate(now.getDate() - now.getDay());
                  weekStart.setHours(0, 0, 0, 0);
                  const rangeSnaps = getSnapshotsInRange(
                    state.snapshots,
                    weekStart.toISOString(),
                    now.toISOString()
                  );
                  currentValue = rangeSnaps.reduce((sum, s) => sum + s.tasksCompleted, 0);
                } else {
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const rangeSnaps = getSnapshotsInRange(
                    state.snapshots,
                    monthStart.toISOString(),
                    now.toISOString()
                  );
                  currentValue = rangeSnaps.reduce((sum, s) => sum + s.tasksCompleted, 0);
                }
                break;
              case 'integrity':
                currentValue = state.integrity;
                break;
              case 'evolution_stage':
                currentValue = state.evolutionStage;
                break;
            }

            const progress = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;
            const completed = currentValue >= targetValue;
            const completedAt = completed && !goal.completedAt ? new Date().toISOString() : goal.completedAt;

            return { ...goal, progress, completed, completedAt };
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
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      applyTemplate: (templateId) => {
        const state = get();
        const template = state.templates.find((t) => t.id === templateId);
        if (!template) return;

        const newTasks: Task[] = template.tasks.map((task) => taskFromTemplateEntry(task));

        set((s) => ({ tasks: [...s.tasks, ...newTasks] }));
      },
    }),
    {
      name: 'vector-storage',
      version: PERSIST_SCHEMA_VERSION,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persisted: unknown) =>
        migratePersistedState(persisted as PersistedGameState),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Vector persist rehydrate failed (storage may be full):', error);
          useStorageErrorStore.getState().setMessage(
            'Could not load saved data. Export a backup if you have one.'
          );
        }
      },
    }
  )
);
