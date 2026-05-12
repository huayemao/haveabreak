export interface Book {
  id: string;
  title: string;
  cover: string;
  author: string;
  translator?: string;
  publisher: string;
  isbn: string;
  createdAt: number;
}

export interface Quote {
  id: string;
  bookId: string;
  content: string;
  chapter?: string;
  page?: string;
  createdAt: number;
}

export interface CardSettings {
  autoPlay: boolean;
  swipeInterval: number;
  subscriptionUrl: string;
  lastCheckTime: number;
  lastUpdateTime: number;
}

export interface SubscriptionDiff {
  newBooks: Book[];
  updatedBooks: Book[];
  deletedBooks: string[];
  newQuotes: Quote[];
  updatedQuotes: Quote[];
  deletedQuotes: string[];
}

export interface SubscriptionConfig {
  books: Book[];
  quotes: Quote[];
  lastModified: number;
}

// For UI convenience
export interface QuoteWithBook extends Quote {
  book: Book;
}
