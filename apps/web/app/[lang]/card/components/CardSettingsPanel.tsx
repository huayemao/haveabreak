'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '@/apps/frame/utils/useScrollLock';
import { useState } from 'react';
import { X, Download, Database, Settings, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Book, Subscription } from '@/apps/card/types';
import { useCardStore } from '@/apps/card/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DataManagementSection from './settings/DataManagementSection';
import SubscriptionSection from './settings/SubscriptionSection';
import SortSection from './settings/SortSection';
import AutoPlaySection from './settings/AutoPlaySection';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { isTauriBuild } from '@/lib/utils';
import { toast } from 'sonner';

interface CardSettingsPanelProps {
  onClose: () => void;
  books: Book[];
  onExport: (filename: string) => void;
  onImport: (data: string) => void;
}

export default function CardSettingsPanel({
  onClose,
  books,
  onExport,
  onImport,
}: CardSettingsPanelProps) {
  const t = useTranslations();
  useScrollLock();
  const [activeTab, setActiveTab] = useState('data');
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [newSubscriptionName, setNewSubscriptionName] = useState('');
  const [newSubscriptionUrl, setNewSubscriptionUrl] = useState('');
  const [showSubscriptionList, setShowSubscriptionList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    settings,
    exportData,
    subscriptionDiff,
    isChecking,
    hasUpdate,
    checkError,
    addSubscription,
    deleteSubscription,
    setActiveSubscription,
    checkSubscription,
    applyUpdate,
    clearUpdate,
    updateQuoteSortOrder,
    updateSwipeInterval,
    updateIsRandom,
  } = useCardStore();

  const handleAddSubscription = () => {
    if (newSubscriptionName.trim() && newSubscriptionUrl.trim()) {
      addSubscription(newSubscriptionName.trim(), newSubscriptionUrl.trim());
      setNewSubscriptionName('');
      setNewSubscriptionUrl('');
      setShowAddSubscription(false);
      toast.success(t('common.subscriptionAdded', { defaultValue: 'Subscription added!' }));
    }
  };

  const handleDeleteSubscription = (id: string) => {
    if (confirm(t('common.confirmDelete', { defaultValue: 'Are you sure you want to delete this subscription?' }))) {
      deleteSubscription(id);
    }
  };

  const handleSelectSubscription = (subscription: Subscription) => {
    setActiveSubscription(subscription.id);
    setShowSubscriptionList(false);
    clearUpdate();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            onImport(content);
            toast.success(t('common.importSuccess'));
          } catch {
            toast.error(t('common.importFailed'));
          }
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const bookName = books.length > 0
        ? books.map(b => b.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')).join('-')
        : 'all';
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${bookName}-${timestamp}.json`;
      const data = await exportData();

      if (isTauriBuild) {
        const filePath = await save({
          defaultPath: filename,
          filters: [
            {
              name: 'JSON',
              extensions: ['json'],
            },
          ],
        });

        if (filePath) {
          await writeTextFile(filePath, data);
          toast.success(t('common.exportSuccess'));
        }
      } else {
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(t('common.exportSuccess'));
      }
    } catch {
      toast.error(t('common.exportFailed', { defaultValue: 'Export failed' }));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSortOrderChange = (order: 'createdAt' | 'page') => {
    updateQuoteSortOrder(order);
    toast.success(t('card.sortOrderChanged', { defaultValue: 'Sort order updated!' }));
  };

  const handleSwipeIntervalChange = (interval: number) => {
    updateSwipeInterval(interval);
    toast.success(t('card.autoPlayIntervalChanged', { defaultValue: 'Auto play interval updated!' }));
  };

  const handleIsRandomChange = (isRandom: boolean) => {
    updateIsRandom(isRandom);
    toast.success(t('card.randomSettingChanged', { defaultValue: 'Random setting updated!' }));
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-fg-primary font-display flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            {t('card.settings', { defaultValue: 'Settings' })}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isExporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-sm rounded-[32px]"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <span className="text-fg-primary font-medium">
                  {t('card.exporting', { defaultValue: 'Exporting...' })}
                </span>
              </div>
            </motion.div>
          )}

          <div className="flex-shrink-0 px-8 pt-4 border-b border-white/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="data" className="flex-1 gap-1" >
                <Database className="w-3 h-3" />
                <span>{t('card.dataManagement', { defaultValue: 'Data' })}</span>
              </TabsTrigger>
              <TabsTrigger value="basic" className="flex-1 gap-1" >
                <Settings className="w-3 h-3" />
                <span>{t('card.basicSettings', { defaultValue: 'Basic' })}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="data" className="mt-0">
              <DataManagementSection
                books={books}
                onExport={handleExport}
                onImport={handleImport}
              />
              <div className="mt-6">
                <SubscriptionSection
                  subscriptions={settings.subscriptions}
                  activeSubscriptionId={settings.activeSubscriptionId}
                  subscriptionDiff={subscriptionDiff}
                  isChecking={isChecking}
                  hasUpdate={hasUpdate}
                  checkError={checkError}
                  showAddSubscription={showAddSubscription}
                  showSubscriptionList={showSubscriptionList}
                  newSubscriptionName={newSubscriptionName}
                  newSubscriptionUrl={newSubscriptionUrl}
                  onToggleAddSubscription={() => setShowAddSubscription(!showAddSubscription)}
                  onNameChange={setNewSubscriptionName}
                  onUrlChange={setNewSubscriptionUrl}
                  onAddSubscription={handleAddSubscription}
                  onCancelAddSubscription={() => setShowAddSubscription(false)}
                  onToggleSubscriptionList={() => setShowSubscriptionList(!showSubscriptionList)}
                  onSelectSubscription={handleSelectSubscription}
                  onDeleteSubscription={handleDeleteSubscription}
                  onCheckSubscription={() => checkSubscription()}
                  onApplyUpdate={applyUpdate}
                  onClearUpdate={clearUpdate}
                />
              </div>
            </TabsContent>

            <TabsContent value="basic" className="mt-0">
              <SortSection
                quoteSortOrder={settings.quoteSortOrder}
                onSortOrderChange={handleSortOrderChange}
                isRandom={settings.isRandom}
                onIsRandomChange={handleIsRandomChange}
              />
              <div className="mt-6">
                <AutoPlaySection
                  swipeInterval={settings.swipeInterval}
                  onSwipeIntervalChange={handleSwipeIntervalChange}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
}