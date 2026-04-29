"use client";
import { MediaItem } from '../types';
import { Dictionary } from '@/dictionaries';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash2, Play } from 'lucide-react';
import MediaThumbnail from './MediaThumbnail';

interface MediaCardProps {
  item: MediaItem;
  index: number;
  selectedId: string | null;
  onSelect: (item: MediaItem, index: number) => void;
  onDelete: (id: string) => void;
  onPlay?: (paused: boolean, startIndex?: number) => void;
  dict: Dictionary;
}

export default function MediaCard({
  item,
  index,
  selectedId,
  onSelect,
  onDelete,
  onPlay,
  dict,
}: MediaCardProps) {
  const getOrientationLabel = (orientation: string) => {
    switch (orientation) {
      case 'landscape':
        return dict.frame.landscape;
      case 'portrait':
        return dict.frame.portrait;
      case 'square':
        return dict.frame.square;
      default:
        return '';
    }
  };

  return (
    <ContextMenu key={item.id}>
      <ContextMenuTrigger>
        <div
          className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            selectedId === item.id ? 'ring-2 ring-accent ring-offset-2' : ''
          }`}
          onClick={() => onSelect(item, index)}
        >
          <MediaThumbnail item={item} className="bg-muted overflow-hidden" showPlayIcon={false} />

          <div className="absolute inset-0 bg-black/10">
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {item.title && (
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
              )}
              <div className="flex gap-1 mt-1">
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
                  {item.type === 'image' ? dict.frame.image : dict.frame.video}
                </span>
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
                  {getOrientationLabel(item.orientation)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onPlay && (
          <ContextMenuItem
            onClick={() => onPlay(true, index)}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {dict.frame.slideshow}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(item.id)}
          className="gap-2 text-red-500 focus:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
          {dict.frame.delete}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}