'use client';

import { useCardStore } from '@/apps/card/store';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Quote, Trash2 } from 'lucide-react';

export default function BookDetail({ onAddQuote }: { onAddQuote: () => void }) {
  const { books, quotes: allQuotes, selectedBookId, setView, deleteQuote, deleteBook } = useCardStore();
  const t = useTranslations();

  const book = books.find((b) => b.id === selectedBookId);
  const quotes = useMemo(() => 
    selectedBookId ? allQuotes.filter(q => q.bookId === selectedBookId) : [], 
    [allQuotes, selectedBookId]
  );

  if (!book) return null;

  const handleDeleteBook = () => {
    if (confirm(t('card.confirmDeleteBook', { defaultValue: 'Are you sure you want to delete this book and all its quotes?' }))) {
      deleteBook(book.id);
      setView('library');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => setView('library')}
        className="flex items-center gap-2 text-fg-muted hover:text-accent transition-colors mb-8 font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('card.backToLibrary', { defaultValue: 'Back to Library' })}
      </button>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-48 h-64 flex-shrink-0 rounded-[24px] overflow-hidden shadow-extruded mx-auto md:mx-0">
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center md:text-left flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-fg-primary font-display mb-2">{book.title}</h2>
          <p className="text-lg text-fg-muted mb-4">{book.author} {book.translator ? ` / ${book.translator} 译` : ''}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-fg-muted uppercase tracking-widest">
            <span>{book.publisher}</span>
            <span>ISBN: {book.isbn}</span>
          </div>
          
          <div className="mt-8 flex justify-center md:justify-start gap-4">
            <button
              onClick={onAddQuote}
              className="neumorphic-button-primary px-6 py-2 rounded-2xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('card.addQuote', { defaultValue: 'Add Quote' })}
            </button>
            <button
              onClick={handleDeleteBook}
              className="w-10 h-10 rounded-2xl neumorphic-button text-red-500 flex items-center justify-center hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2 px-2">
          <Quote className="w-5 h-5 text-accent" />
          {t('card.quotes', { defaultValue: 'Quotes' })} ({quotes.length})
        </h3>

        {quotes.length === 0 ? (
          <div className="p-8 rounded-[32px] bg-bg-base shadow-inset text-center italic text-fg-muted">
            {t('card.noQuotesInBook', { defaultValue: 'No quotes for this book yet. Add your first one!' })}
          </div>
        ) : (
          <div className="grid gap-6">
            {quotes.map((quote) => (
              <div key={quote.id} className="relative bg-bg-base p-6 rounded-[24px] shadow-extruded-sm group">
                <p className="text-fg-primary leading-relaxed mb-4 italic">"{quote.content}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-[10px] font-bold text-accent/70 uppercase tracking-widest">
                    {quote.chapter && <span>{quote.chapter}</span>}
                    {quote.page && <span>PAGE {quote.page}</span>}
                  </div>
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-fg-muted hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
