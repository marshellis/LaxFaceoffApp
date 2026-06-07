import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMmkvStorage } from '../storage/mmkv';
import type { PracticeSession } from './historyStats';

export interface HistoryState {
  sessions: PracticeSession[];

  // Actions
  addSession(session: PracticeSession): void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      sessions: [],

      addSession(session: PracticeSession) {
        set((state) => ({ sessions: [...state.sessions, session] }));
      },
    }),
    {
      name: 'history',
      storage: createMmkvStorage<HistoryState>(),
    },
  ),
);
