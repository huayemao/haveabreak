'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'i18n/routing';
import BookDetail from './BookDetail';
import { Quote as QuoteType } from '@haveabreak/card/types';
import { useCardStore } from '@haveabreak/card/store';
import { Suspense } from 'react';

function BookDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId') || '';
  const { deleteQuote } = useCardStore();

  const handleAddQuote = () => {
    router.push(`/card/add-quote?bookId=${bookId}`);
  };

  const handleEditQuote = (quote: QuoteType) => {
    router.push(`/card/add-quote?quoteId=${quote.id}`);
  };

  const handleQuoteClick = (quote: QuoteType) => {
    router.push(`/card/quotes/detail?quoteId=${quote.id}`);
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteQuote(quoteId);
  };

  const handleBack = () => {
    router.push('/card/library');
  };

  return (
    <BookDetail
      bookId={bookId}
      onAddQuote={handleAddQuote}
      onEditQuote={handleEditQuote}
      onQuoteClick={handleQuoteClick}
      onDeleteQuote={handleDeleteQuote}
      onBack={handleBack}
    />
  );
}

export default function BookDetailPage() {
  return (
    <Suspense fallback={null}>
      <BookDetailContent />
    </Suspense>
  );
}
