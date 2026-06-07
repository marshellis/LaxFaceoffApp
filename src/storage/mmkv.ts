import { createMMKV } from 'react-native-mmkv';
import type { StorageValue } from 'zustand/middleware';

/** Shared MMKV instance for all persisted Zustand stores. */
export const storage = createMMKV({ id: 'lax-faceoff-store' });

/**
 * Zustand `PersistStorage`-compatible adapter backed by MMKV.
 * Generic over the store's state shape so the type parameter can be inferred.
 */
export function createMmkvStorage<T>() {
  return {
    getItem(name: string): StorageValue<T> | null {
      const raw = storage.getString(name);
      if (raw == null) return null;
      return JSON.parse(raw) as StorageValue<T>;
    },
    setItem(name: string, value: StorageValue<T>): void {
      storage.set(name, JSON.stringify(value));
    },
    removeItem(name: string): void {
      storage.remove(name);
    },
  };
}
