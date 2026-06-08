import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeConfig, PracticeType } from '@/src/practice/types';
import { createMmkvStorage } from '@/src/storage/mmkv';
import { DEFAULT_CONFIGS } from './defaults';

export interface CustomSounds {
  down?: string;
  set?: string;
  whistle?: string;
}

export interface SettingsState {
  selectedPracticeType: PracticeType;
  configs: Record<PracticeType, PracticeConfig>;
  customSounds: CustomSounds;

  // Actions
  setSelectedType(type: PracticeType): void;
  updateConfig(type: PracticeType, partial: Partial<PracticeConfig>): void;
  setCustomSound(kind: keyof CustomSounds, uri: string | undefined): void;
}

/** Selector: returns the config for the currently selected practice type. */
export function getCurrentConfig(state: SettingsState): PracticeConfig {
  return state.configs[state.selectedPracticeType];
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPracticeType: 'downSetWhistle',
      configs: {
        downSetWhistle: { ...DEFAULT_CONFIGS.downSetWhistle },
        rapidClamp: { ...DEFAULT_CONFIGS.rapidClamp },
        threeWhistle: { ...DEFAULT_CONFIGS.threeWhistle },
      },
      customSounds: {},

      setSelectedType(type: PracticeType) {
        set({ selectedPracticeType: type });
      },

      updateConfig(type: PracticeType, partial: Partial<PracticeConfig>) {
        set((state) => ({
          configs: {
            ...state.configs,
            [type]: { ...state.configs[type], ...partial },
          },
        }));
      },

      setCustomSound(kind: keyof CustomSounds, uri: string | undefined) {
        set((state) => ({
          customSounds: { ...state.customSounds, [kind]: uri },
        }));
      },
    }),
    {
      name: 'settings',
      storage: createMmkvStorage<SettingsState>(),
    },
  ),
);
