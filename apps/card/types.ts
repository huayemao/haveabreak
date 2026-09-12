import { Subscription as BaseSubscription, SubscriptionDiff as GenericSubscriptionDiff, SyncStrategy } from '@haveabreak/utils/lib/utils';

export interface Book {
  id: string;
  title: string;
  cover: string;
  author: string;
  translator?: string;
  publisher: string;
  isbn: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Quote {
  id: string;
  bookId: string;
  content: string;
  chapter?: string;
  page?: string;
  createdAt: number;
  updatedAt?: number;
}

export type Subscription = BaseSubscription;

export interface CardSettings {
  autoPlay: boolean;
  swipeInterval: number;
  quoteSortOrder: 'createdAt' | 'page';
  subscriptions: Subscription[];
  activeSubscriptionId: string | null;
  lastCheckTime: number;
  lastUpdateTime: number;
  isRandom: boolean;
}

export type SubscriptionDiff = GenericSubscriptionDiff;

export interface SubscriptionConfig {
  books: Book[];
  quotes: Quote[];
  lastModified?: number;
}

// For UI convenience
export interface QuoteWithBook extends Quote {
  book: Book;
}
