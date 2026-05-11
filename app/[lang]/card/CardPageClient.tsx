'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCardStore, selectQuotesWithBooks } from '@/apps/card/store';
import { Quote } from '@/apps/card/types';
import QuoteCard from './components/QuoteCard';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Plus, Library, Sparkles, ChevronUp, ChevronDown, Settings, Play, Pause, Shuffle, Maximize2, Minimize2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';

export default function CardPageClient() {
  const {
    books,
    quotes,
    deleteQuote,
  } = useCardStore();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isRandom, setIsRandom] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations();

  const quotesWithBooks = useMemo(() => selectQuotesWithBooks({ books, quotes } as any), [books, quotes]);

  const handleNext = useCallback(() => {
    if (isRandom && quotesWithBooks.length > 1) {
      let nextIndex = currentIndex;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * quotesWithBooks.length);
      }
      setCurrentIndex(nextIndex);
      return;
    }

    if (currentIndex < quotesWithBooks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, quotesWithBooks.length, isRandom]);

  const handlePrev = useCallback(() => {
    if (isRandom && quotesWithBooks.length > 1) {
      let prevIndex = currentIndex;
      while (prevIndex === currentIndex) {
        prevIndex = Math.floor(Math.random() * quotesWithBooks.length);
      }
      setCurrentIndex(prevIndex);
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(quotesWithBooks.length - 1);
    }
  }, [currentIndex, quotesWithBooks.length, isRandom]);

  useEffect(() => {
    let interval: any;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        handleNext();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, handleNext]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const resetUITimer = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        if (!isDragging && (isAutoPlaying || !!document.fullscreenElement)) setShowUI(false);
      }, 3000);
    };

    window.addEventListener('mousemove', resetUITimer);
    window.addEventListener('touchstart', resetUITimer);
    resetUITimer();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', resetUITimer);
      window.removeEventListener('touchstart', resetUITimer);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [isDragging, isAutoPlaying]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const onDragStart = () => {
    setIsDragging(true);
    setShowUI(true);
  };

  const onDragEnd = (event: any, info: any) => {
    setIsDragging(false);
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
      router.push(`/card/add-quote?quoteId=${quote.id}`)
    }
  }, [quotes]);

  const handleDeleteQuote = useCallback((quoteId: string) => {
    if (confirm(t('card.confirmDeleteQuote', { defaultValue: 'Are you sure you want to delete this quote?' }))) {
      deleteQuote(quoteId);
    }
  }, [deleteQuote, t]);

  const handleFullscreen = useCallback((quoteId: string) => {
    if (isDragging) return;
    router.push(`/card/quotes/${quoteId}`);
  }, [router, isDragging]);

  if (quotesWithBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-12 rounded-[32px] bg-bg-base shadow-extruded text-center max-w-md">
          <Sparkles className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
          <p className="text-fg-muted mb-8">{t('card.noQuotesInFeed', { defaultValue: 'No sentences in your feed. Add some books and quotes first!' })}</p>
          <Link
            href="/card/add-book"
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
    <div ref={containerRef} className="relative w-full flex flex-col items-center px-4 h-full bg-bg-base transition-colors duration-500 overflow-hidden">
      <motion.div 
        animate={{ y: showUI ? 0 : -100, opacity: showUI ? 1 : 0 }}
        className="mb-8 text-center pt-4"
      >
        <h2 className="text-3xl font-bold text-fg-primary font-display mb-2">{t('card.pageTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('card.pageSubtitle')}</p>
      </motion.div>

      <div className="flex-1 relative w-full flex items-center justify-center">
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
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="w-full z-10 flex items-center justify-center"
          >
            <div className="w-full max-w-lg max-h-[70vh] sm:max-h-full">
              <QuoteCard
                card={quotesWithBooks[currentIndex]}
                isActive={true}
                onEdit={handleEditQuote}
                onDelete={handleDeleteQuote}
                onClick={() => handleFullscreen(quotesWithBooks[currentIndex].id)}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Navigation Buttons (Side) */}
        <AnimatePresence>
          {showUI && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-[-10px] sm:right-[-60px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20"
            >
              <button 
                onClick={() => {
                  if (!isAutoPlaying) {
                    containerRef.current?.requestFullscreen().catch(() => {});
                  }
                  setIsAutoPlaying(!isAutoPlaying);
                }} 
                className={`w-10 h-10 rounded-full neumorphic-button flex items-center justify-center transition-all ${isAutoPlaying ? 'text-accent shadow-inset' : 'text-fg-muted'}`}
                title={isAutoPlaying ? "Pause" : "Auto Play"}
              >
                {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsRandom(!isRandom)} 
                className={`w-10 h-10 rounded-full neumorphic-button flex items-center justify-center transition-all ${isRandom ? 'text-accent shadow-inset' : 'text-fg-muted'}`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleFullscreen} 
                className={`w-10 h-10 rounded-full neumorphic-button flex items-center justify-center transition-all ${isFullscreen ? 'text-accent shadow-inset' : 'text-fg-muted'}`}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <div className="h-4" />
              <button onClick={handlePrev} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <ChevronUp className="w-5 h-5" />
              </button>
              <button onClick={handleNext} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <ChevronDown className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <motion.div 
        animate={{ y: showUI ? 0 : 100, opacity: showUI ? 1 : 0 }}
        className="mt-8 flex gap-2 flex-wrap justify-center max-w-xs pb-4"
      >
        {quotesWithBooks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-fg-muted/20 hover:bg-fg-muted/40'
            }`}
          />
        ))}
      </motion.div>
    </div>
  );
}