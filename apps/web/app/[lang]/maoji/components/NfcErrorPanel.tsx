'use client';

import { useState } from 'react';
import { NfcErrorEntry } from '@/apps/maoji/types';
import { ChevronDown, ChevronRight, Copy, X, Bug, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface NfcErrorPanelProps {
  errors: NfcErrorEntry[];
  onClear: () => void;
  onClose: () => void;
}

const layerColors: Record<string, string> = {
  js: '#3B82F6',
  tauri: '#8B5CF6',
  kotlin: '#F59E0B',
  hardware: '#EF4444',
};

const layerLabels: Record<string, string> = {
  js: 'JS',
  tauri: 'Tauri',
  kotlin: 'Kotlin',
  hardware: '硬件',
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any);
}

function ErrorDetailRow({ entry }: { entry: NfcErrorEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl mb-2 overflow-hidden"
      style={{
        boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />}

        {/* Layer badge */}
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: layerColors[entry.layer] || '#6B7280' }}
        >
          {layerLabels[entry.layer] || entry.layer}
        </span>

        {/* Error code */}
        {entry.code && (
          <span className="text-[10px] font-mono text-[#6C63FF] flex-shrink-0">
            [{entry.code}]
          </span>
        )}

        {/* Message */}
        <span className="text-xs text-[#3D4852] truncate flex-1">
          {entry.message}
        </span>

        {/* Time */}
        <span className="text-[9px] text-[#9CA3AF] font-mono flex-shrink-0">
          {formatTime(entry.timestamp)}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-0">
          {/* Phase info */}
          {entry.phase && (
            <div className="flex items-center gap-1 mb-2">
              <Info className="w-3 h-3 text-[#6B7280]" />
              <span className="text-[10px] text-[#6B7280]">
                阶段: <code className="font-mono text-[#6C63FF]">{entry.phase}</code>
              </span>
            </div>
          )}

          {/* Detail / stack trace */}
          {entry.detail && (
            <div className="relative">
              <div
                className="rounded-xl p-2 font-mono text-[10px] text-[#EF4444] overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto"
                style={{
                  background: '#1E1E2E',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.05)',
                }}
              >
                {entry.detail}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(entry.detail!)}
                className="absolute top-1 right-1 p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="复制详情"
              >
                <Copy className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          {/* Copy all info */}
          <button
            onClick={() => {
              const text = [
                `[${layerLabels[entry.layer] || entry.layer}] ${entry.code || 'NO_CODE'}`,
                `Phase: ${entry.phase || 'N/A'}`,
                `Time: ${formatTime(entry.timestamp)}`,
                `Message: ${entry.message}`,
                entry.detail ? `Detail:\n${entry.detail}` : '',
              ].filter(Boolean).join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="mt-2 flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#6C63FF] transition-colors"
          >
            <Copy className="w-3 h-3" />
            复制完整信息
          </button>
        </div>
      )}
    </div>
  );
}

export default function NfcErrorPanel({ errors, onClear, onClose }: NfcErrorPanelProps) {
  const [showDetail, setShowDetail] = useState(false);

  if (errors.length === 0) {
    return (
      <div
        className="rounded-3xl p-4 mb-3"
        style={{
          background: '#E0E5EC',
          boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#6B7280]" />
            <span className="text-xs font-medium text-[#6B7280]">调试面板</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">暂无错误</span>
        </div>
      </div>
    );
  }

  const hasCritical = errors.some(e => e.layer === 'hardware' || e.layer === 'kotlin');
  const Icon = hasCritical ? AlertCircle : AlertTriangle;

  return (
    <div
      className="rounded-3xl p-4 mb-3"
      style={{
        background: '#E0E5EC',
        boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-2"
        >
          <Icon className={`w-4 h-4 ${hasCritical ? 'text-red-500' : 'text-[#F59E0B]'}`} />
          <span className="text-xs font-medium text-[#3D4852]">
            调试面板 ({errors.length} 条错误)
          </span>
          {showDetail ? <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1 rounded-full hover:bg-[#CBD5E1] transition-colors"
            title="清空错误"
          >
            <X className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#CBD5E1] transition-colors"
            title="关闭面板"
          >
            <X className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {!showDetail && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(
            errors.reduce((acc, e) => {
              acc[e.layer] = (acc[e.layer] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([layer, count]) => (
            <span
              key={layer}
              className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: layerColors[layer] || '#6B7280' }}
            >
              {layerLabels[layer]}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Error list */}
      {showDetail && (
        <div className="mt-2 max-h-64 overflow-y-auto">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {Object.entries(layerColors).map(([layer, color]) => (
              <span key={layer} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-[#6B7280]">{layerLabels[layer]}</span>
              </span>
            ))}
          </div>

          {errors.map(entry => (
            <ErrorDetailRow key={entry.id} entry={entry} />
          ))}

          {/* Export all */}
          <button
            onClick={() => {
              const text = errors.map(e =>
                [
                  `[${formatTime(e.timestamp)}] [${layerLabels[e.layer]}] ${e.code || 'NO_CODE'}`,
                  `Phase: ${e.phase || 'N/A'}`,
                  `Message: ${e.message}`,
                  e.detail ? `Detail:\n${e.detail}` : '',
                ].filter(Boolean).join('\n')
              ).join('\n\n---\n\n');
              navigator.clipboard.writeText(text);
            }}
            className="w-full mt-2 py-2 rounded-xl text-[10px] font-medium text-[#6C63FF] transition-colors hover:bg-[#CBD5E1]/50"
            style={{
              boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)',
            }}
          >
            <Copy className="w-3 h-3 inline mr-1" />
            复制全部错误日志
          </button>
        </div>
      )}
    </div>
  );
}
