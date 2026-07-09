'use client';

import { useMaojiStore } from '@haveabreak/maoji/store';
import { EPD_SPECS } from '@haveabreak/maoji/epdSpecs';
import { Monitor, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@haveabreak/ui/components/ui/dropdown-menu';

export default function ScreenSelector() {
  const { currentDesign, settings, updateSettings, setDesignProperty, newDesign } = useMaojiStore();

  const currentSpec = EPD_SPECS.find(s => s.inch === currentDesign?.epdInch);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#6B7280] transition-all duration-300"
          style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
        >
          <Monitor className="w-3.5 h-3.5" />
          {currentSpec?.label || '选择屏幕'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 rounded-2xl p-2 bg-[#E0E5EC] border-none"
        style={{
          boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] text-[#6B7280] px-2 py-1 font-medium">
            墨水屏尺寸
          </DropdownMenuLabel>
          {EPD_SPECS.map(spec => (
            <DropdownMenuItem
              key={spec.inch}
              onClick={() => {
                updateSettings({ lastEpdInch: spec.inch });
                if (currentDesign && currentDesign.epdInch !== spec.inch) {
                  newDesign(spec.inch, settings.lastEpdColor);
                }
              }}
              className="rounded-xl text-xs px-3 py-2 transition-all duration-200"
              style={{
                color: currentDesign?.epdInch === spec.inch ? '#6C63FF' : '#3D4852',
                boxShadow: currentDesign?.epdInch === spec.inch
                  ? 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)'
                  : 'none',
              }}
            >
              {currentDesign?.epdInch === spec.inch && (
                <Check className="mr-2 h-3 w-3" />
              )}
              {spec.label} ({spec.width}×{spec.height})
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-[#A3B1C6]/20 my-1" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] text-[#6B7280] px-2 py-1 font-medium">
            颜色模式
          </DropdownMenuLabel>
          {([2, 3, 4] as const).map(mode => {
            const label = mode === 2 ? '黑白' : mode === 3 ? '黑白红' : '四色';
            const supported = currentSpec?.supportedColors.includes(mode);
            return (
              <DropdownMenuItem
                key={mode}
                disabled={!supported}
                onClick={() => {
                  updateSettings({ lastEpdColor: mode });
                  if (currentDesign && currentDesign.epdColor !== mode) {
                    newDesign(currentDesign.epdInch, mode);
                  }
                }}
                className="rounded-xl text-xs px-3 py-2 transition-all duration-200 disabled:opacity-30"
                style={{
                  color: currentDesign?.epdColor === mode ? '#6C63FF' : '#3D4852',
                  boxShadow: currentDesign?.epdColor === mode
                    ? 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)'
                    : 'none',
                }}
              >
                {currentDesign?.epdColor === mode && (
                  <Check className="mr-2 h-3 w-3" />
                )}
                {label} {supported ? '' : '(不支持)'}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
