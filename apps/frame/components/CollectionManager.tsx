"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from '../../web/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Collection, MediaItem, MediaType } from '../types';
import { useTranslations } from 'next-intl';
import CollectionDetail from './CollectionDetail';
import CollectionBanner from './CollectionBanner';
import CollectionCard from './CollectionCard';
import CollectionModal from './CollectionModal';
import ShareModal from './ShareModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
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
  onPlay: (collection: Collection, paused?: boolean, startIndex?: number, shuffle?: boolean) => void;
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
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useScrollLock(showAddModal || showEditModal || showShareModal || !!confirmDeleteId);

  const editingCollection = useMemo(() => {
    if (editingId) {
      return collections.find(c => c.id === editingId) || null;
    }
    return null;
  }, [editingId, collections]);

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

  const handleCreate = (name: string, description: string, mediaIds: string[]) => {
    onCreate(name, description || undefined, mediaIds);
    closeModal();
  };

  const handleUpdate = (name: string, description: string, mediaIds: string[]) => {
    if (editingCollection) {
      onUpdate(editingCollection.id, {
        name,
        description: description || undefined,
        mediaIds,
      });
      closeModal();
    }
  };

  const handleShareModal = (collection: Collection) => {
    updateUrl({ modal: 'share-collection', editId: collection.id });
  };

  const openEditModal = (collection: Collection) => {
    updateUrl({ modal: 'edit-collection', editId: collection.id });
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-2 lg:col-span-4 relative">
              <CollectionBanner
                collections={collections}
                media={media}
                onPlay={onPlay}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                media={media}
                selectedCollectionId={selectedCollectionId}
                onPlay={onPlay}
                onSelect={onSelect}
                onEdit={openEditModal}
                onShare={handleShareModal}
                onDelete={setConfirmDeleteId}
              />
            ))}
          </div>
        </>
      )}

      <CollectionModal
        isOpen={showAddModal}
        mode="add"
        media={media}
        onClose={closeModal}
        onSave={handleCreate}
      />

      <CollectionModal
        isOpen={showEditModal}
        mode="edit"
        collection={editingCollection}
        media={media}
        onClose={closeModal}
        onSave={handleUpdate}
      />

      <ShareModal
        isOpen={showShareModal}
        collection={editingCollection}
        pathname={pathname}
        onClose={closeModal}
      />

      <DeleteConfirmDialog
        isOpen={!!confirmDeleteId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
