'use client';

import { useRouter } from 'i18n/routing';
import { useCardStore } from '@haveabreak/card/store';
import CardSettingsPanel from './CardSettingsPanel';

export default function SettingsModal() {
  const router = useRouter();
  const { exportData, importData, loadData, books } = useCardStore();

  const handleClose = () => {
    router.back();
  };

  const handleExport = async (filename: string) => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = (data: string) => {
    importData(data);
    loadData();
  };

  return (
    <CardSettingsPanel
      onClose={handleClose}
      books={books}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}
