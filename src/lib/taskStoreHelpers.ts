import type {
  Attribute,
  DailySnapshot,
  CompletionLedger,
  ExportData,
  Task,
  VectorState,
} from '@/types';

export type TemplateTaskInput = Omit<Task, 'id' | 'completed'>;

export type StoreSlice = Pick<
  VectorState,
  'attributes' | 'integrity' | 'energy' | 'tasks' | 'protocols' | 'evolutionStage'
>;

export type PersistedGameState = Pick<
  VectorState,
  | 'attributes'
  | 'integrity'
  | 'energy'
  | 'wallet'
  | 'tasks'
  | 'protocols'
  | 'lastResetDate'
  | 'evolutionStage'
  | 'snapshots'
  | 'goals'
  | 'templates'
>;

export const PERSIST_SCHEMA_VERSION = 2;

export function recalcEvolutionStage(attributes: VectorState['attributes']): number {
  const totalLevels = Object.values(attributes).reduce((acc, curr) => acc + curr.level, 0);
  return Math.max(1, Math.floor(totalLevels / 5));
}

export function applyCompletionRewards(
  state: StoreSlice,
  task: Task
): { state: StoreSlice; ledger: CompletionLedger } {
  const startIntegrity = state.integrity;
  const startEnergy = state.energy;
  const attributeBefore: Attribute = { ...state.attributes[task.type] };

  const next = { ...state, attributes: { ...state.attributes } };
  const attr = { ...next.attributes[task.type] };
  attr.currentXP += task.xpValue;

  while (attr.currentXP >= attr.xpToNextLevel) {
    attr.currentXP -= attr.xpToNextLevel;
    attr.level++;
    attr.xpToNextLevel = Math.floor(attr.xpToNextLevel * 1.5);
    next.integrity = Math.min(100, next.integrity + 5);
    next.energy = Math.min(100, next.energy + 5);
  }
  next.attributes[task.type] = attr;
  next.energy = Math.max(0, next.energy - 1);
  next.evolutionStage = recalcEvolutionStage(next.attributes);

  return {
    state: next,
    ledger: {
      integrityDelta: next.integrity - startIntegrity,
      energyDelta: next.energy - startEnergy,
      attributeType: task.type,
      attributeBefore,
    },
  };
}

export function reverseFromLedger(state: StoreSlice, ledger: CompletionLedger): StoreSlice {
  const next = { ...state, attributes: { ...state.attributes } };
  next.integrity = Math.max(0, Math.min(100, next.integrity - ledger.integrityDelta));
  next.energy = Math.max(0, Math.min(100, next.energy - ledger.energyDelta));
  next.attributes[ledger.attributeType] = { ...ledger.attributeBefore };
  next.evolutionStage = recalcEvolutionStage(next.attributes);
  return next;
}

/** Fallback when no ledger exists (legacy completed tasks) */
export function reverseCompletionRewards(state: StoreSlice, task: Task): StoreSlice {
  const next = { ...state, attributes: { ...state.attributes } };
  const attr = { ...next.attributes[task.type] };
  let xpToRemove = task.xpValue;

  while (xpToRemove > 0 && attr.level > 1) {
    if (attr.currentXP >= xpToRemove) {
      attr.currentXP -= xpToRemove;
      xpToRemove = 0;
    } else {
      xpToRemove -= attr.currentXP;
      attr.level--;
      attr.xpToNextLevel = Math.max(1, Math.floor(attr.xpToNextLevel / 1.5));
      attr.currentXP = attr.xpToNextLevel - 1;
    }
  }
  if (xpToRemove > 0) {
    attr.currentXP = Math.max(0, attr.currentXP - xpToRemove);
  }

  next.attributes[task.type] = attr;
  next.energy = Math.min(100, next.energy + 1);
  next.evolutionStage = recalcEvolutionStage(next.attributes);
  return next;
}

export function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseResetDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d;
  return new Date();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function countTasksForSnapshot(tasks: Task[], snapshotDate: string): {
  tasksCompleted: number;
  tasksTotal: number;
} {
  const ironTasks = tasks.filter((t) => t.isSystem);
  const regularTasks = tasks.filter((t) => !t.isSystem);
  const completedOnDay = (t: Task) => {
    if (!t.completed || !t.completedAt) return false;
    return toDateString(new Date(t.completedAt)) === snapshotDate;
  };

  const ironCompleted = ironTasks.filter(completedOnDay).length;
  const regularCompleted = regularTasks.filter(completedOnDay).length;
  const ironTotal = ironTasks.length;
  const regularActive = regularTasks.filter(
    (t) => !t.completed || completedOnDay(t)
  ).length;

  return {
    tasksCompleted: ironCompleted + regularCompleted,
    tasksTotal: ironTotal + regularActive,
  };
}

