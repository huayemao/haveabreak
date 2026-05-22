import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerSettings {
  tipIntervalSeconds: number;
  customTips: string[];
  disabledPresetTips: string[];
  selectedMinutes: number;
}

interface TimerStore {
  // Settings
  settings: TimerSettings;
  
  // Timer state
  isRunning: boolean;
  isInterrupted: boolean;
  isFinished: boolean;
  timeLeft: number;
  
  // Actions for settings
  setTipIntervalSeconds: (seconds: number) => void;
  addCustomTip: (tip: string) => void;
  removeCustomTip: (tip: string) => void;
  togglePresetTip: (tip: string) => void;
  setSelectedMinutes: (minutes: number) => void;
  resetSettings: () => void;
  
  // Actions for timer
  startTimer: () => void;
  stopTimer: () => void;
  interruptTimer: () => void;
  completeTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  tipIntervalSeconds: 10,
  customTips: [],
  disabledPresetTips: [],
  selectedMinutes: 5,
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // Default settings from persisted storage or defaults
      settings: DEFAULT_SETTINGS,
      
      // Timer state (not persisted)
      isRunning: false,
      isInterrupted: false,
      isFinished: false,
      timeLeft: DEFAULT_SETTINGS.selectedMinutes * 60,
      
      // Settings actions
      setTipIntervalSeconds: (seconds) => {
        set((state) => ({
          settings: { ...state.settings, tipIntervalSeconds: seconds },
        }));
      },
      
      addCustomTip: (tip) => {
        if (!tip.trim() || tip.trim().length > 100) return;
        set((state) => ({
          settings: {
            ...state.settings,
            customTips: [...state.settings.customTips, tip.trim()],
          },
        }));
      },
      
      removeCustomTip: (tip) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customTips: state.settings.customTips.filter((t) => t !== tip),
          },
        }));
      },
      
      togglePresetTip: (tip) => {
        set((state) => {
          const disabled = state.settings.disabledPresetTips;
          const newDisabled = disabled.includes(tip)
            ? disabled.filter((t) => t !== tip)
            : [...disabled, tip];
          return {
            settings: { ...state.settings, disabledPresetTips: newDisabled },
          };
        });
      },
      
      setSelectedMinutes: (minutes) => {
        set((state) => ({
          settings: { ...state.settings, selectedMinutes: minutes },
          timeLeft: minutes * 60,
        }));
      },
      
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS, timeLeft: DEFAULT_SETTINGS.selectedMinutes * 60 });
      },
      
      // Timer actions
      startTimer: () => {
        const { settings } = get();
        set({
          isRunning: true,
          isInterrupted: false,
          isFinished: false,
          timeLeft: settings.selectedMinutes * 60,
        });
      },
      
      stopTimer: () => {
        const { settings } = get();
        set({
          isRunning: false,
          isInterrupted: false,
          isFinished: false,
          timeLeft: settings.selectedMinutes * 60,
        });
      },
      
      interruptTimer: () => {
        const { settings } = get();
        set({
          isInterrupted: true,
          isRunning: false,
          timeLeft: settings.selectedMinutes * 60,
        });
        // Auto-resume after 3 seconds
        setTimeout(() => {
          const state = get();
          if (state.isInterrupted) {
            set({ isInterrupted: false, isRunning: true });
          }
        }, 3000);
      },
      
      completeTimer: () => {
        set({
          isRunning: false,
          isFinished: true,
        });
      },
      
      tickTimer: () => {
        set((state) => {
          if (state.timeLeft <= 1) {
            get().completeTimer();
            return { timeLeft: 0 };
          }
          return { timeLeft: state.timeLeft - 1 };
        });
      },
      
      resetTimer: () => {
        const { settings } = get();
        set({
          isRunning: false,
          isInterrupted: false,
          isFinished: false,
          timeLeft: settings.selectedMinutes * 60,
        });
      },
    }),
    {
      name: 'haveabreak-timer-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
