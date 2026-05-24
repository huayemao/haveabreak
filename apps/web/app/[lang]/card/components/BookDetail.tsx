'use client';

import { useCardStore } from '@/apps/card/store';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'i18n/routing';
import { ArrowLeft, Plus, Quote, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Quote as QuoteType } from '@/apps/card/types';
import QuoteMetadata from './QuoteMetadata';

interface BookDetailProps {
  onAddQuote: () => void;
  onEditQuote?: (quote: QuoteType) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onQuoteClick?: (quote: QuoteType) => void;
  bookId?: string;
  onBack?: () => void;
}

export default function BookDetail({ onAddQuote, onEditQuote, onDeleteQuote, onQuoteClick, bookId, onBack }: BookDetailProps) {
  const { books, quotes: allQuotes, selectedBookId, setView, deleteQuote, deleteBook, settings } = useCardStore();
  const t = useTranslations();
  const router = useRouter();

  const currentBookId = bookId || selectedBookId;
  const book = books.find((b) => b.id === currentBookId);
  const quotes = useMemo(() => {
    const filteredQuotes = currentBookId ? allQuotes.filter(q => q.bookId === currentBookId) : [];
    
    if (settings.quoteSortOrder === 'page') {
      return [...filteredQuotes].sort((a, b) => {
        const aPage = a.page ? parseInt(a.page, 10) : null;
        const bPage = b.page ? parseInt(b.page, 10) : null;
        
        if (aPage === null && bPage === null) {
          return a.createdAt - b.createdAt;
        }
        if (aPage === null) return 1;
        if (bPage === null) return -1;
        return aPage - bPage;
      });
    }
    
    return [...filteredQuotes].sort((a, b) => a.createdAt - b.createdAt);
  }, [allQuotes, currentBookId, settings.quoteSortOrder]);

  if (!book) return null;

  const handleDeleteBook = () => {
    if (confirm(t('card.confirmDeleteBook', { defaultValue: 'Are you sure you want to delete this book and all its quotes?' }))) {
      deleteBook(book.id);
      setView('library');
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (onDeleteQuote) {
      onDeleteQuote(quoteId);
    } else {
      if (confirm(t('card.confirmDeleteQuote', { defaultValue: 'Are you sure you want to delete this quote?' }))) {
        deleteQuote(quoteId);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onBack || (() => setView('library'))}
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

          <div className="mt-8 flex justify-center md:justify-start gap-3">
            <button
              onClick={onAddQuote}
              className="neumorphic-button-primary px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-5 h-5" />
              {t('card.addQuote', { defaultValue: 'Add Quote' })}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="w-10 h-10 rounded-xl neumorphic-button flex items-center justify-center hover:bg-bg-secondary transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-fg-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem onClick={() => router.push(`/card/add-book?bookId=${book.id}`)} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  {t('card.editBook', { defaultValue: 'Edit Book' })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteBook} className="gap-2 text-red-500 focus:text-red-500">
                  <Trash2 className="w-4 h-4" />
                  {t('card.deleteBook', { defaultValue: 'Delete Book' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2 px-2">
          <Quote className="w-5 h-5 text-accent rotate-180" />
          {t('card.quotes', { defaultValue: 'Quotes' })} ({quotes.length})
        </h3>

        {quotes.length === 0 ? (
          <div className="p-8 rounded-[32px] bg-bg-base shadow-inset text-center italic text-fg-muted">
            {t('card.noQuotesInBook', { defaultValue: 'No quotes for this book yet. Add your first one!' })}
          </div>
        ) : (
          <div className="grid gap-6">
            {quotes.map((quote) => (
              <ContextMenu key={quote.id}>
                <ContextMenuTrigger>
                  <div 
                    onClick={() => onQuoteClick?.(quote)}
                    className={`relative bg-bg-base p-6 rounded-[24px] shadow-extruded-sm group transition-all duration-300 ${onQuoteClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-extruded active:scale-[0.99]' : ''}`}
                  >
                    <p className="text-fg-primary leading-relaxed mb-4 text-left text-balance group-hover:text-accent transition-colors font-body">&quot;{quote.content}&quot;</p>
                    <div className="flex items-center justify-between">
                      <QuoteMetadata chapter={quote.chapter} page={quote.page} />
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  {onEditQuote && (
                    <ContextMenuItem onClick={() => onEditQuote(quote)} className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      {t('common.edit', { defaultValue: 'Edit Quote' })}
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleDeleteQuote(quote.id)} className="gap-2 text-red-500 focus:text-red-500">
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete', { defaultValue: 'Delete Quote' })}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
