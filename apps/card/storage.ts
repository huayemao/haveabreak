import { Book, Quote, CardSettings } from './types';
import presets from './presets.json';

const BOOKS_STORAGE_KEY = 'card_books';
const QUOTES_STORAGE_KEY = 'card_quotes';
const SETTINGS_STORAGE_KEY = 'card_settings';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function getStoredBooks(): Promise<Book[]> {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(BOOKS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored books', e);
    }
  }
  const presetBooks = (presets.books as any[]).map(b => ({ ...b, createdAt: Date.now() }));
  localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(presetBooks));
  return presetBooks;
}

export async function getStoredQuotes(): Promise<Quote[]> {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(QUOTES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored quotes', e);
    }
  }
  const presetQuotes = (presets.quotes as any[]).map(q => ({ ...q, createdAt: Date.now() }));
  localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(presetQuotes));
  return presetQuotes;
}

export function saveBooks(books: Book[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
}

export function saveQuotes(quotes: Quote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
}

export async function addBook(bookData: Omit<Book, 'id' | 'createdAt'>): Promise<Book> {
  const books = await getStoredBooks();
  const newBook: Book = {
    ...bookData,
    id: generateId(),
    createdAt: Date.now(),
  };
  books.push(newBook);
  saveBooks(books);
  return newBook;
}

export async function addQuote(quoteData: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
  const quotes = await getStoredQuotes();
  const newQuote: Quote = {
    ...quoteData,
    id: generateId(),
    createdAt: Date.now(),
  };
  quotes.push(newQuote);
  saveQuotes(quotes);
  return newQuote;
}

export async function deleteBook(id: string): Promise<void> {
  const books = (await getStoredBooks()).filter(b => b.id !== id);
  const quotes = (await getStoredQuotes()).filter(q => q.bookId !== id);
  saveBooks(books);
  saveQuotes(quotes);
}

export async function deleteQuote(id: string): Promise<void> {
  const quotes = (await getStoredQuotes()).filter(q => q.id !== id);
  saveQuotes(quotes);
}

export async function getSettings(): Promise<CardSettings> {
  if (typeof window === 'undefined') return presets.settings;
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse card settings', e);
    }
  }
  return presets.settings;
}

export function saveSettings(settings: CardSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
