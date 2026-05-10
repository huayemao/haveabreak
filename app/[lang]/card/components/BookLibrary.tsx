'use client';

import { useCardStore } from '@/apps/card/store';
import { useTranslations } from 'next-intl';
import { Plus, Book as BookIcon, ChevronRight } from 'lucide-react';

export default function BookLibrary({ onAddBook }: { onAddBook: () => void }) {
  const { books, setView } = useCardStore();
  const t = useTranslations();

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-fg-primary font-display">{t('card.library', { defaultValue: 'My Library' })}</h2>
        <button
          onClick={onAddBook}
          className="neumorphic-button flex items-center gap-2 px-4 py-2 rounded-2xl text-accent font-bold hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('card.addBook', { defaultValue: 'Add Book' })}
        </button>
      </div>

      {books.length === 0 ? (
        <div className="p-12 rounded-[32px] bg-bg-base shadow-extruded text-center">
          <BookIcon className="w-16 h-16 text-fg-muted/20 mx-auto mb-4" />
          <p className="text-fg-muted">{t('card.noBooks', { defaultValue: 'No books in your library yet.' })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => setView('detail', book.id)}
              className="group relative bg-bg-base rounded-[32px] p-6 shadow-extruded hover:shadow-extruded-lg transition-all duration-300 cursor-pointer flex flex-col items-center"
            >
              <div className="relative w-32 h-44 mb-4 rounded-xl overflow-hidden shadow-extruded-sm group-hover:scale-105 transition-transform duration-500">
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold text-fg-primary text-center line-clamp-1 mb-1">{book.title}</h3>
              <p className="text-xs text-fg-muted text-center line-clamp-1">{book.author}</p>
              
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                VIEW DETAILS <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
