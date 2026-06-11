'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMaojiStore } from '@/apps/maoji/store';
import { EPD_SPECS, getEpdSpec } from '@/apps/maoji/epdSpecs';
import { renderCanvasToEpdBytes } from '@/apps/maoji/utils/dither';
import {
  enableNfc, prepareWrite, onWriteProgress, onWriteSuccess, onWriteError
} from '@/apps/maoji/nfcService';
import { toast } from 'sonner';
import ScreenSelector from './components/ScreenSelector';
import TemplatePanel from './components/TemplatePanel';
import CanvasEditor from './components/CanvasEditor';
import NfcWriteDialog from './components/NfcWriteDialog';
import DesignHistory from './components/DesignHistory';
import { Monitor, History, PlusCircle, Wifi } from 'lucide-react';

type Tab = 'editor' | 'history';

export default function MaojiClient() {
  const {
    loadData, currentDesign, newDesign, settings, nfc, setNfc, resetNfc,
  } = useMaojiStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tab, setTab] = useState<Tab>('editor');
  const [showNfcDialog, setShowNfcDialog] = useState(false);
  const [nfcDetected, setNfcDetected] = useState(false);

  useEffect(() => { loadData(); }, [loadData]);

  // Start a fresh design on first load if none exists
  useEffect(() => {
    if (!currentDesign) {
      newDesign(settings.lastEpdInch, settings.lastEpdColor);
    }
  }, [currentDesign, newDesign, settings]);

  const handleDetectNfc = useCallback(async () => {
    try {
      toast.info('正在检测 NFC…');
      const result = await enableNfc();
      if (result?.error) {
        // Android 端捕获了完整异常，返回详细错误信息
        toast.error(`NFC 检测失败：${result.error}`);
        console.error('NFC enableNfc error details:', result.stackTrace);
        return;
      }
      if (result?.dispatchError) {
        // enableForegroundDispatch 失败，但不影响继续
        console.warn('NFC foreground dispatch 注册失败:', result.dispatchError);
      }
      if (result?.supported) {
        setNfcDetected(true);
        toast.success('NFC 已检测到！');
      } else {
        toast.warning('NFC 不可用，但仍可尝试写入');
        setNfcDetected(true); // Allow proceeding even if not supported (simulation mode)
      }
    } catch (err: any) {
      toast.error(`NFC 检测失败：${err?.message || '未知错误'}`);
    }
  }, [setNfcDetected]);

  const handleStartWrite = useCallback(async () => {
    if (!currentDesign) {
      toast.error('请先创建一个设计');
      return;
    }
    if (!canvasRef.current) {
      toast.error('画布未准备好，请刷新页面重试');
      return;
    }

    const spec = getEpdSpec(currentDesign.epdInch);
    if (!spec) {
      toast.error('未找到对应的墨水屏规格');
      return;
    }

    const cmds = spec.colorCodes[currentDesign.epdColor];
    if (!cmds?.initCmd1) {
      toast.error('当前墨水屏规格不支持所选颜色模式');
      return;
    }

    toast.info('正在渲染画面…');

    // Render canvas → EPD byte arrays
    const { bwData, rwData } = renderCanvasToEpdBytes(
      canvasRef.current,
      currentDesign.epdColor,
      spec.width,
      spec.height
    );

    toast.info('正在初始化 NFC…');

    setNfc({ status: 'ready', progress: 0, message: '正在准备数据…' });
    setShowNfcDialog(true);

    try {
      // Register NFC event listeners
      const unProgress = await onWriteProgress((progress, message) => {
        setNfc({ status: 'writing', progress, message });
      });
      const unSuccess = await onWriteSuccess((message) => {
        setNfc({ status: 'success', progress: 100, message });
        toast.success('写入成功！');
        unProgress(); unSuccess(); unError();
      });
      const unError = await onWriteError((message) => {
        setNfc({ status: 'error', progress: 0, message });
        toast.error(`写入失败：${message}`);
        unProgress(); unSuccess(); unError();
      });

      // NFC already enabled during detection, just push data to plugin
      toast.info('NFC 已启用，正在发送数据…');

      await prepareWrite({
        epdColor: currentDesign.epdColor,
        epdInch: currentDesign.epdInch,
        initCmd1: cmds.initCmd1,
        initCmd2: cmds.initCmd2,
        bwData,
        rwData,
      });

      setNfc({ status: 'ready', progress: 0, message: '请将手机贴近墨水屏背面线圈处…' });
    } catch (err: any) {
      toast.error(`写入过程出错：${err?.message || '未知错误'}`);
    }
  }, [currentDesign, setNfc]);

  return (
    <div className="flex flex-col h-screen bg-[#E0E5EC] overflow-hidden select-none">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ boxShadow: '0 4px 12px rgba(163,177,198,0.4), 0 -2px 6px rgba(255,255,255,0.6)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl"
            style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}>
            🐱
          </div>
          <div>
            <h1 className="font-bold text-[#3D4852] text-base leading-tight">猫记</h1>
            {currentDesign && (
              <p className="text-[10px] text-[#6B7280] leading-tight truncate max-w-[140px]">
                {currentDesign.name}
              </p>
            )}
          </div>
        </div>

        {/* Screen spec quick-switcher */}
        <ScreenSelector />

        {/* Write button */}
        <button
          onClick={nfcDetected ? handleStartWrite : handleDetectNfc}
          disabled={!currentDesign}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-sm font-semibold disabled:opacity-40 transition-all duration-300 active:scale-95"
          style={{
            background: nfcDetected
              ? 'linear-gradient(135deg, #6C63FF, #8B84FF)'
              : 'linear-gradient(135deg, #10B981, #34D399)',
            boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
          }}
        >
          <Wifi className="w-4 h-4" />
          {nfcDetected ? '写入' : '检测'}
        </button>
      </header>

      {/* ── Tab Bar ────────────────────────────────────────────────── */}
      <nav className="flex gap-2 px-5 pt-2 pb-1 flex-shrink-0">
        {([
          { key: 'editor', label: '编辑器', Icon: Monitor },
          { key: 'history', label: '历史设计', Icon: History },
        ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300"
            style={{
              color: tab === key ? '#6C63FF' : '#6B7280',
              boxShadow: tab === key
                ? 'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)'
                : '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            newDesign(settings.lastEpdInch, settings.lastEpdColor);
            setTab('editor');
          }}
          className="ml-auto flex items-center gap-1 px-3 py-2 rounded-2xl text-sm text-[#6B7280] transition-all duration-300 active:scale-95"
          style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
        >
          <PlusCircle className="w-4 h-4" />
          新建
        </button>
      </nav>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {tab === 'editor' && currentDesign && (
          <div className="flex flex-col h-full">
            {/* Template gallery */}
            <div className="flex-shrink-0 px-4 pt-2">
              <TemplatePanel />
            </div>
            {/* Canvas editor */}
            <div className="flex-1 overflow-hidden px-4 pb-4">
              <CanvasEditor ref={canvasRef} />
            </div>
          </div>
        )}
        {tab === 'history' && (
          <div className="h-full overflow-y-auto px-4 py-2">
            <DesignHistory onOpen={() => setTab('editor')} />
          </div>
        )}
      </div>

      {/* ── NFC Write Dialog ───────────────────────────────────────── */}
      {showNfcDialog && (
        <NfcWriteDialog
          nfc={nfc}
          onClose={() => { setShowNfcDialog(false); resetNfc(); }}
        />
      )}
    </div>
  );
}
