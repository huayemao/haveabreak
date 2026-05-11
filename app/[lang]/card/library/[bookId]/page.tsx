'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import BookDetail from '../../components/BookDetail';
import { Quote as QuoteType } from '@/apps/card/types';
import { useCardStore } from '@/apps/card/store';

export default function BookDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { deleteQuote, deleteBook } = useCardStore();

  const bookId = pathname.split('/').pop() || '';

  const handleAddQuote = () => {
    router.push(`/card/add-quote?bookId=${bookId}`);
  };

  const handleEditQuote = (quote: QuoteType) => {
    router.push(`/card/add-quote?quoteId=${quote.id}`);
  };

  const handleQuoteClick = (quote: QuoteType) => {
    router.push(`/card/quotes/${quote.id}`);
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
