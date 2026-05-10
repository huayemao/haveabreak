'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCardStore, selectQuotesWithBooks } from '@/apps/card/store';
import { Quote } from '@/apps/card/types';
import QuoteCard from './components/QuoteCard';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Plus, Library, Sparkles, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import Link from 'next/link';

export default function CardPageClient() {
  const {
    books,
    quotes,
    deleteQuote,
  } = useCardStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const t = useTranslations();

  const quotesWithBooks = useMemo(() => selectQuotesWithBooks({ books, quotes } as any), [books, quotes]);

  const handleNext = useCallback(() => {
    if (currentIndex < quotesWithBooks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, quotesWithBooks.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(quotesWithBooks.length - 1);
    }
  }, [currentIndex, quotesWithBooks.length]);

  const onDragEnd = (event: any, info: any) => {
    const threshold = 80;
    if (info.offset.y < -threshold) {
      handleNext();
    } else if (info.offset.y > threshold) {
      handlePrev();
    }
  };

  const handleEditQuote = useCallback((quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      window.location.href = `/card/(modals)/add-quote?quoteId=${quote.id}`;
    }
  }, [quotes]);

  const handleDeleteQuote = useCallback((quoteId: string) => {
    if (confirm(t('card.confirmDeleteQuote', { defaultValue: 'Are you sure you want to delete this quote?' }))) {
      deleteQuote(quoteId);
    }
  }, [deleteQuote, t]);

  if (quotesWithBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-12 rounded-[32px] bg-bg-base shadow-extruded text-center max-w-md">
          <Sparkles className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
          <p className="text-fg-muted mb-8">{t('card.noQuotesInFeed', { defaultValue: 'No sentences in your feed. Add some books and quotes first!' })}</p>
          <Link
            href="/card/(modals)/add-book"
            className="neumorphic-button-primary px-8 py-3 rounded-2xl flex items-center gap-2 mx-auto font-bold"
          >
            <Plus className="w-5 h-5" />
            {t('card.getStarted', { defaultValue: 'Get Started' })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center px-4">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-fg-primary font-display mb-2">{t('card.pageTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('card.pageSubtitle')}</p>
      </div>

      <div className="relative w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={quotesWithBooks[currentIndex]?.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
            className="w-full z-10"
          >
            <QuoteCard
              card={quotesWithBooks[currentIndex]}
              isActive={true}
              onEdit={handleEditQuote}
              onDelete={handleDeleteQuote}
            />
          </motion.div>
        </AnimatePresence>

        {/* Quick Navigation Buttons (Side) */}
        <div className="absolute right-[-10px] sm:right-[-60px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
          <button onClick={handlePrev} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <ChevronUp className="w-5 h-5" />
          </button>
          <button onClick={handleNext} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="mt-8 flex gap-2 flex-wrap justify-center max-w-xs">
        {quotesWithBooks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-fg-muted/20 hover:bg-fg-muted/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}