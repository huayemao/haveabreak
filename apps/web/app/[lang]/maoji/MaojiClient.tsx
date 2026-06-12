'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMaojiStore } from '@/apps/maoji/store';
import { EPD_SPECS, getEpdSpec } from '@/apps/maoji/epdSpecs';
import { renderCanvasToEpdBytes } from '@/apps/maoji/utils/dither';
import {
  enableNfc, prepareWrite, onWriteProgress, onWriteSuccess, onWriteError, NfcStructuredError
} from '@/apps/maoji/nfcService';
import { toast } from 'sonner';
import ScreenSelector from './components/ScreenSelector';
import TemplatePanel from './components/TemplatePanel';
import CanvasEditor from './components/CanvasEditor';
import NfcWriteDialog from './components/NfcWriteDialog';
import NfcErrorPanel from './components/NfcErrorPanel';
import DesignHistory from './components/DesignHistory';
import { Monitor, History, PlusCircle, Wifi, Bug } from 'lucide-react';

type Tab = 'editor' | 'history';

export default function MaojiClient() {
  const {
    loadData, currentDesign, newDesign, settings, nfc, setNfc, resetNfc, pushNfcError, clearNfcErrors,
  } = useMaojiStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tab, setTab] = useState<Tab>('editor');
  const [showNfcDialog, setShowNfcDialog] = useState(false);
  const [nfcDetected, setNfcDetected] = useState(false);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [nfcDetecting, setNfcDetecting] = useState(false);

  useEffect(() => { loadData(); }, [loadData]);

  // Start a fresh design on first load if none exists
  useEffect(() => {
    if (!currentDesign) {
      newDesign(settings.lastEpdInch, settings.lastEpdColor);
    }
  }, [currentDesign, newDesign, settings]);

  // Auto-detect NFC on mount
  useEffect(() => {
    const autoDetect = async () => {
      setNfcDetecting(true);
      const result = await enableNfc();
      
      // 处理 Kotlin 层或调用异常返回的业务错误
      if (result?.error) {
        const errorMsg = `NFC 启用失败：${result.error}`;
        pushNfcError({
          layer: result.stackTrace ? 'tauri' : 'kotlin',
          code: 'NFC_ENABLE_FAILED',
          message: errorMsg,
          detail: result.stackTrace,
          phase: 'enableNfc',
        });
        toast.error(errorMsg);
      }
      if (result?.dispatchError) {
        const errorMsg = `NFC 前台分发注册失败：${result.dispatchError}`;
        pushNfcError({
          layer: 'kotlin',
          code: 'FOREGROUND_DISPATCH_FAILED',
          message: errorMsg,
          phase: 'enableForegroundDispatch',
        });
        toast.warning(errorMsg);
      }
      
      // 无论结果如何都允许继续
      setNfcDetected(true);
      if (result?.supported) {
        toast.success('NFC 已就绪！');
      } else if (!result?.error) {
        toast.info('NFC 未检测到，仍可尝试写入');
      }
      
      setNfcDetecting(false);
    };
    autoDetect();
  }, [pushNfcError]);

  const handleStartWrite = useCallback(async () => {
    if (!currentDesign) {
      pushNfcError({ layer: 'js', code: 'NO_DESIGN', message: '请先创建一个设计', phase: 'handleStartWrite' });
      toast.error('请先创建一个设计');
      return;
    }
    if (!canvasRef.current) {
      pushNfcError({ layer: 'js', code: 'CANVAS_NOT_READY', message: '画布未准备好，请刷新页面重试', phase: 'handleStartWrite' });
      toast.error('画布未准备好，请刷新页面重试');
      return;
    }

    const spec = getEpdSpec(currentDesign.epdInch);
    if (!spec) {
      pushNfcError({ layer: 'js', code: 'EPD_SPEC_NOT_FOUND', message: `未找到 ${currentDesign.epdInch} 寸墨水屏规格`, phase: 'getEpdSpec' });
      toast.error('未找到对应的墨水屏规格');
      return;
    }

    const cmds = spec.colorCodes[currentDesign.epdColor];
    if (!cmds?.initCmd1) {
      pushNfcError({ layer: 'js', code: 'COLOR_MODE_NOT_SUPPORTED', message: `${currentDesign.epdInch} 寸屏不支持 ${currentDesign.epdColor} 色模式`, phase: 'colorCodeCheck' });
      toast.error('当前墨水屏规格不支持所选颜色模式');
      return;
    }

    toast.info('正在渲染画面…');

    let bwData: number[];
    let rwData: number[] | null;
    try {
      const rendered = renderCanvasToEpdBytes(
        canvasRef.current,
        currentDesign.epdColor,
        spec.width,
        spec.height
      );
      bwData = rendered.bwData;
      rwData = rendered.rwData;
    } catch (err: any) {
      pushNfcError({
        layer: 'js',
        code: 'RENDER_FAILED',
        message: `画面渲染失败：${err?.message || '未知错误'}`,
        detail: err?.stack,
        phase: 'renderCanvasToEpdBytes',
      });
      toast.error(`画面渲染失败：${err?.message || '未知错误'}`);
      return;
    }

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
      const unError = await onWriteError((error: NfcStructuredError) => {
        pushNfcError({
          layer: error.layer || 'kotlin',
          code: error.code,
          message: `写入失败：${error.message}`,
          detail: error.detail,
          phase: error.phase || 'onWriteError',
        });
        setNfc({ status: 'error', progress: 0, message: error.message });
        toast.error(`写入失败：${error.message}`);
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
      pushNfcError({
        layer: 'tauri',
        code: 'PREPARE_WRITE_FAILED',
        message: `写入过程出错：${err?.message || '未知错误'}`,
        detail: err?.stack,
        phase: 'prepareWrite',
      });
      toast.error(`写入过程出错：${err?.message || '未知错误'}`);
    }
  }, [currentDesign, setNfc, pushNfcError]);

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
          onClick={handleStartWrite}
          disabled={!currentDesign || nfcDetecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-sm font-semibold disabled:opacity-40 transition-all duration-300 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6C63FF, #8B84FF)',
            boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
          }}
        >
          <Wifi className="w-4 h-4" />
          {nfcDetecting ? '检测中...' : '写入'}
        </button>

        {/* Debug panel toggle */}
        {nfc.errors.length > 0 && (
          <button
            onClick={() => setShowErrorPanel(!showErrorPanel)}
            className="relative p-2 rounded-2xl transition-all duration-300 active:scale-95"
            style={{
              boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
            }}
          >
            <Bug className="w-4 h-4 text-red-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
              {nfc.errors.length}
            </span>
          </button>
        )}
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

      {/* ── NFC Error Debug Panel ──────────────────────────────────── */}
      {showErrorPanel && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-50" onClick={() => setShowErrorPanel(false)}>
          <div
            className="w-full max-h-[70vh] rounded-t-3xl p-4 overflow-hidden"
            style={{
              background: '#E0E5EC',
              boxShadow: '0 -4px 20px rgba(163,177,198,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#3D4852]">NFC 调试面板</h3>
              <button
                onClick={() => setShowErrorPanel(false)}
                className="p-1 rounded-full hover:bg-[#CBD5E1] transition-colors"
              >
                <Bug className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-3rem)]">
              <NfcErrorPanel
                errors={nfc.errors}
                onClear={clearNfcErrors}
                onClose={() => setShowErrorPanel(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