export function createMissedDaySnapshot(
  state: Pick<VectorState, 'attributes' | 'integrity' | 'energy' | 'wallet' | 'evolutionStage' | 'protocols'>,
  snapshotDate: string
): DailySnapshot {
  return {
    date: snapshotDate,
    attributes: { ...state.attributes },
    integrity: state.integrity,
    energy: state.energy,
    wallet: state.wallet,
    tasksCompleted: 0,
    tasksTotal: state.protocols.length,
    evolutionStage: state.evolutionStage,
    synthetic: true,
  };
}

export function createDaySnapshot(
  state: VectorState,
  snapshotDate: string,
  synthetic: boolean
): DailySnapshot {
  if (synthetic) {
    return createMissedDaySnapshot(state, snapshotDate);
  }
  const { tasksCompleted, tasksTotal } = countTasksForSnapshot(state.tasks, snapshotDate);
  return {
    date: snapshotDate,
    attributes: { ...state.attributes },
    integrity: state.integrity,
    energy: state.energy,
    wallet: state.wallet,
    tasksCompleted,
    tasksTotal,
    evolutionStage: state.evolutionStage,
    synthetic: false,
  };
}

export function getSnapshotsInRange(
  snapshots: DailySnapshot[],
  startIso: string,
  endIso?: string
): DailySnapshot[] {
  const start = startIso.split('T')[0];
  const end = endIso ? endIso.split('T')[0] : toDateString(new Date());
  return snapshots.filter((s) => s.date >= start && s.date <= end);
}

export function migrateTask(task: Task): Task {
  const t = { ...task };
  if (t.notificationIds) return t;
  if (t.notificationId != null) {
    const base = t.notificationId;
    const hasReminder = (t.reminderMinutes ?? 0) > 0;
    t.notificationIds = hasReminder
      ? { reminder: base, at: base + 1 }
      : { at: base + 1 };
    delete t.notificationId;
  }
  return t;
}

function backfillCompletedAt(tasks: Task[], lastResetDate: string): Task[] {
  const fallback =
    parseResetDate(lastResetDate).toISOString() ||
    new Date().toISOString();

  return tasks.map((t) => {
    if (t.completed && !t.completedAt) {
      return { ...t, completedAt: t.createdAt || fallback };
    }
    return t;
  });
}

export function migratePersistedState(state: PersistedGameState): PersistedGameState {
  const tasks = backfillCompletedAt(
    state.tasks.map(migrateTask),
    state.lastResetDate
  );
  const protocols = backfillCompletedAt(
    (state.protocols ?? state.tasks.filter((t) => t.isSystem)).map(migrateTask),
    state.lastResetDate
  );

  return {
    ...state,
    tasks,
    protocols,
    snapshots: (state.snapshots ?? []).map((s) => ({
      ...s,
      synthetic: s.synthetic ?? false,
    })),
    goals: state.goals ?? [],
    templates: state.templates ?? [],
  };
}

export function migrateExportData(parsed: ExportData): ExportData {
  const data = parsed.data;
  if (!data?.attributes || !data?.tasks) {
    throw new Error('Invalid data format');
  }

  const migrated = migratePersistedState({
    attributes: data.attributes,
    integrity: data.integrity ?? 100,
    energy: data.energy ?? 100,
    wallet: data.wallet ?? 0,
    tasks: data.tasks,
    protocols: data.protocols ?? data.tasks.filter((t) => t.isSystem),
    lastResetDate: data.lastResetDate ?? new Date().toDateString(),
    evolutionStage: data.evolutionStage ?? 1,
    snapshots: data.snapshots ?? [],
    goals: data.goals ?? [],
    templates: data.templates ?? [],
  });

  return {
    version: parsed.version || '2.0.0',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    data: migrated,
    metadata: parsed.metadata,
  };
}

export const LAST_EXPORT_KEY = 'vector-last-export-at';

export function setLastExportAt(iso: string) {
  localStorage.setItem(LAST_EXPORT_KEY, iso);
}

export function getLastExportAt(): string | null {
  return localStorage.getItem(LAST_EXPORT_KEY);
}

export function taskFromTemplateEntry(entry: TemplateTaskInput): Task {
  return {
    text: entry.text,
    type: entry.type,
    xpValue: entry.xpValue,
    isSystem: entry.isSystem,
    recurrence: entry.recurrence ?? 'none',
    priority: entry.priority ?? 'medium',
    id: crypto.randomUUID(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}
