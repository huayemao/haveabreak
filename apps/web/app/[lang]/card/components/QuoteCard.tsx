'use client';

import { QuoteWithBook } from '@/apps/card/types';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit3, Trash2, Quote } from 'lucide-react';
import QuoteMetadata from './QuoteMetadata';

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
  const t = useTranslations();

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
          className={`w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto relative flex flex-col p-5 sm:p-10 rounded-[28px] sm:rounded-[32px]  bg-bg-base shadow-extruded overflow-hidden select-none ${isFullscreen ? 'h-full min-h-0 max-h-[68vh] md:max-h-[70vh]' : 'max-h-[56vh] md:max-h-[60vh]'} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-300' : ''}`}
          onClick={onClick}
        >
      {/* Decorative Circles */}
      <div className="absolute top-[-5%] right-[-5%] w-48 h-48 rounded-full bg-bg-base shadow-inset opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-bg-base shadow-extruded-sm opacity-20 pointer-events-none" />

      {/* Book Info Header - Clickable */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/card/library/detail?bookId=${book.id}`);
        }}
        className="relative z-10 flex gap-4 mb-4 cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
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
            {book.author}{t('card.authorSuffix')}{book.translator ? `${t('card.translatorPrefix')}${book.translator}${t('card.translatorSuffix')}` : ''}
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
        // onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Extended Metadata - Now at top */}
        {(chapter || page) && (
            <QuoteMetadata chapter={chapter} page={page}  className='mb-2'/>
        )}
        
        <div className={`relative ${isFullscreen ? 'overflow-y-auto custom-scrollbar max-h-[50vh] sm:max-h-[55vh]' : 'line-clamp-6'}`}>
          <span  className="absolute top-0 left-0 w-8 h-8   ">
          <Quote className="text-accent/60 rotate-180" />
          </span>
          <p className="text-lg sm:text-xl text-fg-primary leading-relaxed font-body pl-8 sm:pl-10">
            {content}
          </p>
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
            {t('common.edit')}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onDelete && (
          <ContextMenuItem onClick={handleDelete} className="gap-2 text-red-500 focus:text-red-500">
            <Trash2 className="w-4 h-4" />
            {t('common.delete')}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
