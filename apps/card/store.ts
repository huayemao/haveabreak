import { create } from 'zustand';
import { Book, Quote, CardSettings, QuoteWithBook, SubscriptionConfig } from './types';
import {
  Subscription,
  SubscriptionDiff,
  SyncStrategy,
  SubscriptionValidationResult,
  fetchSubscriptionJson,
  computeCategoryDiff,
  buildSubscriptionDiff,
} from '@haveabreak/utils/lib/utils';
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
  isCheckingAll: boolean;
  hasUpdate: boolean;
  checkError: string | null;
  currentCheckingSubscriptionId: string | null;

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
  updateQuoteSortOrder: (order: 'createdAt' | 'page') => void;
  updateSwipeInterval: (interval: number) => void;
  updateIsRandom: (isRandom: boolean) => void;
  exportData: () => Promise<string>;
  importData: (data: string) => void;
  
  // Subscription Actions
  addSubscription: (name: string, url: string, syncStrategy?: SyncStrategy) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscription: (id: string, enabled: boolean) => void;
  setActiveSubscription: (id: string | null) => void;
  checkSubscription: (subscriptionId?: string) => Promise<void>;
  checkAllSubscriptions: () => Promise<void>;
  applyUpdate: () => void;
  applySubscriptionDiff: (diff: SubscriptionDiff) => void;
  clearUpdate: () => void;
  testSubscriptionUrl: (url: string) => Promise<SubscriptionValidationResult>;
  
  // Navigation
  setView: (view: 'feed' | 'library' | 'detail', bookId?: string) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  books: [],
  quotes: [],
  settings: {
    autoPlay: false,
    swipeInterval: 5000,
    quoteSortOrder: 'createdAt',
    subscriptions: [],
    activeSubscriptionId: null,
    lastCheckTime: 0,
    lastUpdateTime: 0,
    isRandom: true,
  },
  isLoading: true,
  subscriptionDiff: null,
  isChecking: false,
  isCheckingAll: false,
  hasUpdate: false,
  checkError: null,
  currentCheckingSubscriptionId: null,
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
    } catch (e) {
      console.error('Failed to load card data', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addBook: async (bookData) => {
    try {
      const newBook = await storageAddBook(bookData);
      set(state => ({ books: [...state.books, newBook] }));
      return newBook;
    } catch (e) {
      console.error('Failed to add book', e);
    }
  },

  addQuote: async (quoteData) => {
    try {
      const newQuote = await storageAddQuote(quoteData);
      set(state => ({ quotes: [...state.quotes, newQuote] }));
      return newQuote;
    } catch (e) {
      console.error('Failed to add quote', e);
    }
  },

  updateBook: async (id, updates) => {
    try {
      const updated = await storageUpdateBook(id, updates);
      if (updated) {
        set(state => ({
          books: state.books.map(b => b.id === id ? updated : b)
        }));
        return updated;
      }
    } catch (e) {
      console.error('Failed to update book', e);
    }
  },

  updateQuote: async (id, updates) => {
    try {
      const updated = await storageUpdateQuote(id, updates);
      if (updated) {
        set(state => ({
          quotes: state.quotes.map(q => q.id === id ? updated : q)
        }));
        return updated;
      }
    } catch (e) {
      console.error('Failed to update quote', e);
    }
  },

  deleteBook: async (id) => {
    try {
      await storageDeleteBook(id);
      set(state => ({
        books: state.books.filter(b => b.id !== id),
        quotes: state.quotes.filter(q => q.bookId !== id)
      }));
    } catch (e) {
      console.error('Failed to delete book', e);
    }
  },

  deleteQuote: async (id) => {
    try {
      await storageDeleteQuote(id);
      set(state => ({
        quotes: state.quotes.filter(q => q.id !== id)
      }));
    } catch (e) {
      console.error('Failed to delete quote', e);
    }
  },

  updateSettings: (settings) => {
    storageSaveSettings(settings);
    set({ settings });
  },

  updateQuoteSortOrder: (order) => {
    const state = get();
    const newSettings = { ...state.settings, quoteSortOrder: order };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateSwipeInterval: (interval) => {
    const state = get();
    const newSettings = { ...state.settings, swipeInterval: interval };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateIsRandom: (isRandom) => {
    const state = get();
    const newSettings = { ...state.settings, isRandom };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  exportData: async () => {
    return storageExportData();
  },

  importData: (data) => {
    storageImportData(data);
    get().loadData();
  },

  setView: (view, bookId?: string) => {
    set({ currentView: view, selectedBookId: bookId });
  },

  addSubscription: (name: string, url: string, syncStrategy: SyncStrategy = 'merge') => {
    const state = get();
    const newSubscription: Subscription = {
      id: `sub_${Date.now()}`,
      name,
      url,
      lastCheckTime: 0,
      lastUpdateTime: 0,
      enabled: true,
      syncStrategy,
      status: 'idle',
    };
    const newSubscriptions = [...state.settings.subscriptions, newSubscription];
    const newSettings = { 
      ...state.settings, 
      subscriptions: newSubscriptions,
      activeSubscriptionId: newSubscription.id 
    };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateSubscription: (id: string, updates: Partial<Subscription>) => {
    const state = get();
    const newSubscriptions = state.settings.subscriptions.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    );
    const newSettings = { ...state.settings, subscriptions: newSubscriptions };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  deleteSubscription: (id: string) => {
    const state = get();
    const newSubscriptions = state.settings.subscriptions.filter(sub => sub.id !== id);
    let newActiveId = state.settings.activeSubscriptionId;
    if (newActiveId === id) {
      newActiveId = newSubscriptions.length > 0 ? newSubscriptions[0].id : null;
    }
    const newSettings = { 
      ...state.settings, 
      subscriptions: newSubscriptions,
      activeSubscriptionId: newActiveId 
    };
    storageSaveSettings(newSettings);
    set({ 
      settings: newSettings,
      subscriptionDiff: state.subscriptionDiff?.subscriptionId === id ? null : state.subscriptionDiff,
    });
  },

  toggleSubscription: (id: string, enabled: boolean) => {
    get().updateSubscription(id, { enabled });
  },

  setActiveSubscription: (id: string | null) => {
    const state = get();
    const newSettings = { ...state.settings, activeSubscriptionId: id };
    storageSaveSettings(newSettings);
    set({ settings: newSettings });
  },

  testSubscriptionUrl: async (url: string): Promise<SubscriptionValidationResult> => {
    try {
      const config: SubscriptionConfig = await fetchSubscriptionJson(url);
      const bookCount = Array.isArray(config.books) ? config.books.length : 0;
      const quoteCount = Array.isArray(config.quotes) ? config.quotes.length : 0;

      if (bookCount === 0 && quoteCount === 0) {
        return {
          valid: false,
          error: 'JSON loaded, but found no valid "books" or "quotes" arrays',
        };
      }

      return {
        valid: true,
        itemCount: bookCount + quoteCount,
        summary: `Valid Feed: ${bookCount} books, ${quoteCount} quotes`,
        data: config,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Failed to fetch or parse subscription JSON',
      };
    }
  },

  checkSubscription: async (subscriptionId?: string) => {
    const state = get();
    const id = subscriptionId || state.settings.activeSubscriptionId;
    
    if (!id) {
      set({ checkError: 'Please select a subscription first', isChecking: false });
      return;
    }

    const subscription = state.settings.subscriptions.find(sub => sub.id === id);
    if (!subscription) {
      set({ checkError: 'Subscription not found', isChecking: false });
      return;
    }

    set({ isChecking: true, checkError: null, currentCheckingSubscriptionId: id });

    // Mark subscription status as checking
    get().updateSubscription(id, { status: 'checking', errorMessage: undefined });

    try {
      const config: SubscriptionConfig = await fetchSubscriptionJson(subscription.url);

      const remoteBooks: Book[] = Array.isArray(config.books) ? config.books : [];
      const remoteQuotes: Quote[] = Array.isArray(config.quotes) ? config.quotes : [];

      const bookDiffs = computeCategoryDiff({
        category: 'books',
        categoryLabel: 'Books',
        localItems: state.books,
        remoteItems: remoteBooks,
        getTitle: (b) => b.title,
        getSubtitle: (b) => b.author,
        strategy: subscription.syncStrategy || 'merge',
      });

      const quoteDiffs = computeCategoryDiff({
        category: 'quotes',
        categoryLabel: 'Quotes',
        localItems: state.quotes,
        remoteItems: remoteQuotes,
        getTitle: (q) => q.content.slice(0, 45) + (q.content.length > 45 ? '...' : ''),
        strategy: subscription.syncStrategy || 'merge',
      });

      const diff = buildSubscriptionDiff(
        subscription.id,
        subscription.name,
        [...bookDiffs, ...quoteDiffs],
        config
      );

      const hasChanges = diff.counts.total > 0;
      const status = hasChanges ? 'has_update' : 'up_to_date';

      get().updateSubscription(id, {
        lastCheckTime: Date.now(),
        status,
        itemCount: remoteBooks.length + remoteQuotes.length,
        errorMessage: undefined,
      });

      set({
        subscriptionDiff: diff,
        hasUpdate: hasChanges,
        isChecking: false,
        checkError: null,
        currentCheckingSubscriptionId: null,
      });

    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to check subscription';
      get().updateSubscription(id, {
        lastCheckTime: Date.now(),
        status: 'error',
        errorMessage: errorMsg,
      });
      set({ 
        checkError: errorMsg,
        isChecking: false,
        currentCheckingSubscriptionId: null,
      });
    }
  },

  checkAllSubscriptions: async () => {
    const state = get();
    const enabledSubs = state.settings.subscriptions.filter(s => s.enabled);
    if (enabledSubs.length === 0) return;

    set({ isCheckingAll: true, checkError: null });

    for (const sub of enabledSubs) {
      await get().checkSubscription(sub.id);
    }

    set({ isCheckingAll: false });
  },

  applySubscriptionDiff: (diff: SubscriptionDiff) => {
    const state = get();
    if (!diff || diff.items.length === 0) return;

    let newBooks = [...state.books];
    let newQuotes = [...state.quotes];

    for (const item of diff.items) {
      if (item.category === 'books') {
        const book = item.data as Book;
        if (item.action === 'add') {
          if (!newBooks.some(b => b.id === book.id)) {
            newBooks.push(book);
          }
        } else if (item.action === 'update') {
          newBooks = newBooks.map(b => b.id === book.id ? book : b);
        } else if (item.action === 'delete') {
          newBooks = newBooks.filter(b => b.id !== item.id);
          newQuotes = newQuotes.filter(q => q.bookId !== item.id);
        }
      } else if (item.category === 'quotes') {
        const quote = item.data as Quote;
        if (item.action === 'add') {
          if (!newQuotes.some(q => q.id === quote.id)) {
            newQuotes.push(quote);
          }
        } else if (item.action === 'update') {
          newQuotes = newQuotes.map(q => q.id === quote.id ? quote : q);
        } else if (item.action === 'delete') {
          newQuotes = newQuotes.filter(q => q.id !== item.id);
        }
      }
    }

    get().updateSubscription(diff.subscriptionId, {
      lastUpdateTime: Date.now(),
      status: 'up_to_date',
    });

    localStorage.setItem('card_books', JSON.stringify(newBooks));
    localStorage.setItem('card_quotes', JSON.stringify(newQuotes));

    set({
      books: newBooks,
      quotes: newQuotes,
      subscriptionDiff: null,
      hasUpdate: false,
    });
  },

  applyUpdate: () => {
    const state = get();
    if (state.subscriptionDiff) {
      get().applySubscriptionDiff(state.subscriptionDiff);
    }
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
