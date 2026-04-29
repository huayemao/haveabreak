"use client";
import { Dictionary } from '@/dictionaries';
import { MediaType } from '../types';
import { ImportResultItem } from '../utils/mediaDetector';

interface ImportResultDialogProps {
  isOpen: boolean;
  results: ImportResultItem[];
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  dict: Dictionary;
}

export default function ImportResultDialog({
  isOpen,
  results,
  onClose,
  onConfirm,
  onRetry,
  dict,
}: ImportResultDialogProps) {
  if (!isOpen) return null;

  const successCount = results.filter(item => item.status === 'success').length;
  const failedCount = results.filter(item => item.status === 'failed').length;
  const isDetecting = results.some(item => item.status === 'detecting');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-dialog p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{dict.frame.importResult}</h3>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-muted/50">
          <div className="flex justify-between text-sm">
            <span className="text-fg-muted">
              {dict.frame.total}: {results.length}
            </span>
            <span className="text-green-600">
              {dict.frame.success}: {successCount}
            </span>
            <span className="text-red-600">
              {dict.frame.failed}: {failedCount}
            </span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
          {results.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`p-3 rounded-xl text-sm ${
                item.status === 'detecting' ? 'bg-blue-50' :
                item.status === 'success' ? 'bg-green-50' :
                'bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate flex-1 mr-2" title={item.url}>
                  {item.url}
                </span>
                {item.status === 'detecting' && (
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {item.status === 'success' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.detectedType === 'image' ? 'bg-accent text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {item.detectedType === 'image' ? dict.frame.image : dict.frame.video}
                  </span>
                )}
                {item.status === 'failed' && (
                  <span className="text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </div>
              {item.status === 'success' && item.originalType !== item.detectedType && (
                <p className="text-xs text-blue-600">
                  {dict.frame.autoDetected}: {item.detectedType === 'image' ? dict.frame.image : dict.frame.video}
                </p>
              )}
              {item.status === 'failed' && item.error && (
                <p className="text-xs text-red-600">{item.error}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {failedCount > 0 && (
            <button
              onClick={onRetry}
              disabled={isDetecting}
              className="flex-1 neumorphic-button disabled:opacity-50"
            >
              {dict.frame.retry}
            </button>
          )}
          <button
            onClick={onClose}
            className={`${failedCount > 0 ? '' : 'flex-1'} neumorphic-button`}
          >
            {dict.frame.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={successCount === 0 || isDetecting}
            className="flex-1 neumorphic-button-primary disabled:opacity-50"
          >
            {dict.frame.confirm} ({successCount})
          </button>
        </div>
      </div>
    </div>
  );
}