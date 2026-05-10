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
}

// For UI convenience
export interface QuoteWithBook extends Quote {
  book: Book;
}
