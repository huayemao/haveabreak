import { create } from 'zustand';
import { Book, Quote, CardSettings, QuoteWithBook, SubscriptionDiff, SubscriptionConfig } from './types';
import {
  getStoredBooks,
  getStoredQuotes,
  getSettings,
  addBook as storageAddBook,
  addQuote as storageAddQuote,
  deleteBook as storageDeleteBook,
  deleteQuote as storageDeleteQuote,
  saveSettings as storageSaveSettings,
  updateBook as storageUpdateBook,
  updateQuote as storageUpdateQuote,
  exportData as storageExportData,
  importData as storageImportData,
} from './storage';

interface CardState {
  books: Book[];
  quotes: Quote[];
  settings: CardSettings;
  isLoading: boolean;

  // Subscription
  subscriptionDiff: SubscriptionDiff | null;
  isChecking: boolean;
  hasUpdate: boolean;
  checkError: string | null;

  // Views
  currentView: 'feed' | 'library' | 'detail';
  selectedBookId: string | null;

  // Actions
  loadData: () => Promise<void>;
  addBook: (bookData: Omit<Book, 'id' | 'createdAt'>) => Promise<Book | void>;
  addQuote: (quoteData: Omit<Quote, 'id' | 'createdAt'>) => Promise<Quote | void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<Book | void>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<Quote | void>;
  deleteBook: (id: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateSettings: (settings: CardSettings) => void;
  exportData: () => Promise<string>;
  importData: (data: string) => void;
  
  // Subscription Actions
  setSubscriptionUrl: (url: string) => void;
  checkSubscription: () => Promise<void>;
  applyUpdate: () => void;
  clearUpdate: () => void;
  
  // Navigation
  setView: (view: 'feed' | 'library' | 'detail', bookId?: string) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  books: [],
  quotes: [],
  settings: {
    autoPlay: false,
    swipeInterval: 5000,
    subscriptionUrl: '',
    lastCheckTime: 0,
    lastUpdateTime: 0,
  },
  isLoading: true,
  subscriptionDiff: null,
  isChecking: false,
  hasUpdate: false,
  checkError: null,
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

  updateBook: async (id, updates) => {
    try {
      const updatedBook = await storageUpdateBook(id, updates);
      if (updatedBook) {
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? updatedBook : b)),
        }));
      }
      return updatedBook;
    } catch (error) {
      console.error('Failed to update book:', error);
    }
  },

  updateQuote: async (id, updates) => {
    try {
      const updatedQuote = await storageUpdateQuote(id, updates);
      if (updatedQuote) {
        set((state) => ({
          quotes: state.quotes.map((q) => (q.id === id ? updatedQuote : q)),
        }));
      }
      return updatedQuote;
    } catch (error) {
      console.error('Failed to update quote:', error);
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

  exportData: async () => {
    return await storageExportData();
  },

  importData: (data) => {
    storageImportData(data);
  },

  setView: (view, bookId?: string) => {
    set({ currentView: view, selectedBookId: bookId });
  },

  setSubscriptionUrl: (url: string) => {
    const state = get();
    const newSettings = { ...state.settings, subscriptionUrl: url };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  checkSubscription: async () => {
    const state = get();
    const { subscriptionUrl } = state.settings;
    
    if (!subscriptionUrl) {
      set({ checkError: 'Please set a subscription URL first', isChecking: false });
      return;
    }

    set({ isChecking: true, checkError: null });

    try {
      const response = await fetch(subscriptionUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const config: SubscriptionConfig = await response.json();

      const currentBooks = new Map(state.books.map(b => [b.id, b]));
      const currentQuotes = new Map(state.quotes.map(q => [q.id, q]));

      const remoteBooks = new Map(config.books.map(b => [b.id, b]));
      const remoteQuotes = new Map(config.quotes.map(q => [q.id, q]));

      const diff: SubscriptionDiff = {
        newBooks: [],
        updatedBooks: [],
        deletedBooks: [],
        newQuotes: [],
        updatedQuotes: [],
        deletedQuotes: [],
      };

      remoteBooks.forEach((remoteBook, id) => {
        const localBook = currentBooks.get(id);
        if (!localBook) {
          diff.newBooks.push(remoteBook);
        } else if (remoteBook.createdAt > localBook.createdAt) {
          diff.updatedBooks.push(remoteBook);
        }
      });

      currentBooks.forEach((_, id) => {
        if (!remoteBooks.has(id)) {
          diff.deletedBooks.push(id);
        }
      });

      remoteQuotes.forEach((remoteQuote, id) => {
        const localQuote = currentQuotes.get(id);
        if (!localQuote) {
          diff.newQuotes.push(remoteQuote);
        } else if (remoteQuote.createdAt > localQuote.createdAt) {
          diff.updatedQuotes.push(remoteQuote);
        }
      });

      currentQuotes.forEach((_, id) => {
        if (!remoteQuotes.has(id)) {
          diff.deletedQuotes.push(id);
        }
      });

      const hasChanges = 
        diff.newBooks.length > 0 || 
        diff.updatedBooks.length > 0 || 
        diff.deletedBooks.length > 0 ||
        diff.newQuotes.length > 0 ||
        diff.updatedQuotes.length > 0 ||
        diff.deletedQuotes.length > 0;

      set({
        subscriptionDiff: diff,
        hasUpdate: hasChanges,
        isChecking: false,
        checkError: null,
      });

      const newSettings = { ...state.settings, lastCheckTime: Date.now() };
      storageSaveSettings(newSettings);
      set({ settings: newSettings });

    } catch (error) {
      set({ 
        checkError: error instanceof Error ? error.message : 'Failed to check subscription',
        isChecking: false 
      });
    }
  },

  applyUpdate: () => {
    const state = get();
    const { subscriptionDiff } = state;

    if (!subscriptionDiff) return;

    let newBooks = [...state.books];
    let newQuotes = [...state.quotes];

    subscriptionDiff.newBooks.forEach(book => {
      if (!newBooks.find(b => b.id === book.id)) {
        newBooks.push(book);
      }
    });

    subscriptionDiff.updatedBooks.forEach(book => {
      newBooks = newBooks.map(b => b.id === book.id ? book : b);
    });

    subscriptionDiff.deletedBooks.forEach(id => {
      newBooks = newBooks.filter(b => b.id !== id);
      newQuotes = newQuotes.filter(q => q.bookId !== id);
    });

    subscriptionDiff.newQuotes.forEach(quote => {
      if (!newQuotes.find(q => q.id === quote.id)) {
        newQuotes.push(quote);
      }
    });

    subscriptionDiff.updatedQuotes.forEach(quote => {
      newQuotes = newQuotes.map(q => q.id === quote.id ? quote : q);
    });

    subscriptionDiff.deletedQuotes.forEach(id => {
      newQuotes = newQuotes.filter(q => q.id !== id);
    });

    const newSettings = { ...state.settings, lastUpdateTime: Date.now() };
    storageSaveSettings(newSettings);
    localStorage.setItem('card_books', JSON.stringify(newBooks));
    localStorage.setItem('card_quotes', JSON.stringify(newQuotes));

    set({ 
      books: newBooks, 
      quotes: newQuotes, 
      settings: newSettings,
      subscriptionDiff: null,
      hasUpdate: false,
    });
  },

  clearUpdate: () => {
    set({ subscriptionDiff: null, hasUpdate: false, checkError: null });
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
