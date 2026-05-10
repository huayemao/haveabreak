'use client';

import { QuoteWithBook } from '@/apps/card/types';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useCardStore } from '@/apps/card/store';

interface QuoteCardProps {
  card: QuoteWithBook;
  isActive?: boolean;
}

export default function QuoteCard({ card, isActive }: QuoteCardProps) {
  const { content, book, chapter, page } = card;
  const { setView } = useCardStore();

  return (
    <div className="w-full max-w-lg mx-auto min-h-[500px] max-h-[80vh] relative flex flex-col p-6 sm:p-10 rounded-[32px] bg-bg-base shadow-extruded overflow-hidden select-none">
      {/* Decorative Circles */}
      <div className="absolute top-[-5%] right-[-5%] w-48 h-48 rounded-full bg-bg-base shadow-inset opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-bg-base shadow-extruded-sm opacity-20 pointer-events-none" />

      {/* Book Info Header - Clickable */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setView('detail', book.id);
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

      {/* Quote Content - Scrollable Area */}
      <div 
        className="relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag when scrolling text
      >
        <div className="mb-4 inline-block">
          <div className="w-8 h-1 bg-accent rounded-full opacity-50 mb-4" />
        </div>
        
        <div className="text-lg sm:text-xl text-fg-primary leading-relaxed font-body italic mb-6">
          {content}
        </div>

        {/* Extended Metadata */}
        {(chapter || page) && (
          <div className="mt-auto pt-6 border-t border-fg-muted/10 flex flex-wrap gap-4 text-xs font-bold text-accent/70 uppercase tracking-widest font-display">
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
  );
}
