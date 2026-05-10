'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Book } from '@/apps/card/types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Book as BookIcon, Hash, Bookmark } from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: Omit<Book, 'id' | 'createdAt'>) => void;
}

export default function AddBookModal({ isOpen, onClose, onAdd }: AddBookModalProps) {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cover, setCover] = useState('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    onAdd({
      title,
      author,
      cover,
      publisher: publisher || 'Unknown',
      isbn: isbn || 'N/A'
    });
    
    setTitle('');
    setAuthor('');
    setPublisher('');
    setIsbn('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                {t('card.addBook', { defaultValue: 'Add New Book' })}
              </h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center">
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
                  <label className="text-sm font-bold text-fg-muted">{t('card.formPublisher', { defaultValue: 'Publisher' })}</label>
                  <input value={publisher} onChange={(e) => setPublisher(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-fg-muted">ISBN</label>
                  <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-fg-muted">{t('card.formCover', { defaultValue: 'Cover URL' })}</label>
                <input type="url" value={cover} onChange={(e) => setCover(e.target.value)} className="w-full p-3 rounded-xl bg-bg-base shadow-inset outline-none text-fg-primary text-xs" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-4 rounded-2xl bg-accent text-white font-bold shadow-extruded-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {t('card.addBookBtn', { defaultValue: 'Add Book' })}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
