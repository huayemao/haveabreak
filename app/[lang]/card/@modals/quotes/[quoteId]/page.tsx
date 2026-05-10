'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCardStore, selectQuotesWithBooks } from '@/apps/card/store';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import QuoteCard from '../../../components/QuoteCard';

export default function FullscreenQuotePage() {
  const params = useParams<{ quoteId: string; lang: string }>();
  const router = useRouter();
  const { books, quotes, deleteQuote } = useCardStore();

  const quotesWithBooks = selectQuotesWithBooks({ books, quotes } as any);
  const quote = quotesWithBooks.find(q => q.id === params.quoteId);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleEditQuote = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      window.location.href = `/${params.lang}/card/add-quote?quoteId=${quote.id}`;
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuote(quoteId);
      router.back();
    }
  };

  if (!quote) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg-base/90 backdrop-blur-md flex items-center justify-center z-50"
      >
        <p className="text-fg-muted">Quote not found</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-bg-base/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] py-6 overflow-hidden"
      >
        <QuoteCard
          card={quote}
          isActive={true}
          isFullscreen={true}
          onEdit={handleEditQuote}
          onDelete={handleDeleteQuote}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <X className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}