'use client';

import { useMaojiStore } from '@/apps/maoji/store';
import { getEpdSpec } from '@/apps/maoji/epdSpecs';
import { Trash2, Edit2 } from 'lucide-react';

interface DesignHistoryProps {
  onOpen: () => void;
}

export default function DesignHistory({ onOpen }: DesignHistoryProps) {
  const { designs, openDesign, removeDesign, currentDesign } = useMaojiStore();

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
        <p className="text-sm">暂无历史设计</p>
        <p className="text-xs mt-1">创建新设计后将自动保存</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {designs.map(d => {
        const spec = getEpdSpec(d.epdInch);
        const colorLabel = d.epdColor === 2 ? '黑白' : d.epdColor === 3 ? '黑白红' : '四色';
        const isCurrent = currentDesign?.id === d.id;

        return (
          <div
            key={d.id}
            className={`rounded-2xl p-3 transition-all duration-300 ${isCurrent ? 'ring-2 ring-[#6C63FF]' : ''}`}
            style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
          >
            {/* Thumbnail preview */}
            <div
              className="w-full aspect-[3/4] rounded-xl mb-2 flex items-center justify-center overflow-hidden"
              style={{
                background: '#FFFFFF',
                boxShadow: 'inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.4)',
              }}
            >
              {d.thumbnail ? (
                <img src={d.thumbnail} alt={d.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <p className="text-[10px] text-[#A0AEC0]">{spec?.label}</p>
                  <p className="text-[8px] text-[#A0AEC0]">{d.elements.length} 个元素</p>
                </div>
              )}
            </div>

            {/* Info */}
            <h4 className="text-xs font-medium text-[#3D4852] truncate">{d.name}</h4>
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {spec?.label} · {colorLabel}
            </p>
            <p className="text-[9px] text-[#A0AEC0] mt-0.5">
              {new Date(d.updatedAt).toLocaleDateString('zh-CN')}
            </p>

            {/* Actions */}
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => {
                  openDesign(d.id);
                  onOpen();
                }}
                className="flex-1 py-1 rounded-lg text-[10px] flex items-center justify-center gap-0.5 text-[#6C63FF]"
                style={{ boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)' }}
              >
                <Edit2 className="w-3 h-3" />
                编辑
              </button>
              <button
                onClick={() => removeDesign(d.id)}
                className="py-1 px-2 rounded-lg text-[10px] text-red-400"
                style={{ boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)' }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
