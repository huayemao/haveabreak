'use client';
/**
 * nfcService.ts
 * Bridges web calls to the Tauri/Kotlin NFC plugin.
 * When running in a browser (non-Tauri) context it falls back to simulation mode.
 */

import type { EpdColorMode } from '@/apps/maoji/types';

declare global {
  interface Window {
    __TAURI_INTERNALS__: any;
    __TAURI__: any;
  }
}

const isTauri = typeof window !== 'undefined' &&
  (window.__TAURI_INTERNALS__ || window.__TAURI__);

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) throw new Error('Not running in Tauri');
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(cmd, args);
}

async function listen(
  event: string,
  cb: (payload: Record<string, unknown>) => void
): Promise<() => void> {
  if (!isTauri) return () => {};
  const { addPluginListener } = await import('@tauri-apps/api/core');
  const unlisten = await addPluginListener('nfc', event, (e: { payload: Record<string, unknown> }) => cb(e.payload));
  return () => unlisten.removeListener();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function enableNfc() {
  if (!isTauri) return { supported: false, enabled: false };
  return invoke<{ supported: boolean; enabled: boolean }>('plugin:nfc|enable_nfc');
}

export async function disableNfc() {
  if (!isTauri) return;
  await invoke('plugin:nfc|disable_nfc');
}

export interface WriteImageArgs {
  epdColor: EpdColorMode;
  epdInch: number;
  initCmd1: string;
  initCmd2: string;
  bwData: number[];
  rwData: number[] | null;
}

export async function prepareWrite(args: WriteImageArgs) {
  if (!isTauri) return { ready: true, message: '模拟模式：可以开始写入（实际设备无操作）' };
  return invoke<{ ready: boolean; message: string }>('plugin:nfc|write_image', args as unknown as Record<string, unknown>);
}

export type ProgressHandler = (progress: number, message: string) => void;
export type SuccessHandler = (message: string) => void;
export type ErrorHandler = (message: string) => void;

export async function onWriteProgress(cb: ProgressHandler): Promise<() => void> {
  return listen('write-progress', (p) => {
    cb(p['progress'] as number, p['message'] as string);
  });
}

export async function onWriteSuccess(cb: SuccessHandler): Promise<() => void> {
  return listen('write-success', (p) => {
    cb(p['message'] as string);
  });
}

export async function onWriteError(cb: ErrorHandler): Promise<() => void> {
  return listen('write-error', (p) => {
    cb(p['message'] as string);
  });
}
