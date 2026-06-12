'use client';
import { isTauriBuild } from '../web/lib/utils';
/**
 * nfcService.ts
 * Bridges web calls to the Tauri/Kotlin NFC plugin.
 * When running in a browser (non-Tauri) context it falls back to simulation mode.
 */

import type { EpdColorMode } from './types';

declare global {
  interface Window {
    __TAURI_INTERNALS__: any;
    __TAURI__: any;
  }
}



async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriBuild) throw new Error('Not running in Tauri');
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(cmd, args);
}

async function listen(
  event: string,
  cb: (payload: Record<string, unknown>) => void
): Promise<() => void> {
  if (!isTauriBuild) return () => {};
  const { addPluginListener } = await import('@tauri-apps/api/core');
  const unlisten = await addPluginListener('nfc', event, (e: { payload: Record<string, unknown> }) => cb(e.payload));
  return () => unlisten.unregister();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function enableNfc() {
  if (!isTauriBuild) return { supported: false, enabled: false, dispatchError: undefined };
  try {
    return await invoke<{
      supported: boolean;
      enabled: boolean;
      error?: string;
      stackTrace?: string;
      dispatchError?: string;
    }>('plugin:nfc|enableNfc');
  } catch (err: any) {
    // 将调用异常转换为业务错误格式，上层统一处理
    return {
      supported: false,
      enabled: false,
      error: err?.message || 'NFC 启用失败',
      stackTrace: err?.stack,
      dispatchError: undefined,
    };
  }
}

export async function disableNfc() {
  if (!isTauriBuild) return;
  await invoke('plugin:nfc|disableNfc');
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
  if (!isTauriBuild) return { ready: true, message: '模拟模式：可以开始写入（实际设备无操作）' };
  return invoke<{ ready: boolean; message: string }>('plugin:nfc|writeImage', args as unknown as Record<string, unknown>);
}

export type ProgressHandler = (progress: number, message: string) => void;
export type SuccessHandler = (message: string) => void;
export type ErrorHandler = (error: NfcStructuredError) => void;

export interface NfcStructuredError {
  message: string;
  code?: string;
  layer?: 'js' | 'tauri' | 'kotlin' | 'hardware';
  phase?: string;
  detail?: string;
}

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
    cb({
      message: (p['message'] as string) || '未知错误',
      code: p['code'] as string | undefined,
      layer: (p['layer'] as any) || 'kotlin',
      phase: p['phase'] as string | undefined,
      detail: p['detail'] as string | undefined,
    });
  });
}

/**
 * Wraps an NFC invoke call with automatic error tracking.
 * Catches Tauri invoke errors and returns structured error info.
 */
export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
  phase?: string
): Promise<{ data?: T; error?: NfcStructuredError }> {
  try {
    const data = await invoke<T>(cmd, args);
    return { data };
  } catch (err: any) {
    const error: NfcStructuredError = {
      message: err?.message || 'Tauri 调用失败',
      code: err?.code || 'TAURI_INVOKE_FAILED',
      layer: 'tauri',
      phase,
      detail: err?.stack || String(err),
    };
    return { error };
  }
}
