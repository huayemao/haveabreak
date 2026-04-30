import { create } from 'zustand';
import { MediaItem, Collection, FrameSettings, MediaType } from './types';
import {
  getStoredMedia,
  getCollections,
  getSettings,
  addMedia as storageAddMedia,
  deleteMedia as storageDeleteMedia,
  createCollection as storageCreateCollection,
  updateCollection as storageUpdateCollection,
  deleteCollection as storageDeleteCollection,
  saveSettings as storageSaveSettings,
  importData as storageImportData,
  importUrlList as storageImportUrlList,
} from './storage';

interface FrameState {
  media: MediaItem[];
  collections: Collection[];
  settings: FrameSettings;
  isLoading: boolean;
  isImporting: boolean;

  // Actions
  loadData: () => Promise<void>;
  addMedia: (url: string, type: MediaType, title?: string) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  createCollection: (name: string, description?: string, mediaIds?: string[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateSettings: (settings: FrameSettings) => void;
  importData: (data: string) => void;
  importUrlList: (urls: string[], type: MediaType) => Promise<void>;
}

export const useFrameStore = create<FrameState>((set, get) => ({
  media: [],
  collections: [],
  settings: {
    autoPlay: true,
    slideInterval: 5000,
    showInfo: false,
    shuffle: false,
    filterByOrientation: true,
    backgroundMusicEnabled: false,
    volume: 0.3,
  },
  isLoading: true,
  isImporting: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [media, collections, settings] = await Promise.all([
        getStoredMedia(),
        getCollections(),
        getSettings(),
      ]);
      set({ media, collections, settings });
    } catch (error) {
      console.error('Failed to load frame data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMedia: async (url, type, title) => {
    try {
      const newItem = await storageAddMedia(url, type, title);
      set((state) => ({ media: [...state.media, newItem] }));
    } catch (error) {
      console.error('Failed to add media:', error);
    }
  },

  deleteMedia: async (id) => {
    try {
      await storageDeleteMedia(id);
      set((state) => ({
        media: state.media.filter((m) => m.id !== id),
        collections: state.collections.map((col) => ({
          ...col,
          mediaIds: col.mediaIds.filter((mid) => mid !== id),
        })),
      }));
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  },

  createCollection: async (name, description, mediaIds) => {
    try {
      const newCollection = await storageCreateCollection(name, description, mediaIds);
      set((state) => ({ collections: [...state.collections, newCollection] }));
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  },

  updateCollection: async (id, updates) => {
    try {
      await storageUpdateCollection(id, updates);
      set((state) => ({
        collections: state.collections.map((col) =>
          col.id === id ? { ...col, ...updates, updatedAt: Date.now() } : col
        ),
      }));
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  },

  deleteCollection: async (id) => {
    try {
      await storageDeleteCollection(id);
      set((state) => ({
        collections: state.collections.filter((col) => col.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  },

  updateSettings: (settings) => {
    storageSaveSettings(settings);
    set({ settings });
  },

  importData: (data) => {
    storageImportData(data);
    get().loadData();
  },

  importUrlList: async (urls, type) => {
    set({ isImporting: true });
    try {
      const newItems = await storageImportUrlList(urls, type);
      set((state) => ({ media: [...state.media, ...newItems] }));
    } catch (error) {
      console.error('Failed to import media:', error);
    } finally {
      set({ isImporting: false });
    }
  },
}));
