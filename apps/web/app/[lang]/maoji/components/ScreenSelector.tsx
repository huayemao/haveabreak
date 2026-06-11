'use client';

import { useMaojiStore } from '@/apps/maoji/store';
import { EPD_SPECS } from '@/apps/maoji/epdSpecs';
import { Monitor } from 'lucide-react';

export default function ScreenSelector() {
  const { currentDesign, settings, updateSettings, setDesignProperty, newDesign } = useMaojiStore();

  const currentSpec = EPD_SPECS.find(s => s.inch === currentDesign?.epdInch);

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#6B7280] transition-all duration-300"
          style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
        >
          <Monitor className="w-3.5 h-3.5" />
          {currentSpec?.label || '选择屏幕'}
        </button>

        {/* Dropdown */}
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-2xl p-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300"
          style={{
            background: '#E0E5EC',
            boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
          }}
        >
          <p className="text-[10px] text-[#6B7280] px-2 py-1 font-medium">墨水屏尺寸</p>
          {EPD_SPECS.map(spec => (
            <button
              key={spec.inch}
              onClick={() => {
                updateSettings({ lastEpdInch: spec.inch });
                if (currentDesign && currentDesign.epdInch !== spec.inch) {
                  newDesign(spec.inch, settings.lastEpdColor);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200"
              style={{
                color: currentDesign?.epdInch === spec.inch ? '#6C63FF' : '#3D4852',
                boxShadow: currentDesign?.epdInch === spec.inch
                  ? 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)'
                  : 'none',
              }}
            >
              {spec.label} ({spec.width}×{spec.height})
            </button>
          ))}

          <div className="h-px bg-[#A3B1C6]/20 my-1" />
          <p className="text-[10px] text-[#6B7280] px-2 py-1 font-medium">颜色模式</p>
          {([2, 3, 4] as const).map(mode => {
            const label = mode === 2 ? '黑白' : mode === 3 ? '黑白红' : '四色';
            const supported = currentSpec?.supportedColors.includes(mode);
            return (
              <button
                key={mode}
                disabled={!supported}
                onClick={() => {
                  updateSettings({ lastEpdColor: mode });
                  if (currentDesign && currentDesign.epdColor !== mode) {
                    newDesign(currentDesign.epdInch, mode);
                  }
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 disabled:opacity-30"
                style={{
                  color: currentDesign?.epdColor === mode ? '#6C63FF' : '#3D4852',
                  boxShadow: currentDesign?.epdColor === mode
                    ? 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)'
                    : 'none',
                }}
              >
                {label} {supported ? '' : '(不支持)'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
