'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'i18n/routing';
import { useCardStore, selectQuotesWithBooks } from '@/apps/card/store';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronUp, ChevronDown, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import QuoteCard from '../../components/QuoteCard';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useAutoPlay } from '@/hooks/useAutoPlay';

function FullscreenQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId') || '';
  const containerRef = useRef<HTMLDivElement>(null);
  const { books, quotes, deleteQuote, settings } = useCardStore();
  const pathname = usePathname();

  const quotesWithBooks = selectQuotesWithBooks({ books, quotes } as any);
  const initialQuote = quotesWithBooks.find(q => q.id === quoteId);

  // Filter quotes by the same book
  const bookQuotes = initialQuote
    ? quotesWithBooks.filter(q => q.book.id === initialQuote.book.id)
    : [];

  const initialIndex = bookQuotes.findIndex(q => q.id === quoteId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    if (currentIndex < bookQuotes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, bookQuotes.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(bookQuotes.length - 1);
    }
  }, [currentIndex, bookQuotes.length]);

  const { isDragging, onDragStart, dragProps } = useSwipeNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    threshold: 80,
  });

  const { isAutoPlaying, toggleAutoPlay } = useAutoPlay({
    onNext: handleNext,
    interval: settings.swipeInterval,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Auto-hide UI on inactivity
    const resetUITimer = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        if (!isDragging) setShowUI(false);
      }, 3000);
    };

    window.addEventListener('mousemove', resetUITimer);
    window.addEventListener('touchstart', resetUITimer);
    resetUITimer();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', resetUITimer);
      window.removeEventListener('touchstart', resetUITimer);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [isDragging]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    router.back();
  };

  const handleEditQuote = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      router.push(`/card/add-quote?quoteId=${quote.id}`);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuote(quoteId);
      if (bookQuotes.length <= 1) {
        handleClose();
      } else {
        handleNext();
      }
    }
  };

  if(!pathname.includes('/card/quotes/') || !quoteId) return null;

  if (!initialQuote || bookQuotes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg-base flex items-center justify-center z-[100]"
      >
        <p className="text-fg-muted">Quote not found</p>
      </motion.div>
    );
  }

  const currentQuote = bookQuotes[currentIndex];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg-base z-[100] flex flex-col touch-none"
      style={{paddingTop:'env(safe-area-inset-top)'}}
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[150px]" />
      </div>

      {/* Header */}
      <motion.div
        animate={{ y: showUI ? 0 : -100, opacity: showUI ? 1 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative z-50 flex items-center justify-between p-6 sm:p-8"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">
            Book Collection
          </span>
          <h2 className="text-lg font-bold text-fg-primary line-clamp-1 max-w-[200px] sm:max-w-md">
            {currentQuote.book.title}
          </h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => toggleAutoPlay(containerRef)}
            className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            title={isAutoPlaying ? "Pause" : "Auto Play"}
          >
            {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            {...dragProps}
            onDragStart={() => {
              onDragStart();
              setShowUI(true);
            }}
            className="w-full max-w-2xl h-full flex items-center justify-center"
          >
            <div className="w-full h-full flex flex-col  justify-center">
              <QuoteCard
                card={currentQuote}
                isActive={true}
                isFullscreen={true}
                onEdit={handleEditQuote}
                onDelete={handleDeleteQuote}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Pagination */}
      <motion.div
        animate={{ y: showUI ? 0 : 100, opacity: showUI ? 1 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative z-50 p-4 sm:p-8 flex flex-col items-center"
      >
        <div className="flex gap-1.5 mb-2">
          {bookQuotes.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-fg-muted/20'
                }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">
          {currentIndex + 1} / {bookQuotes.length}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function FullscreenQuotePage() {
  return (
    <Suspense fallback={null}>
      <FullscreenQuoteContent />
    </Suspense>
  );
}
