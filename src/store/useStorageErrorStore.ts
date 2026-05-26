import { create } from 'zustand';

interface StorageErrorState {
  message: string | null;
  setMessage: (message: string | null) => void;
  clear: () => void;
}

export const useStorageErrorStore = create<StorageErrorState>((set) => ({
  message: null,
  setMessage: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
