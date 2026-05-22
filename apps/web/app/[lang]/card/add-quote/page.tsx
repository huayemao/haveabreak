'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Quote, Book } from '@/apps/card/types';
import { useCardStore } from '@/apps/card/store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Quote as QuoteIcon, Hash, Bookmark, Type } from 'lucide-react';

export default function AddQuoteModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { addQuote, updateQuote, books, quotes } = useCardStore();
  
  const [content, setContent] = useState('');
  const [bookId, setBookId] = useState('');
  const [chapter, setChapter] = useState('');
  const [page, setPage] = useState('');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    const bookIdParam = searchParams.get('bookId');
    
    if (quoteId) {
      const quote = quotes.find(q => q.id === quoteId);
      if (quote) {
        setEditingQuote(quote);
        setContent(quote.content);
        setBookId(quote.bookId);
        setChapter(quote.chapter || '');
        setPage(quote.page || '');
      }
    } else if (bookIdParam) {
      setBookId(bookIdParam);
    }
  }, [searchParams, quotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !bookId) return;

    if (editingQuote) {
      await updateQuote(editingQuote.id, { content, bookId, chapter: chapter || undefined, page: page || undefined });
    } else {
      await addQuote({ content, bookId, chapter: chapter || undefined, page: page || undefined });
    }

    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const initialBookId = searchParams.get('bookId');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2">
            <QuoteIcon className="w-5 h-5 text-accent rotate-180" />
            {editingQuote ? t('card.editQuote', { defaultValue: 'Edit Quote' }) : t('card.addQuote', { defaultValue: 'Add New Quote' })}
          </h2>
          <button onClick={handleClose} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!initialBookId && !editingQuote && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted">{t('card.selectBook', { defaultValue: 'Select Book' })}</label>
              <select
                required
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary appearance-none"
              >
                <option value="">{t('card.chooseABook', { defaultValue: 'Choose a book...' })}</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-fg-muted flex items-center gap-2 px-1">
              <Type className="w-4 h-4" />
              {t('card.formContent', { defaultValue: 'Quote / Paragraph' })}
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('card.formContentPlaceholder', { defaultValue: 'Write the beautiful sentence or paragraph here...' })}
              className="w-full h-40 p-4 rounded-2xl bg-bg-base shadow-inset focus:shadow-inset-deep outline-none transition-all resize-none text-fg-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted flex items-center gap-2 px-1">
                <Bookmark className="w-4 h-4" />
                {t('card.formChapter', { defaultValue: 'Chapter' })}
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Chapter 1"
                className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted flex items-center gap-2 px-1">
                <Hash className="w-4 h-4" />
                {t('card.formPage', { defaultValue: 'Page' })}
              </label>
              <input
                type="text"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="e.g. 123"
                className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-4 rounded-2xl bg-accent text-white font-bold shadow-extruded-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
              {editingQuote ? t('card.saveQuote', { defaultValue: 'Save Changes' }) : t('card.addQuoteBtn', { defaultValue: 'Add Quote' })}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}