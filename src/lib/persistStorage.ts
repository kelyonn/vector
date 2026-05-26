import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const STORAGE_KEY = 'vector-storage';
const LEGACY_LS_KEY = 'vector-storage';
const MIGRATED_FLAG = 'vector-migrated-to-idb';

let storageErrorCallback: ((message: string) => void) | null = null;

export function onStorageError(cb: (message: string) => void) {
  storageErrorCallback = cb;
}

function notifyStorageError(message: string) {
  storageErrorCallback?.(message);
}

async function migrateFromLocalStorage(): Promise<string | null> {
  if (localStorage.getItem(MIGRATED_FLAG)) return null;

  const legacy = localStorage.getItem(LEGACY_LS_KEY);
  if (!legacy) {
    localStorage.setItem(MIGRATED_FLAG, '1');
    return null;
  }

  try {
    await set(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_LS_KEY);
    localStorage.setItem(MIGRATED_FLAG, '1');
    return legacy;
  } catch (e) {
    console.error('IndexedDB migration from localStorage failed:', e);
    notifyStorageError('Could not migrate data to IndexedDB. Export your backup.');
    return legacy;
  }
}

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      let value = (await get(name)) as string | undefined;
      if (value == null && name === STORAGE_KEY) {
        value = (await migrateFromLocalStorage()) ?? undefined;
      }
      return value ?? null;
    } catch (e) {
      console.error('idbStorage getItem failed:', e);
      const fallback = localStorage.getItem(LEGACY_LS_KEY);
      return fallback;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e) {
      console.error('idbStorage setItem failed:', e);
      notifyStorageError('Storage is full. Export your data from Settings immediately.');
      throw e;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
