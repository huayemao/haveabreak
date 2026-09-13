import { create } from 'zustand';
import { MediaItem, Collection, FrameSettings, MediaType, FrameSubscriptionConfig, DEFAULT_TRANSITION_DURATION } from './types';
import {
  Subscription,
  SubscriptionDiff,
  SyncStrategy,
  SubscriptionValidationResult,
  fetchSubscriptionJson,
  computeCategoryDiff,
  buildSubscriptionDiff,
} from '@haveabreak/utils/lib/utils';
import {
  getStoredMedia,
  getCollections,
  getSettings,
  saveMedia,
  saveCollections,
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
  feedMedia: MediaItem[];
  settings: FrameSettings;
  isLoading: boolean;
  isImporting: boolean;

  // Subscription state
  subscriptionDiff: SubscriptionDiff | null;
  isCheckingSubscription: boolean;
  isCheckingAllSubscriptions: boolean;
  currentCheckingSubscriptionId: string | null;

  // Actions
  loadData: () => Promise<void>;
  generateFeedMedia: () => void;
  addMedia: (url: string, type: MediaType, title?: string, collectionId?: string) => Promise<MediaItem | void>;
  deleteMedia: (id: string) => Promise<void>;
  createCollection: (name: string, description?: string, mediaIds?: string[], slideInterval?: number) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateSettings: (settings: FrameSettings) => void;
  importData: (data: string) => void;
  importUrlList: (urls: string[], type: MediaType, collectionId?: string) => Promise<void>;

  // Subscription Actions
  addSubscription: (name: string, url: string, syncStrategy?: SyncStrategy) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscription: (id: string, enabled: boolean) => void;
  checkSubscription: (subscriptionId: string) => Promise<void>;
  checkAllSubscriptions: () => Promise<void>;
  applySubscriptionDiff: (diff: SubscriptionDiff) => void;
  clearSubscriptionDiff: () => void;
  testSubscriptionUrl: (url: string) => Promise<SubscriptionValidationResult>;
}

