import { useState } from 'react';
import { FrameSettings } from '../types';
import { Dictionary } from '@/dictionaries';

interface SettingsPanelProps {
  settings: FrameSettings;
  onUpdate: (settings: FrameSettings) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onImportUrlList: (urls: string[]) => void;
  dict: Dictionary;
}

export default function SettingsPanel({
  settings,
  onUpdate,
  onExport,
  onImport,
  onImportUrlList,
  dict,
}: SettingsPanelProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [showUrlImportModal, setShowUrlImportModal] = useState(false);
  const [urlList, setUrlList] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImport = () => {
    if (importData.trim()) {
      try {
        onImport(importData.trim());
        setSuccessMessage(dict.frame.importSuccess);
        setShowSuccess(true);
        setImportData('');
        setShowImportModal(false);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch {
        alert(dict.frame.importFailed);
      }
    }
  };

  const handleUrlImport = () => {
    if (urlList.trim()) {
      const urls = urlList.split('\n').filter((url) => url.trim());
      onImportUrlList(urls);
      setSuccessMessage(dict.frame.importSuccess);
      setShowSuccess(true);
      setUrlList('');
      setShowUrlImportModal(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleExport = () => {
    onExport();
    setSuccessMessage(dict.frame.exportSuccess);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleSetting = (key: keyof FrameSettings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const updateSetting = <K extends keyof FrameSettings>(key: K, value: FrameSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-fg-primary">{dict.frame.settings}</h2>
        {showSuccess && (
          <span className="text-accent-sec text-sm">{successMessage}</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{dict.frame.autoPlay}</span>
          <button
            onClick={() => toggleSetting('autoPlay')}
            className={`w-12 h-6 rounded-full transition-all ${
              settings.autoPlay ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.autoPlay ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{dict.frame.shuffle}</span>
          <button
            onClick={() => toggleSetting('shuffle')}
            className={`w-12 h-6 rounded-full transition-all ${
              settings.shuffle ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.shuffle ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{dict.frame.showInfo}</span>
          <button
            onClick={() => toggleSetting('showInfo')}
            className={`w-12 h-6 rounded-full transition-all ${
              settings.showInfo ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.showInfo ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{dict.frame.filterOrientation}</span>
          <button
            onClick={() => toggleSetting('filterByOrientation')}
            className={`w-12 h-6 rounded-full transition-all ${
              settings.filterByOrientation ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.filterByOrientation ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-[32px]" style={{
        background: '#E0E5EC',
        boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
      }}>
        <label className="block font-medium text-fg-primary mb-3">
          {dict.frame.slideInterval}: {Math.round(settings.slideInterval / 1000)}s
        </label>
        <input
          type="range"
          min="3"
          max="60"
          value={Math.round(settings.slideInterval / 1000)}
          onChange={(e) => updateSetting('slideInterval', Number(e.target.value) * 1000)}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #6C63FF 0%, #6C63FF ' + 
              ((Math.round(settings.slideInterval / 1000) - 3) / 57 * 100) + 
              '%, #E0E5EC ' + ((Math.round(settings.slideInterval / 1000) - 3) / 57 * 100) + '%)'
          }}
        />
        <div className="flex justify-between text-xs text-fg-muted mt-1">
          <span>3s</span>
          <span>60s</span>
        </div>
      </div>

      <div className="p-4 rounded-[32px]" style={{
        background: '#E0E5EC',
        boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
      }}>
        <label className="block font-medium text-fg-primary mb-3">
          {dict.frame.volume}: {Math.round(settings.volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(settings.volume * 100)}
          onChange={(e) => updateSetting('volume', Number(e.target.value) / 100)}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #6C63FF 0%, #6C63FF ' + 
              (settings.volume * 100) + 
              '%, #E0E5EC ' + (settings.volume * 100) + '%)'
          }}
        />
        <div className="flex justify-between text-xs text-fg-muted mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-fg-primary">{dict.frame.import} / {dict.frame.export}</h3>
        
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 neumorphic-button"
          >
            {dict.frame.export}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 neumorphic-button"
          >
            {dict.frame.import}
          </button>
        </div>

        <button
          onClick={() => setShowUrlImportModal(true)}
          className="w-full neumorphic-button"
        >
          {dict.frame.importUrlList}
        </button>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.import}</h3>
            
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"media": [...], "collections": [...]}'
              rows={8}
              className="neumorphic-input w-full resize-none font-mono text-sm"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
              <button
                onClick={handleImport}
                className="flex-1 neumorphic-button-primary"
              >
                {dict.frame.import}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUrlImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">{dict.frame.importUrlList}</h3>
            
            <textarea
              value={urlList}
              onChange={(e) => setUrlList(e.target.value)}
              placeholder={dict.frame.urlListPlaceholder}
              rows={8}
              className="neumorphic-input w-full resize-none font-mono text-sm"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUrlImportModal(false)}
                className="flex-1 neumorphic-button"
              >
                {dict.frame.cancel}
              </button>
              <button
                onClick={handleUrlImport}
                className="flex-1 neumorphic-button-primary"
              >
                {dict.frame.import}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}