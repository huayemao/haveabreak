"use client";
import { useTranslations } from 'next-intl';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({ isOpen, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-dialog p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold mb-4">{t('frame.deleteCollection')}</h3>
        <p className="text-sm text-fg-muted mb-6">{t('frame.deleteConfirm')}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 neumorphic-button"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 neumorphic-button bg-red-500 hover:bg-red-600 text-white"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