export const useFrameStore = create<FrameState>((set, get) => ({
  media: [],
  collections: [],
  feedMedia: [],
  settings: {
    autoPlay: true,
    slideInterval: 5000,
    transitionDuration: DEFAULT_TRANSITION_DURATION,
    showInfo: false,
    shuffle: false,
    filterByOrientation: true,
    backgroundMusicEnabled: false,
    volume: 0.3,
    swipeSwitching: false,
    subscriptions: [],
  },
  isLoading: true,
  isImporting: false,

  subscriptionDiff: null,
  isCheckingSubscription: false,
  isCheckingAllSubscriptions: false,
  currentCheckingSubscriptionId: null,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [media, collections, settings] = await Promise.all([
        getStoredMedia(),
        getCollections(),
        getSettings(),
      ]);
      const defaultSettings: FrameSettings = {
        autoPlay: true,
        slideInterval: 5000,
        transitionDuration: DEFAULT_TRANSITION_DURATION,
        showInfo: false,
        shuffle: false,
        filterByOrientation: true,
        backgroundMusicEnabled: false,
        volume: 0.3,
        swipeSwitching: false,
        subscriptions: [],
      };
      const mergedSettings: FrameSettings = {
        ...defaultSettings,
        ...settings,
        subscriptions: settings.subscriptions || [],
      };
      set({ media, collections, settings: mergedSettings });
      get().generateFeedMedia();
    } catch (error) {
      console.error('Failed to load frame data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  generateFeedMedia: () => {
    const { media } = get();
    const shuffled = [...media];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    set({ feedMedia: shuffled });
  },

  addMedia: async (url, type, title, collectionId) => {
    try {
      const newItem = await storageAddMedia(url, type, title);
      set((state) => ({ 
        media: [...state.media, newItem],
        feedMedia: [...state.feedMedia, newItem],
      }));
      if (collectionId) {
        const collection = get().collections.find(c => c.id === collectionId);
        if (collection && !collection.mediaIds.includes(newItem.id)) {
          await get().updateCollection(collectionId, {
            mediaIds: [...collection.mediaIds, newItem.id]
          });
        }
      }
      return newItem;
    } catch (error) {
      console.error('Failed to add media:', error);
    }
  },

  deleteMedia: async (id) => {
    try {
      await storageDeleteMedia(id);
      set((state) => ({
        media: state.media.filter((m) => m.id !== id),
        feedMedia: state.feedMedia.filter((m) => m.id !== id),
        collections: state.collections.map((col) => ({
          ...col,
          mediaIds: col.mediaIds.filter((mid) => mid !== id),
        })),
      }));
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  },

  createCollection: async (name, description, mediaIds, slideInterval) => {
    try {
      const newCollection = await storageCreateCollection(name, description, mediaIds, slideInterval);
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

  importUrlList: async (urls, type, collectionId) => {
    set({ isImporting: true });
    try {
      const newItems = await storageImportUrlList(urls, type);
      set((state) => ({ 
        media: [...state.media, ...newItems],
        feedMedia: [...state.feedMedia, ...newItems],
      }));
      
      if (collectionId) {
        const collection = get().collections.find(c => c.id === collectionId);
        if (collection) {
          const newMediaIds = newItems
            .map(item => item.id)
            .filter(id => !collection.mediaIds.includes(id));
          
          if (newMediaIds.length > 0) {
            await get().updateCollection(collectionId, {
              mediaIds: [...collection.mediaIds, ...newMediaIds]
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to import media:', error);
    } finally {
      set({ isImporting: false });
    }
  },

  // Subscription Actions
  addSubscription: (name: string, url: string, syncStrategy: SyncStrategy = 'merge') => {
    const state = get();
    const newSubscription: Subscription = {
      id: `sub_frame_${Date.now()}`,
      name,
      url,
      lastCheckTime: 0,
      lastUpdateTime: 0,
      enabled: true,
      syncStrategy,
      status: 'idle',
    };
    const currentSubs = state.settings.subscriptions || [];
    const newSubscriptions = [...currentSubs, newSubscription];
    const newSettings: FrameSettings = {
      ...state.settings,
      subscriptions: newSubscriptions,
    };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateSubscription: (id: string, updates: Partial<Subscription>) => {
    const state = get();
    const currentSubs = state.settings.subscriptions || [];
    const newSubscriptions = currentSubs.map(sub =>
      sub.id === id ? { ...sub, ...updates } : sub
    );
    const newSettings: FrameSettings = {
      ...state.settings,
      subscriptions: newSubscriptions,
    };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  deleteSubscription: (id: string) => {
    const state = get();
    const currentSubs = state.settings.subscriptions || [];
    const newSubscriptions = currentSubs.filter(sub => sub.id !== id);
    const newSettings: FrameSettings = {
      ...state.settings,
      subscriptions: newSubscriptions,
    };
    storageSaveSettings(newSettings);
    set({
      settings: newSettings,
      subscriptionDiff: state.subscriptionDiff?.subscriptionId === id ? null : state.subscriptionDiff,
    });
  },

  toggleSubscription: (id: string, enabled: boolean) => {
    get().updateSubscription(id, { enabled });
  },

  testSubscriptionUrl: async (url: string): Promise<SubscriptionValidationResult> => {
    try {
      const config: FrameSubscriptionConfig = await fetchSubscriptionJson(url);
      const mediaCount = Array.isArray(config.media) ? config.media.length : 0;
      const colCount = Array.isArray(config.collections) ? config.collections.length : 0;

      if (mediaCount === 0 && colCount === 0) {
        return {
          valid: false,
          error: 'JSON loaded, but found no valid "media" or "collections" arrays',
        };
      }

      return {
        valid: true,
        itemCount: mediaCount + colCount,
        summary: `Valid Feed: ${mediaCount} media items, ${colCount} collections`,
        data: config,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Failed to fetch or parse subscription JSON',
      };
    }
  },

  checkSubscription: async (subscriptionId: string) => {
    const state = get();
    const sub = (state.settings.subscriptions || []).find(s => s.id === subscriptionId);
    if (!sub) return;

    set({ isCheckingSubscription: true, currentCheckingSubscriptionId: subscriptionId });
    get().updateSubscription(subscriptionId, { status: 'checking', errorMessage: undefined });

    try {
      const config: FrameSubscriptionConfig = await fetchSubscriptionJson(sub.url);
      const remoteMedia: MediaItem[] = Array.isArray(config.media) ? config.media : [];
      const remoteCollections: Collection[] = Array.isArray(config.collections) ? config.collections : [];

      const mediaDiffs = computeCategoryDiff({
        category: 'media',
        categoryLabel: 'Media',
        localItems: state.media,
        remoteItems: remoteMedia,
        getTitle: (m: MediaItem) => m.title || m.url.split('/').pop()?.split('?')[0] || 'Media Item',
        getSubtitle: (m: MediaItem) => `${m.type} (${m.orientation || 'unknown'})`,
        strategy: sub.syncStrategy || 'merge',
      });

      const collectionDiffs = computeCategoryDiff({
        category: 'collections',
        categoryLabel: 'Collections',
        localItems: state.collections,
        remoteItems: remoteCollections,
        getTitle: (c: Collection) => c.name,
        getSubtitle: (c: Collection) => c.description || `${c.mediaIds?.length || 0} items`,
        strategy: sub.syncStrategy || 'merge',
      });

      const diff = buildSubscriptionDiff(
        sub.id,
        sub.name,
        [...mediaDiffs, ...collectionDiffs],
        config
      );

      const hasChanges = diff.counts.total > 0;
      const status = hasChanges ? 'has_update' : 'up_to_date';

      get().updateSubscription(subscriptionId, {
        lastCheckTime: Date.now(),
        status,
        itemCount: remoteMedia.length + remoteCollections.length,
        errorMessage: undefined,
      });

      set({
        subscriptionDiff: diff,
        isCheckingSubscription: false,
        currentCheckingSubscriptionId: null,
      });
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to check subscription';
      get().updateSubscription(subscriptionId, {
        lastCheckTime: Date.now(),
        status: 'error',
        errorMessage: errorMsg,
      });
      set({
        isCheckingSubscription: false,
        currentCheckingSubscriptionId: null,
      });
    }
  },

  checkAllSubscriptions: async () => {
    const state = get();
    const enabledSubs = (state.settings.subscriptions || []).filter(s => s.enabled);
    if (enabledSubs.length === 0) return;

    set({ isCheckingAllSubscriptions: true });

    for (const sub of enabledSubs) {
      await get().checkSubscription(sub.id);
    }

    set({ isCheckingAllSubscriptions: false });
  },

  applySubscriptionDiff: (diff: SubscriptionDiff) => {
    const state = get();
    if (!diff || diff.items.length === 0) return;

    let newMedia = [...state.media];
    let newCollections = [...state.collections];

    for (const item of diff.items) {
      if (item.category === 'media') {
        const mediaItem = item.data as MediaItem;
        if (item.action === 'add') {
          if (!newMedia.some(m => m.id === mediaItem.id)) {
            newMedia.push(mediaItem);
          }
        } else if (item.action === 'update') {
          newMedia = newMedia.map(m => m.id === mediaItem.id ? mediaItem : m);
        } else if (item.action === 'delete') {
          newMedia = newMedia.filter(m => m.id !== item.id);
          newCollections = newCollections.map(c => ({
            ...c,
            mediaIds: c.mediaIds.filter(mid => mid !== item.id),
          }));
        }
      } else if (item.category === 'collections') {
        const col = item.data as Collection;
        if (item.action === 'add') {
          if (!newCollections.some(c => c.id === col.id)) {
            newCollections.push(col);
          }
        } else if (item.action === 'update') {
          newCollections = newCollections.map(c => c.id === col.id ? col : c);
        } else if (item.action === 'delete') {
          newCollections = newCollections.filter(c => c.id !== item.id);
        }
      }
    }

    get().updateSubscription(diff.subscriptionId, {
      lastUpdateTime: Date.now(),
      status: 'up_to_date',
    });

    saveMedia(newMedia);
    saveCollections(newCollections);

    set({
      media: newMedia,
      collections: newCollections,
      subscriptionDiff: null,
    });

    get().generateFeedMedia();
  },

  clearSubscriptionDiff: () => {
    set({ subscriptionDiff: null });
  },
}));
