"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Collection, MediaItem, MediaType } from '../types';
import { useTranslations } from 'next-intl';
import MediaThumbnail from './MediaThumbnail';
import CollectionDetail from './CollectionDetail';
import { useScrollLock } from '../utils/useScrollLock';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Play, Trash2, Share2, Edit3 } from 'lucide-react';

interface CollectionManagerProps {
  collections: Collection[];
  media: MediaItem[];
  selectedCollectionId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string, description?: string, mediaIds?: string[]) => void;
  onUpdate: (id: string, updates: Partial<Collection>) => void;
  onDelete: (id: string) => void;
  onShare: (collection: Collection) => void;
  onPlay: (collection: Collection, paused?: boolean, startIndex?: number) => void;
  onMediaAdd: (url: string, type: MediaType, title?: string) => void;
  onMediaAddUrlList: (urls: string[], type: MediaType) => void;
  onMediaDelete: (id: string) => void;
}

export default function CollectionManager({
  collections,
  media,
  selectedCollectionId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onShare,
  onPlay,
  onMediaAdd,
  onMediaAddUrlList,
  onMediaDelete,
}: CollectionManagerProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const modalType = searchParams.get('modal');
  const editingId = searchParams.get('editId');
  const showAddModal = modalType === 'add-collection';
  const showEditModal = modalType === 'edit-collection';
  const showShareModal = modalType === 'share-collection';
  
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useScrollLock(showAddModal || showEditModal || showShareModal || !!confirmDeleteId);
  const [copied, setCopied] = useState(false);

  const editingCollection = useMemo(() => {
    if (editingId) {
      return collections.find(c => c.id === editingId) || null;
    }
    return null;
  }, [editingId, collections]);

  useEffect(() => {
    if (showEditModal && editingCollection) {
      setNewName(editingCollection.name);
      setNewDesc(editingCollection.description || '');
      setSelectedMediaIds([...editingCollection.mediaIds]);
    } else if (showAddModal) {
      setNewName('');
      setNewDesc('');
      setSelectedMediaIds([]);
    }
  }, [showEditModal, showAddModal, editingCollection]);



  const updateUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const queryString = newParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const closeModal = () => updateUrl({ modal: null, editId: null });

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), newDesc.trim() || undefined, selectedMediaIds);
      closeModal();
    }
  };

  const handleUpdate = () => {
    if (editingCollection && newName.trim()) {
      onUpdate(editingCollection.id, {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        mediaIds: selectedMediaIds,
      });
      closeModal();
    }
  };

  const handleShareModal = (collection: Collection) => {
    updateUrl({ modal: 'share-collection', editId: collection.id });
  };

  const copyShareLink = () => {
    if (editingCollection) {
      const shareData = JSON.stringify({
        id: editingCollection.id,
        name: editingCollection.name,
        mediaIds: editingCollection.mediaIds,
      });
      const encoded = btoa(shareData);
      const link = `${window.location.origin}${pathname}?share=${encoded}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEditModal = (collection: Collection) => {
    updateUrl({ modal: 'edit-collection', editId: collection.id });
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleCollectionClick = (collection: Collection) => {
    onSelect(collection.id);
  };

  const handleBack = () => {
    onSelect(null);
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  if (selectedCollectionId && selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        media={media}
        onBack={handleBack}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onPlay={onPlay}
        onShare={onShare}
        onMediaAdd={onMediaAdd}
        onMediaAddUrlList={onMediaAddUrlList}
        onMediaDelete={onMediaDelete}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-fg-primary">{t('frame.collections')}</h2>
        <button
          onClick={() => updateUrl({ modal: 'add-collection' })}
          className="neumorphic-button px-4 py-2 text-sm"
        >
          {t('frame.addCollection')}
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          {t('frame.noCollections')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((collection) => {
            const firstMediaId = collection.mediaIds[0];
            const firstMedia = media.find((m) => m.id === firstMediaId);
            
            return (
              <ContextMenu key={collection.id}>
                <ContextMenuTrigger>
                  <div
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      selectedCollectionId === collection.id ? 'ring-2 ring-accent ring-offset-2' : ''
                    }`}
                    onClick={() => handleCollectionClick(collection)}
                  >
                    <div className="aspect-square bg-muted">
                      {firstMedia ? (
                        <MediaThumbnail item={firstMedia} className="w-full h-full" showPlayIcon={false} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-fg-muted text-sm">{t('frame.noMedia')}</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/10">
                      {collection.mediaIds.length > 0 && (
                        <button
                          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(collection, false, 0);
                          }}
                        >
                          <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{collection.name}</p>
                        {collection.description && (
                          <p className="text-white/70 text-xs mt-1 line-clamp-2">{collection.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
                          <span>{collection.mediaIds.length} {t('frame.media')}</span>
                          <span>•</span>
                          <span>{(collection.slideInterval / 1000).toFixed(0)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onClick={() => onPlay(collection, false, 0)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {t('frame.play')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => openEditModal(collection)}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('common.edit')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleShareModal(collection)}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('frame.share')}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => setConfirmDeleteId(collection.id)}
                    className="gap-2 text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{t('frame.addCollection')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.collectionName')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('frame.collectionName')}
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.collectionDesc')}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t('frame.collectionDesc')}
                  rows={2}
                  className="neumorphic-input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.selectMedia')}</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative cursor-pointer rounded-xl overflow-hidden ${
                        selectedMediaIds.includes(item.id) ? 'ring-2 ring-accent' : ''
                      }`}
                      onClick={() => toggleMediaSelection(item.id)}
                    >
                      <MediaThumbnail item={item} className="w-full h-full" />
                      {selectedMediaIds.includes(item.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 neumorphic-button-primary"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{t('common.edit')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.collectionName')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.collectionDesc')}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="neumorphic-input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('frame.selectMedia')}</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative cursor-pointer rounded-xl overflow-hidden ${
                        selectedMediaIds.includes(item.id) ? 'ring-2 ring-accent' : ''
                      }`}
                      onClick={() => toggleMediaSelection(item.id)}
                    >
                      <MediaThumbnail item={item} className="w-full h-full" />
                      {selectedMediaIds.includes(item.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 neumorphic-button-primary"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && editingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">{t('frame.shareCollection')}</h3>
            <p className="text-sm text-fg-muted mb-4">{editingCollection.name}</p>
            
            <div className="relative">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${pathname}?share=${btoa(JSON.stringify({
                  id: editingCollection.id,
                  name: editingCollection.name,
                  mediaIds: editingCollection.mediaIds,
                }))}`}
                className="neumorphic-input w-full pr-24"
              />
              <button
                onClick={copyShareLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent text-white rounded-lg text-sm hover:bg-accent-light transition-colors"
              >
                {copied ? t('frame.copiedToClipboard') : t('frame.copy')}
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{t('frame.confirmDelete')}</h3>
            <p className="mb-6">{t('frame.confirmDeleteCollection')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  onDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 neumorphic-button-destructive"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}