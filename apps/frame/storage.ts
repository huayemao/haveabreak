import { MediaItem, Collection, FrameSettings, DEFAULT_SLIDE_INTERVAL, DEFAULT_VOLUME } from './types';
import presets from './presets.json';
const MEDIA_STORAGE_KEY = 'frame_media';
const COLLECTION_STORAGE_KEY = 'frame_collections';
const SETTINGS_STORAGE_KEY = 'frame_settings';

// 不能删除
console.log(presets)

export async function getOrientationFromUrl(url: string, type?: 'image' | 'video'): Promise<'landscape' | 'portrait' | 'square'> {
  return new Promise((resolve) => {
    if (type === 'video' || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const ratio = video.videoWidth / video.videoHeight;
        if (ratio > 1.1) resolve('landscape');
        else if (ratio < 0.9) resolve('portrait');
        else resolve('square');
      };
      video.onerror = () => {
        resolve('landscape');
      };
      video.crossOrigin = 'anonymous';
      video.src = url;
      return;
    }

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio > 1.1) resolve('landscape');
      else if (ratio < 0.9) resolve('portrait');
      else resolve('square');
    };
    img.onerror = () => {
      resolve('landscape');
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function getStoredMedia(): Promise<MediaItem[]> {
  const stored = localStorage.getItem(MEDIA_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const presetMedia: MediaItem[] = (presets.media as MediaItem[]).map((item, index) => ({
    ...item,
    createdAt: Date.now() - (presets.media.length - index) * 1000,
  }));

  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(presetMedia));
  return presetMedia;
}

export function saveMedia(media: MediaItem[]): void {
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
}

export async function addMedia(url: string, type: 'image' | 'video', title?: string): Promise<MediaItem> {
  const media = await getStoredMedia();
  const orientation = await getOrientationFromUrl(url, type);

  const newItem: MediaItem = {
    id: generateId(),
    url,
    type,
    orientation,
    title,
    createdAt: Date.now(),
  };

  media.push(newItem);
  saveMedia(media);
  return newItem;
}

export async function deleteMedia(id: string): Promise<void> {
  const media = (await getStoredMedia()).filter((m) => m.id !== id);
  saveMedia(media);

  const collections = await getCollections();
  collections.forEach((col) => {
    col.mediaIds = col.mediaIds.filter((mid) => mid !== id);
    col.updatedAt = Date.now();
  });
  saveCollections(collections);
}

export async function getCollections(): Promise<Collection[]> {
  const stored = localStorage.getItem(COLLECTION_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const media = await getStoredMedia();

  const defaultCollection: Collection = {
    ...presets.collections[0],
    mediaIds: media.map((m) => m.id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify([defaultCollection]));
  return [defaultCollection];
}

export function saveCollections(collections: Collection[]): void {
  localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collections));
}

export async function createCollection(name: string, description?: string, mediaIds: string[] = []): Promise<Collection> {
  const collections = await getCollections();
  const newCollection: Collection = {
    id: generateId(),
    name,
    description,
    mediaIds,
    slideInterval: DEFAULT_SLIDE_INTERVAL,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<void> {
  const collections = await getCollections();
  const index = collections.findIndex((c) => c.id === id);
  if (index !== -1) {
    collections[index] = { ...collections[index], ...updates, updatedAt: Date.now() };
    saveCollections(collections);
  }
}

export async function deleteCollection(id: string): Promise<void> {
  const collections = (await getCollections()).filter((c) => c.id !== id);
  saveCollections(collections);
}

export async function getSettings(): Promise<FrameSettings> {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }


  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(presets.settings));
  return presets.settings;
}

export function saveSettings(settings: FrameSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export async function exportData(): Promise<string> {
  const media = await getStoredMedia();
  const collections = await getCollections();
  const settings = await getSettings();

  return JSON.stringify({ media, collections, settings }, null, 2);
}

export function importData(data: string): void {
  try {
    const parsed = JSON.parse(data);

    if (parsed.media) {
      saveMedia(parsed.media);
    }
    if (parsed.collections) {
      saveCollections(parsed.collections);
    }
    if (parsed.settings) {
      saveSettings(parsed.settings);
    }
  } catch {
    throw new Error('Invalid data format');
  }
}

export async function importUrlList(urls: string[], type: 'image' | 'video'): Promise<MediaItem[]> {
  const results: MediaItem[] = [];

  for (const url of urls) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) continue;

    try {
      const item = await addMedia(trimmedUrl, type);
      results.push(item);
    } catch {
      continue;
    }
  }

  return results;
}

export async function downloadMedia(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';

    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Download failed'));

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
