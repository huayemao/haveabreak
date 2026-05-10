import { create } from 'zustand';
import { Book, Quote, CardSettings, QuoteWithBook } from './types';
import {
  getStoredBooks,
  getStoredQuotes,
  getSettings,
  addBook as storageAddBook,
  addQuote as storageAddQuote,
  deleteBook as storageDeleteBook,
  deleteQuote as storageDeleteQuote,
  saveSettings as storageSaveSettings,
} from './storage';

interface CardState {
  books: Book[];
  quotes: Quote[];
  settings: CardSettings;
  isLoading: boolean;

  // Views
  currentView: 'feed' | 'library' | 'detail';
  selectedBookId: string | null;

  // Actions
  loadData: () => Promise<void>;
  addBook: (bookData: Omit<Book, 'id' | 'createdAt'>) => Promise<Book | void>;
  addQuote: (quoteData: Omit<Quote, 'id' | 'createdAt'>) => Promise<Quote | void>;
  deleteBook: (id: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateSettings: (settings: CardSettings) => void;
  
  // Navigation
  setView: (view: 'feed' | 'library' | 'detail', bookId?: string) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  books: [],
  quotes: [],
  settings: {
    autoPlay: false,
    swipeInterval: 5000,
  },
  isLoading: true,
  currentView: 'feed',
  selectedBookId: null,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [books, quotes, settings] = await Promise.all([
        getStoredBooks(),
        getStoredQuotes(),
        getSettings(),
      ]);
      set({ books, quotes, settings });
    } catch (error) {
      console.error('Failed to load card data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addBook: async (bookData) => {
    try {
      const newBook = await storageAddBook(bookData);
      set((state) => ({ books: [...state.books, newBook] }));
      return newBook;
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  },

  addQuote: async (quoteData) => {
    try {
      const newQuote = await storageAddQuote(quoteData);
      set((state) => ({ quotes: [...state.quotes, newQuote] }));
      return newQuote;
    } catch (error) {
      console.error('Failed to add quote:', error);
    }
  },

  deleteBook: async (id) => {
    try {
      await storageDeleteBook(id);
      set((state) => ({
        books: state.books.filter((b) => b.id !== id),
        quotes: state.quotes.filter((q) => q.bookId !== id),
      }));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  },

  deleteQuote: async (id) => {
    try {
      await storageDeleteQuote(id);
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  },

  updateSettings: (settings) => {
    storageSaveSettings(settings);
    set({ settings });
  },

  setView: (view, bookId = null) => {
    set({ currentView: view, selectedBookId: bookId });
  },
}));

// Selectors
export const selectQuotesWithBooks = (state: CardState): QuoteWithBook[] => {
  return state.quotes.map(q => {
    const book = state.books.find(b => b.id === q.bookId);
    return { ...q, book: book! };
  }).filter(q => !!q.book);
};

export const selectQuotesByBookId = (state: CardState, bookId: string): Quote[] => {
  return state.quotes.filter(q => q.bookId === bookId);
};
