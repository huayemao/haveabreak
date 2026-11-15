'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  FolderPlus,
  Edit3,
  Download,
  Copy,
  Trash2,
  FolderMinus,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import { Collection, MediaItem, MediaOrientation } from '../../types';

export type PlayerMenuView = 'menu' | 'collections' | 'edit' | 'delete';

interface PlayerMediaMenuProps {
  isOpen: boolean;
  initialView?: PlayerMenuView;
  anchor: { x: number; y: number };
  media: MediaItem;
  collections: Collection[];
  activeCollectionId?: string | null;
  onClose: () => void;
  onToggleCollection: (collection: Collection) => Promise<boolean>;
  onCreateCollectionWithMedia: (name: string) => Promise<void>;
  onUpdateMedia: (updates: Partial<MediaItem>) => Promise<void>;
  onRemoveFromActiveCollection?: () => Promise<void>;
  onDeleteMedia: () => Promise<void>;
  onDownloadMedia: () => Promise<void>;
  onCopyUrl: () => Promise<void>;
}

export default function PlayerMediaMenu({
  isOpen,
  initialView = 'menu',
  anchor,
  media,
  collections,
  activeCollectionId,
  onClose,
  onToggleCollection,
  onCreateCollectionWithMedia,
  onUpdateMedia,
  onRemoveFromActiveCollection,
  onDeleteMedia,
  onDownloadMedia,
  onCopyUrl,
}: PlayerMediaMenuProps) {
  const t = useTranslations();
  const [view, setView] = useState<PlayerMenuView>(initialView);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [clampedPos, setClampedPos] = useState<{ left: number; top: number }>({
    left: anchor.x,
    top: anchor.y,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Edit form state
  const [title, setTitle] = useState(media.title || '');
  const [description, setDescription] = useState(media.description || '');
  const [url, setUrl] = useState(media.url);
  const [orientation, setOrientation] = useState<MediaOrientation>(media.orientation);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setTitle(media.title || '');
      setDescription(media.description || '');
      setUrl(media.url);
      setOrientation(media.orientation);
      setNewCollectionName('');
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    }
  }, [isOpen, initialView, media]);

  // Dynamically keep the floating glass panel inside viewport bounds as its size/view changes
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const el = panelRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      setIsMobile(mobile);

      const width = el?.offsetWidth || (view === 'menu' ? 268 : 340);
      const height = el?.offsetHeight || (view === 'menu' ? 300 : 380);
      const margin = 16;

      // On mobile sub-views (edit / collections / delete), center horizontally and place in upper-middle
      if (mobile && view !== 'menu') {
        setClampedPos({
          left: Math.max(margin, Math.round((vw - width) / 2)),
          top: Math.max(margin, Math.min(Math.round(vh * 0.16), vh - height - margin)),
        });
        return;
      }

      const left = Math.max(margin, Math.min(anchor.x, vw - width - margin));
      const top = Math.max(margin, Math.min(anchor.y, vh - height - margin));
      setClampedPos({ left, top });
    };

    updatePosition();

    const el = panelRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updatePosition);
      observer.observe(el);
    }

    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      observer?.disconnect();
    };
  }, [isOpen, anchor.x, anchor.y, view]);

  const memberCollections = collections.filter((col) =>
    col.mediaIds.includes(media.id)
  );

  const activeCollection =
    activeCollectionId && activeCollectionId !== '__uncollected__'
      ? collections.find((c) => c.id === activeCollectionId)
      : null;

  const isInActiveCollection = Boolean(
    activeCollection && activeCollection.mediaIds.includes(media.id)
  );

  const getOrientationLabel = (o: MediaOrientation) => {
    switch (o) {
      case 'landscape':
        return t('frame.landscape');
      case 'portrait':
        return t('frame.portrait');
      case 'square':
        return t('frame.square');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdateMedia({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        url: url.trim() || media.url,
        orientation,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCollectionName.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateCollectionWithMedia(trimmed);
      setNewCollectionName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] pointer-events-auto"
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Subtle dim backdrop when in Edit / Collections / Delete view */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: view === 'menu' ? 0.15 : 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black pointer-events-none"
          />

          {/* Floating Dark Glass Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              left: clampedPos.left,
              top: clampedPos.top,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`fixed bg-neutral-900/88 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-white overflow-hidden select-none ${
              view === 'menu'
                ? 'w-[272px]'
                : view === 'edit'
                  ? 'w-[min(92vw,360px)]'
                  : 'w-[min(90vw,320px)]'
            }`}
          >
            {/* VIEW 1: MAIN CONTEXT MENU */}
            {view === 'menu' && (
              <div className="p-2">
                {/* Media Info Mini Header */}
                <div className="px-3 py-2.5 mb-1 border-b border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        media.title ? 'text-white' : 'text-white/50 italic'
                      }`}
                    >
                      {media.title || t('frame.untitledMedia')}
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                      {media.type === 'image' ? (
                        <ImageIcon className="w-3 h-3 text-accent" />
                      ) : (
                        <VideoIcon className="w-3 h-3 text-accent" />
                      )}
                      {media.type === 'image' ? t('frame.image') : t('frame.video')}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/75">
                      {getOrientationLabel(media.orientation)}
                    </span>
                    {memberCollections.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent/25 text-white font-medium">
                        <Layers className="w-2.5 h-2.5" />
                        {memberCollections.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setView('collections')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FolderPlus className="w-4 h-4 text-accent" />
                      <span>{t('frame.addToCollection')}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-white/50">
                      {memberCollections.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/80">
                          {memberCollections.length}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('edit')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Edit3 className="w-4 h-4 text-accent" />
                      <span>{t('frame.editInfo')}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDownloadMedia();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-white/70" />
                      <span>{t('frame.download')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onCopyUrl();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-white/70" />
                      <span>{t('frame.copyUrl')}</span>
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-1.5 mx-2" />

                  {isInActiveCollection && onRemoveFromActiveCollection && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onRemoveFromActiveCollection();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-amber-300 hover:bg-amber-500/15 active:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <FolderMinus className="w-4 h-4" />
                        <span className="truncate">{t('frame.removeFromCollection')}</span>
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setView('delete')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 active:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4" />
                      <span>{t('common.delete')}</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: ADD TO / MANAGE COLLECTIONS */}
            {view === 'collections' && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold">{t('frame.addToCollection')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Collection Checklist */}
                <div className="max-h-56 overflow-y-auto p-2 space-y-1">
                  {collections.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/50">
                      {t('frame.noCollections')}
                    </div>
                  ) : (
                    collections.map((col) => {
                      const isChecked = col.mediaIds.includes(media.id);
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => onToggleCollection(col)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-accent/20 text-white hover:bg-accent/30'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                isChecked
                                  ? 'bg-accent border-accent text-white'
                                  : 'border-white/30 bg-white/5'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="truncate font-medium">{col.name}</span>
                          </span>
                          <span className="text-xs text-white/45 font-mono shrink-0 ml-2">
                            {col.mediaIds.length}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Quick Create Collection Input */}
                <form
                  onSubmit={handleCreateCollection}
                  className="p-2.5 border-t border-white/10 bg-black/20 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder={t('frame.newCollectionPlaceholder')}
                    className="flex-1 min-w-0 bg-white/10 border border-white/15 focus:border-accent rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newCollectionName.trim() || isSubmitting}
                    className="h-8 px-3 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('common.add')}</span>
                  </button>
                </form>
              </div>
            )}

            {/* VIEW 3: EDIT MEDIA INFO */}
            {view === 'edit' && (
              <form onSubmit={handleSaveEdit} className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold">{t('frame.editInfo')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-white/65 mb-1.5">
                      {t('frame.title')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('frame.untitledMedia')}
                      autoFocus={!isMobile}
                      className="w-full bg-white/10 border border-white/15 focus:border-accent rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/65 mb-1.5">
                      {t('frame.description')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('frame.description')}
                      rows={2}
                      className="w-full bg-white/10 border border-white/15 focus:border-accent rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none resize-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/65 mb-1.5">
                      {t('frame.orientation')}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['landscape', 'portrait', 'square'] as MediaOrientation[]).map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setOrientation(o)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            orientation === o
                              ? 'bg-accent text-white shadow-sm'
                              : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                          }`}
                        >
                          {getOrientationLabel(o)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/65 mb-1.5">
                      {t('frame.url')}
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 focus:border-accent rounded-xl px-3 py-2 text-xs font-mono text-white/90 placeholder:text-white/35 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setView('menu')}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/85 transition-all cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !url.trim()}
                    className="flex-1 py-2 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-lg cursor-pointer"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: DELETE CONFIRMATION */}
            {view === 'delete' && (
              <div className="p-5 text-center">
                <div className="w-11 h-11 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">
                  {t('frame.confirmDelete')}
                </h4>
                <p className="text-xs text-white/65 mb-5 leading-relaxed">
                  {t('frame.confirmDeleteMedia')}
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setView('menu')}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/85 transition-all cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteMedia();
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold text-white transition-all shadow-lg cursor-pointer"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
