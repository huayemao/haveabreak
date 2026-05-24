import { useTranslations } from 'next-intl';
import { FrameSettings, Collection } from '../types';
import { useScrollLock } from '../utils/useScrollLock';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const fetchUrlContent = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
};

interface SettingsPanelProps {
  settings: FrameSettings;
  collections: Collection[];
  onUpdate: (settings: FrameSettings) => void;
  onExport: (filename: string) => void;
  onImport: (data: string) => void;
}

export default function SettingsPanel({
  settings,
  collections,
  onUpdate,
  onExport,
  onImport,
}: SettingsPanelProps) {
  const t = useTranslations();
  const [showImportModal, setShowImportModal] = useState(false);
  useScrollLock(showImportModal);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            onImport(content);
            setSuccessMessage(t('common.importSuccess'));
            setShowSuccess(true);
            setShowImportModal(false);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch {
            alert(t('common.importFailed'));
          }
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleExport = () => {
    const collectionName = collections.length > 0
      ? collections.map(c => c.name).join('-')
      : 'all';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${collectionName}-${timestamp}.json`;
    onExport(filename);
    setSuccessMessage(t('common.exportSuccess'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      alert(t('common.enterUrl') || 'Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      const content = await fetchUrlContent(urlInput);
      onImport(content);
      setSuccessMessage(t('common.importSuccess'));
      setShowSuccess(true);
      setShowImportModal(false);
      setUrlInput('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert(t('common.urlImportFailed') || 'Failed to import from URL');
    } finally {
      setIsLoading(false);
    }
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
        <h2 className="text-xl font-bold text-fg-primary">{t('frame.settings')}</h2>
        {showSuccess && (
          <span className="text-accent-sec text-sm">{successMessage}</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{t('frame.autoPlay')}</span>
          <Switch
            checked={settings.autoPlay}
            onCheckedChange={() => toggleSetting('autoPlay')}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{t('frame.shuffle')}</span>
          <Switch
            checked={settings.shuffle}
            onCheckedChange={() => toggleSetting('shuffle')}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{t('frame.showInfo')}</span>
          <Switch
            checked={settings.showInfo}
            onCheckedChange={() => toggleSetting('showInfo')}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-[32px]" style={{
          background: '#E0E5EC',
          boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        }}>
          <span className="font-medium text-fg-primary">{t('frame.filterOrientation')}</span>
          <Switch
            checked={settings.filterByOrientation}
            onCheckedChange={() => toggleSetting('filterByOrientation')}
          />
        </div>
      </div>

      <div className="p-4 rounded-[32px]" style={{
        background: '#E0E5EC',
        boxShadow: '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
      }}>
        <label className="block font-medium text-fg-primary mb-3">
          {t('frame.slideInterval')}: {Math.round(settings.slideInterval / 1000)}s
        </label>
        <Slider
          value={[Math.round(settings.slideInterval / 1000)]}
          onValueChange={([value]) => updateSetting('slideInterval', value * 1000)}
          min={3}
          max={60}
          step={1}
          className="w-full"
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
          {t('frame.volume')}: {Math.round(settings.volume * 100)}%
        </label>
        <Slider
          value={[Math.round(settings.volume * 100)]}
          onValueChange={([value]) => updateSetting('volume', value / 100)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-fg-muted mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-fg-primary">{t('common.import')} / {t('common.export')}</h3>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 neumorphic-button p-4"
          >
            {t('common.export')}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 neumorphic-button p-4"
          >
            {t('common.import')}
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-dialog p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">{t('common.import')}</h3>

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-xl">
              <svg className="w-12 h-12 text-fg-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-fg-muted mb-4">{t('common.selectFile') || 'Select a JSON file'}</p>
              <label className="cursor-pointer neumorphic-button-primary px-6 py-2">
                {t('common.chooseFile') || 'Choose File'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-6">
              <label className="block font-medium text-fg-primary mb-2">
                {t('common.urlSubscription') || 'URL Subscription'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('common.enterUrlPlaceholder') || 'Enter JSON URL...'}
                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-muted focus:outline-none focus:border-accent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={isLoading}
                  className="neumorphic-button-primary px-4 py-2"
                >
                  {isLoading ? (t('common.loading') || 'Loading...') : (t('common.import') || 'Import')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 neumorphic-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}