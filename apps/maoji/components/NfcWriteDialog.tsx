'use client';

import { NfcState } from '@haveabreak/maoji/types';
import { Wifi, CheckCircle, AlertCircle, X } from 'lucide-react';

interface NfcWriteDialogProps {
  nfc: NfcState;
  onClose: () => void;
}

export default function NfcWriteDialog({ nfc, onClose }: NfcWriteDialogProps) {
  const isComplete = nfc.status === 'success';
  const isError = nfc.status === 'error';
  const isWriting = nfc.status === 'writing';
  const isReady = nfc.status === 'ready';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm p-6 rounded-[32px]"
        style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {(isComplete || isError) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-[#6B7280]"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              boxShadow: isComplete
                ? 'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)'
                : isError
                  ? 'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)'
                  : '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
            }}
          >
            {isComplete ? (
              <CheckCircle className="w-8 h-8 text-[#38B2AC]" />
            ) : isError ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <Wifi className={`w-8 h-8 ${isWriting ? 'text-[#6C63FF] animate-pulse' : 'text-[#6B7280]'}`} />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center text-base font-bold text-[#3D4852] mb-1">
          {isComplete ? '写入成功！' : isError ? '写入失败' : isWriting ? '正在写入...' : '准备写入'}
        </h3>

        {/* Message */}
        <p className="text-center text-xs text-[#6B7280] mb-4">
          {nfc.message || '请将手机背面贴近墨水屏线圈处'}
        </p>

        {/* Progress bar */}
        {(isWriting || isComplete) && (
          <div
            className="w-full h-3 rounded-full mb-4"
            style={{
              boxShadow: 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${nfc.progress}%`,
                background: isComplete
                  ? 'linear-gradient(135deg, #38B2AC, #4FD1C5)'
                  : 'linear-gradient(135deg, #6C63FF, #8B84FF)',
              }}
            />
          </div>
        )}

        {/* Progress text */}
        {(isWriting || isComplete) && (
          <p className="text-center text-xs text-[#6B7280] mb-4">
            {Math.round(nfc.progress)}%
          </p>
        )}

        {/* Action buttons */}
        {(isComplete || isError) && (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
            style={{
              background: isComplete
                ? 'linear-gradient(135deg, #38B2AC, #4FD1C5)'
                : 'linear-gradient(135deg, #EF4444, #F87171)',
              boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
            }}
          >
            {isComplete ? '完成' : '重试'}
          </button>
        )}

        {/* Waiting animation */}
        {isReady && (
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#6C63FF]"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bounce animation keyframes */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
