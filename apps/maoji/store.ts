import { create } from 'zustand';
import {
  Design, DesignElement, EpdColorMode, MaojiSettings, NfcState
} from './types';
import {
  getDesigns, saveDesign, createDesign, deleteDesign,
  getSettings, saveSettings,
} from './storage';

interface MaojiStore {
  // ── Data ──────────────────────────────────────────────────────────────────
  designs: Design[];
  currentDesign: Design | null;
  settings: MaojiSettings;
  selectedElementId: string | null;
  nfc: NfcState;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  loadData: () => void;

  // ── Design CRUD ───────────────────────────────────────────────────────────
  newDesign: (epdInch: number, epdColor: EpdColorMode) => void;
  openDesign: (id: string) => void;
  saveCurrentDesign: () => void;
  removeDesign: (id: string) => void;
  renameDesign: (name: string) => void;

  // ── Canvas ────────────────────────────────────────────────────────────────
  addElement: (el: DesignElement) => void;
  updateElement: (id: string, patch: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setDesignProperty: <K extends keyof Design>(key: K, value: Design[K]) => void;

  // ── Settings ─────────────────────────────────────────────────────────────
  updateSettings: (patch: Partial<MaojiSettings>) => void;

  // ── NFC ───────────────────────────────────────────────────────────────────
  setNfc: (patch: Partial<NfcState>) => void;
  resetNfc: () => void;
}

const idleNfc: NfcState = { status: 'idle', progress: 0, message: '' };

export const useMaojiStore = create<MaojiStore>((set, get) => ({
  designs: [],
  currentDesign: null,
  settings: getSettings(),
  selectedElementId: null,
  nfc: idleNfc,

  loadData() {
    const designs = getDesigns();
    const settings = getSettings();
    set({ designs, settings });
  },

  newDesign(epdInch, epdColor) {
    const d = createDesign(epdInch, epdColor);
    const saved = saveDesign(d);
    set(s => ({
      designs: [saved, ...s.designs],
      currentDesign: saved,
      selectedElementId: null,
    }));
  },

  openDesign(id) {
    const d = get().designs.find(x => x.id === id);
    if (d) set({ currentDesign: { ...d }, selectedElementId: null });
  },

  saveCurrentDesign() {
    const d = get().currentDesign;
    if (!d) return;
    const saved = saveDesign(d);
    set(s => ({
      currentDesign: saved,
      designs: s.designs.map(x => x.id === saved.id ? saved : x),
    }));
  },

  removeDesign(id) {
    deleteDesign(id);
    set(s => ({
      designs: s.designs.filter(x => x.id !== id),
      currentDesign: s.currentDesign?.id === id ? null : s.currentDesign,
    }));
  },

  renameDesign(name) {
    set(s => ({
      currentDesign: s.currentDesign ? { ...s.currentDesign, name } : null,
    }));
    get().saveCurrentDesign();
  },

  addElement(el) {
    set(s => {
      if (!s.currentDesign) return {};
      return {
        currentDesign: {
          ...s.currentDesign,
          elements: [...s.currentDesign.elements, el],
        },
        selectedElementId: el.id,
      };
    });
    get().saveCurrentDesign();
  },

  updateElement(id, patch) {
    set(s => {
      if (!s.currentDesign) return {};
      return {
        currentDesign: {
          ...s.currentDesign,
          elements: s.currentDesign.elements.map(el =>
            el.id === id ? { ...el, ...patch } as DesignElement : el
          ),
        },
      };
    });
    get().saveCurrentDesign();
  },

  removeElement(id) {
    set(s => {
      if (!s.currentDesign) return {};
      return {
        currentDesign: {
          ...s.currentDesign,
          elements: s.currentDesign.elements.filter(el => el.id !== id),
        },
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
      };
    });
    get().saveCurrentDesign();
  },

  selectElement(id) {
    set({ selectedElementId: id });
  },

  setDesignProperty(key, value) {
    set(s => ({
      currentDesign: s.currentDesign ? { ...s.currentDesign, [key]: value } : null,
    }));
    get().saveCurrentDesign();
  },

  updateSettings(patch) {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },

  setNfc(patch) {
    set(s => ({ nfc: { ...s.nfc, ...patch } }));
  },

  resetNfc() {
    set({ nfc: idleNfc });
  },
}));
