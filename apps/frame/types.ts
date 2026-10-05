import { Subscription } from '@haveabreak/utils/lib/utils';

export type MediaOrientation = 'landscape' | 'portrait' | 'square';

export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  orientation: MediaOrientation;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  mediaIds: string[];
  backgroundMusicUrl?: string;
  slideInterval: number;
  createdAt: number;
  updatedAt: number;
}

export interface FrameSettings {
  autoPlay: boolean;
  slideInterval: number;
  transitionDuration: number;
  showInfo: boolean;
  shuffle: boolean;
  filterByOrientation: boolean;
  backgroundMusicEnabled: boolean;
  volume: number;
  swipeSwitching: boolean;
  subscriptions: Subscription[];
}

export interface FrameSubscriptionConfig {
  media: MediaItem[];
  collections?: Collection[];
  version?: string;
  lastModified?: number;
}

export const DEFAULT_SLIDE_INTERVAL = 5000;
export const DEFAULT_TRANSITION_DURATION = 800;
export const DEFAULT_VOLUME = 0.3;

export const DEFAULT_FRAME_SETTINGS: FrameSettings = {
  autoPlay: true,
  slideInterval: DEFAULT_SLIDE_INTERVAL,
  transitionDuration: DEFAULT_TRANSITION_DURATION,
  showInfo: false,
  shuffle: false,
  filterByOrientation: true,
  backgroundMusicEnabled: false,
  volume: DEFAULT_VOLUME,
  swipeSwitching: true,
  subscriptions: [],
};