import { MediaItem, FrameSettings } from '../types';

export const filterMediaByOrientation = (mediaList: MediaItem[], filterByOrientation: boolean): MediaItem[] => {
  if (!filterByOrientation) return mediaList;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const targetOrientation = isMobile ? 'portrait' : 'landscape';
  return mediaList.filter(item => item.orientation === targetOrientation || item.orientation === 'square');
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getFinalIndex = (
  originalMediaList: MediaItem[],
  filteredMediaList: MediaItem[],
  originalIndex: number
): number => {
  const originalMedia = originalMediaList[originalIndex];
  if (!originalMedia) return 0;
  const filteredIndex = filteredMediaList.findIndex(item => item.id === originalMedia.id);
  return filteredIndex >= 0 ? filteredIndex : 0;
};

export type MediaTypeFilter = 'image' | 'video' | 'mixed';

export interface StartSlideshowOptions {
  media: MediaItem[];
  settings: FrameSettings;
  updateUrl: (params: Record<string, string | null>) => void;
  collectionId?: string | null;
  paused?: boolean;
  index?: number;
  collectionMedia?: MediaItem[];
  shuffle?: boolean;
  mediaType?: MediaTypeFilter;
}

export const startSlideshow = ({
  media,
  settings,
  updateUrl,
  collectionId = null,
  paused = false,
  index = 0,
  collectionMedia,
  shuffle,
  mediaType = 'mixed',
}: StartSlideshowOptions) => {
  let targetMedia = collectionMedia || media;
  if (mediaType === 'image') {
    targetMedia = targetMedia.filter((m) => m.type === 'image');
  } else if (mediaType === 'video') {
    targetMedia = targetMedia.filter((m) => m.type === 'video');
  }

  let filtered = filterMediaByOrientation(targetMedia, settings.filterByOrientation);

  const useShuffle = shuffle !== undefined ? shuffle : settings.shuffle;

  let finalIndex = index;
  if (useShuffle && filtered.length > 0) {
    const selectedMedia = filtered[index];
    const shuffled = shuffleArray(filtered);
    if (selectedMedia) {
      const idxInShuffled = shuffled.findIndex((m) => m.id === selectedMedia.id);
      if (idxInShuffled >= 0) {
        const [item] = shuffled.splice(idxInShuffled, 1);
        shuffled.unshift(item);
        finalIndex = 0;
      } else {
        finalIndex = 0;
      }
    } else {
      finalIndex = 0;
    }
    filtered = shuffled;
  } else {
    finalIndex = Math.max(0, Math.min(index, filtered.length - 1));
  }

  updateUrl({
    player: 'true',
    paused: paused ? 'true' : null,
    index: finalIndex > 0 ? finalIndex.toString() : null,
    collection: collectionId,
    mediaType: mediaType !== 'mixed' ? mediaType : null,
  });
};