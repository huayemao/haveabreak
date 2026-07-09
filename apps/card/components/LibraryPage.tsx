'use client';

import { useCardStore } from '@haveabreak/card/store';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Plus, Book as BookIcon, ChevronRight } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@haveabreak/ui/components/ui/context-menu';
import { Edit3, Trash2 } from 'lucide-react';
import { Book } from '@haveabreak/card/types';
import { useRouter } from 'i18n/routing';

export default function LibraryPage() {
  const { books, deleteBook } = useCardStore();
  const t = useTranslations();
  const router = useRouter();

  const handleDeleteBook = (bookId: string) => {
    if (confirm(t('card.confirmDeleteBook', { defaultValue: 'Are you sure you want to delete this book and all its quotes?' }))) {
      deleteBook(bookId);
    }
  };

  const handleEditBook = (book: Book) => {
    router.push(`/card/add-book?bookId=${book.id}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-fg-primary font-display">{t('card.library', { defaultValue: 'My Library' })}</h2>
        <Link
          href="/card/add-book"
          className="neumorphic-button flex items-center gap-2 px-4 py-2 rounded-2xl text-accent font-bold hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('card.addBook', { defaultValue: 'Add Book' })}
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="p-12 rounded-[32px] bg-bg-base shadow-extruded text-center">
          <BookIcon className="w-16 h-16 text-fg-muted/20 mx-auto mb-4" />
          <p className="text-fg-muted">{t('card.noBooks', { defaultValue: 'No books in your library yet.' })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <ContextMenu key={book.id}>
              <ContextMenuTrigger>
                <Link
                  href={`/card/library/detail?bookId=${book.id}`}
                  className="group relative bg-bg-base rounded-[32px] p-6 shadow-extruded hover:shadow-extruded-lg transition-all duration-300 cursor-pointer flex flex-col items-center"
                >
                  <div className="relative w-32 h-44 mb-4 rounded-xl overflow-hidden shadow-extruded-sm group-hover:scale-105 transition-transform duration-500">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-fg-primary text-center line-clamp-1 mb-1">{book.title}</h3>
                  <p className="text-xs text-fg-muted text-center line-clamp-1">{book.author}</p>

                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    VIEW DETAILS <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => handleEditBook(book)} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleDeleteBook(book.id)} className="gap-2 text-red-500 focus:text-red-500">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
    </div>
  );
}