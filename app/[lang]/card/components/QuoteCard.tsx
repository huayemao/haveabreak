'use client';

import { QuoteWithBook } from '@/apps/card/types';
import { useRouter } from '@/i18n/routing';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit3, Trash2 } from 'lucide-react';

interface QuoteCardProps {
  card: QuoteWithBook;
  isActive?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isFullscreen?: boolean;
  onClick?: () => void;
}

export default function QuoteCard({ card, isActive, onEdit, onDelete, isFullscreen = false, onClick }: QuoteCardProps) {
  const { content, book, chapter, page } = card;
  const router = useRouter();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && card.id) {
      onEdit(card.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && card.id) {
      onDelete(card.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className={`w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto relative flex flex-col p-5 sm:p-10 rounded-[28px] sm:rounded-[32px] bg-bg-base shadow-extruded overflow-hidden select-none ${isFullscreen ? 'h-full min-h-0' : ''} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-300' : ''}`}
          onClick={onClick}
        >
      {/* Decorative Circles */}
      <div className="absolute top-[-5%] right-[-5%] w-48 h-48 rounded-full bg-bg-base shadow-inset opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-bg-base shadow-extruded-sm opacity-20 pointer-events-none" />

      {/* Book Info Header - Clickable */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/card/library/${book.id}`);
        }}
        className="relative z-10 flex gap-4 mb-8 cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
      >
        <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-extruded-sm">
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-bold text-fg-primary leading-tight mb-1 font-display group-hover:text-accent transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-fg-muted font-medium">
            {book.author} {book.translator ? ` / ${book.translator} 译` : ''}
          </p>
          <div className="mt-2 flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full shadow-inset-sm bg-bg-base/50 text-fg-muted uppercase tracking-wider font-bold">
              {book.publisher}
            </span>
          </div>
        </div>
      </div>

      {/* Quote Content */}
      <div 
        className="relative z-10 flex-1 flex flex-col overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Extended Metadata - Now at top */}
        {(chapter || page) && (
          <div className="mb-4 flex flex-wrap gap-4 text-[10px] font-bold text-accent/70 uppercase tracking-widest font-display">
            {chapter && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                {chapter}
              </div>
            )}
            {page && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                PAGE {page}
              </div>
            )}
          </div>
        )}
        
        <div className={`text-lg sm:text-xl text-fg-primary leading-relaxed font-body ${isFullscreen ? 'line-clamp-[10] sm:line-clamp-[15]' : 'line-clamp-6'}`}>
          {content}
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-sm" />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(108, 99, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onEdit && (
          <ContextMenuItem onClick={handleEdit} className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onDelete && (
          <ContextMenuItem onClick={handleDelete} className="gap-2 text-red-500 focus:text-red-500">
            <Trash2 className="w-4 h-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
