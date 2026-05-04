"use client";
import { useFrameStore } from '@/apps/frame/store';
import SettingsPanel from '@/apps/frame/components/SettingsPanel';
import { exportData } from '@/apps/frame/storage';

export default function SettingsPageClient() {
  const {
    settings,
    updateSettings,
    importData,
  } = useFrameStore();

  const handleExport = async () => {
    // ... same as before ...
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'frame-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <SettingsPanel
      settings={settings}
      onUpdate={updateSettings}
      onExport={handleExport}
      onImport={importData}
    />
  );
}
