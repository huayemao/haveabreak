"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Collection, MediaItem, MediaType } from '../types';
import { Dictionary } from '@/dictionaries';
import MediaThumbnail from './MediaThumbnail';
import CollectionDetail from './CollectionDetail';
import { useScrollLock } from '../utils/useScrollLock';

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
  dict: Dictionary;
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
  dict,
}: CollectionManagerProps) {
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

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
        dict={dict}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-fg-primary">{dict.frame.collections}</h2>
        <button
          onClick={() => updateUrl({ modal: 'add-collection' })}
          className="neumorphic-button px-4 py-2 text-sm"
        >
          {dict.frame.addCollection}
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          {dict.frame.noCollections}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className={`rounded-[32px] p-6 transition-all duration-300 cursor-pointer ${
                selectedCollectionId === collection.id
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-base'
                  : ''
              }`}
              onClick={() => handleCollectionClick(collection)}
              style={{
                background: '#E0E5EC',
                boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-fg-primary">{collection.name}</h3>
                <div className="flex gap-2">
                  {collection.mediaIds.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(collection, false, 0);
                      }}
                      className="w-8 h-8 rounded-full bg-accent hover:bg-accent-light flex items-center justify-center text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === collection.id ? null : collection.id);
                      }}
                      className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center text-fg-muted hover:text-fg-primary transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {activeDropdown === collection.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg py-1 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareModal(collection);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-fg-primary hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {dict.frame.share}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(collection);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-fg-primary hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {dict.frame.edit}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(collection.id);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {dict.frame.delete}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {collection.description && (
                <p className="text-sm text-fg-muted mb-3">{collection.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-fg-muted">
                <span>{collection.mediaIds.length} {dict.frame.mediaLibrary}</span>
                <span>{(collection.slideInterval / 1000).toFixed(0)}s {dict.frame.slideInterval}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {collection.mediaIds.slice(0, 4).map((mediaId) => {
                  const item = media.find((m) => m.id === mediaId);
                  return item ? (
                    <div
                      key={mediaId}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-muted"
                    >
                      <MediaThumbnail item={item} className="w-full h-full" />
                    </div>
                  ) : null;
                })}
                {collection.mediaIds.length > 4 && (
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-fg-muted text-sm">
                    +{collection.mediaIds.length - 4}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{dict.frame.addCollection}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.collectionName}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={dict.frame.collectionName}
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.collectionDesc}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={dict.frame.collectionDesc}
                  rows={2}
                  className="neumorphic-input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.selectMedia}</label>
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
                {dict.frame.cancel}
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 neumorphic-button-primary"
              >
                {dict.frame.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{dict.frame.edit}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.collectionName}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="neumorphic-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.collectionDesc}</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="neumorphic-input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict.frame.selectMedia}</label>
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
                {dict.frame.cancel}
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 neumorphic-button-primary"
              >
                {dict.frame.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && editingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">{dict.frame.shareCollection}</h3>
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
                {copied ? dict.frame.copiedToClipboard : dict.frame.copy}
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.confirmDelete}</h3>
            <p className="mb-6">{dict.frame.confirmDeleteCollection}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 neumorphic-button-destructive"
              >
                {dict.frame.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}