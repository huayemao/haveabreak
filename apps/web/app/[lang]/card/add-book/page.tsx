'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'i18n/routing';
import { Book } from '@/apps/card/types';
import { useCardStore } from '@/apps/card/store';
import { fetchCoverByIsbn } from '@/apps/card/services';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book as BookIcon, Hash, Bookmark } from 'lucide-react';
import { toast } from 'sonner';



export default function AddBookModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { addBook, updateBook, books } = useCardStore();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [translator, setTranslator] = useState('');
  const [cover, setCover] = useState('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [isLoadingCover, setIsLoadingCover] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    const fetchBook = (bookId: string) => {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setEditingBook(book);
        setTitle(book.title);
        setAuthor(book.author);
        setTranslator(book.translator || '');
        setCover(book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200');
        setPublisher(book.publisher || '');
        setIsbn(book.isbn || '');
      }
    };

    const queryBookId = searchParams.get('bookId');
    if (queryBookId) {
      fetchBook(queryBookId);
    }
  }, [books, searchParams]);

  const handleFetchCover = async () => {
    if (!isbn.trim()) return;
    setIsLoadingCover(true);
    try {
      const coverUrl = await fetchCoverByIsbn(isbn);
      if (coverUrl) {
        setCover(coverUrl);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(t(`card.${error.message}`));
      }
    } finally {
      setIsLoadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    if (editingBook) {
      await updateBook(editingBook.id, { title, author, cover, publisher: publisher || 'Unknown', isbn: isbn || 'N/A', translator: translator || undefined });
    } else {
      await addBook({ title, author, cover, publisher: publisher || 'Unknown', isbn: isbn || 'N/A', translator: translator || undefined });
    }

    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2">
            <BookIcon className="w-5 h-5 text-accent" />
            {editingBook ? t('card.editBook', { defaultValue: 'Edit Book' }) : t('card.addBook', { defaultValue: 'Add New Book' })}
          </h2>
          <button onClick={handleClose} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-fg-muted">{t('card.formBookTitle', { defaultValue: 'Book Title' })}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-fg-muted">{t('card.formAuthor', { defaultValue: 'Author' })}</label>
            <input required value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted">{t('card.formTranslator', { defaultValue: 'Translator' })}</label>
              <input value={translator} onChange={(e) => setTranslator(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted">{t('card.formPublisher', { defaultValue: 'Publisher' })}</label>
              <input value={publisher} onChange={(e) => setPublisher(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-fg-muted">ISBN</label>
              <div className="flex gap-2">
                <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="flex-1 w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
                <button type="button" onClick={handleFetchCover} disabled={isLoadingCover || !isbn.trim()} className="px-4 py-3 rounded-xl bg-accent text-white font-bold shadow-extruded-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoadingCover ? '...' : t('card.parseIsbn', { defaultValue: 'Parse' })}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-fg-muted">{t('card.formCover', { defaultValue: 'Cover URL' })}</label>
            <input type="url" value={cover} onChange={(e) => setCover(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary text-xs" />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-4 rounded-2xl bg-accent text-white font-bold shadow-extruded-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
              {editingBook ? t('card.saveBook', { defaultValue: 'Save Changes' }) : t('card.addBookBtn', { defaultValue: 'Add Book' })}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}