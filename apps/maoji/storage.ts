'use client';
import { Design, MaojiSettings, EpdColorMode } from './types';

const DESIGNS_KEY = 'maoji_designs';
const SETTINGS_KEY = 'maoji_settings';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): MaojiSettings {
  if (typeof window === 'undefined') return defaultSettings();
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    if (s) return { ...defaultSettings(), ...JSON.parse(s) };
  } catch {}
  return defaultSettings();
}

export function saveSettings(s: MaojiSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function defaultSettings(): MaojiSettings {
  return { lastEpdInch: 213, lastEpdColor: 2, useDithering: true };
}

// ─── Designs ─────────────────────────────────────────────────────────────────

export function getDesigns(): Design[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(DESIGNS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveDesign(d: Design): Design {
  const all = getDesigns();
  const idx = all.findIndex(x => x.id === d.id);
  const updated = { ...d, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(all));
  return updated;
}

export function createDesign(epdInch: number, epdColor: EpdColorMode): Design {
  return {
    id: generateId(),
    name: `新设计 ${new Date().toLocaleDateString('zh')}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    epdInch,
    epdColor,
    elements: [],
  };
}

export function deleteDesign(id: string): void {
  const all = getDesigns().filter(d => d.id !== id);
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(all));
}
