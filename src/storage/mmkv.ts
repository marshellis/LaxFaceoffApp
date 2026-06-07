import { Platform } from 'react-native';
import type { StorageValue } from 'zustand/middleware';

/**
 * Minimal key/value backend shared by every persisted Zustand store.
 * On native we back it with react-native-mmkv; on web (where that native
 * module isn't available and throws at import/use) we fall back to
 * localStorage, or an in-memory Map when localStorage is absent.
 */
interface KvBackend {
  getString(name: string): string | undefined;
  set(name: string, value: string): void;
  remove(name: string): void;
}

function createWebBackend(): KvBackend {
  const ls = typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined;
  if (ls) {
    return {
      getString: (name) => ls.getItem(name) ?? undefined,
      set: (name, value) => ls.setItem(name, value),
      remove: (name) => ls.removeItem(name),
    };
  }
  // In-memory fallback (e.g. SSR / no localStorage).
  const map = new Map<string, string>();
  return {
    getString: (name) => map.get(name),
    set: (name, value) => {
      map.set(name, value);
    },
    remove: (name) => {
      map.delete(name);
    },
  };
}

function createNativeBackend(): KvBackend {
  // Imported lazily so the native module is never required on web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv');
  const mmkv = createMMKV({ id: 'lax-faceoff-store' });
  return {
    getString: (name) => mmkv.getString(name),
    set: (name, value) => mmkv.set(name, value),
    remove: (name) => mmkv.remove(name),
  };
}

/** Shared storage backend for all persisted Zustand stores. */
export const storage: KvBackend =
  Platform.OS === 'web' ? createWebBackend() : createNativeBackend();

/**
 * Zustand `PersistStorage`-compatible adapter.
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
