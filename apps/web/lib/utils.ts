import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

declare global {
  interface Window {
    __TAURI_INTERNALS__: any;
    __TAURI__: any;
  }
}

export const isTauri = typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

export const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === 'true';