'use client';

import { useTranslations } from 'next-intl';
import { FrameSettings, Collection } from '../types';
import { useScrollLock } from '../utils/useScrollLock';
import { useState } from 'react';
import { Slider } from '@haveabreak/ui/components/ui/slider';
import { Switch } from '@haveabreak/ui/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@haveabreak/ui/components/ui/tabs';
import DataManagementSection from '@haveabreak/ui/components/DataManagementSection';
import SubscriptionManagerSection from '@haveabreak/ui/components/SubscriptionManagerSection';
import { exportData } from '../storage';
import { useFrameStore } from '../store';
import { Settings, Database, Sliders } from 'lucide-react';
import { toast } from '@haveabreak/ui/components/ui/sonner';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'data'>('basic');

  const {
    subscriptionDiff,
    isCheckingSubscription,
    isCheckingAllSubscriptions,
    currentCheckingSubscriptionId,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    checkSubscription,
    checkAllSubscriptions,
    applySubscriptionDiff,
    clearSubscriptionDiff,
    testSubscriptionUrl,
  } = useFrameStore();

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

  const handleExport = () => {
    const collectionName = collections.length > 0
      ? collections.map(c => c.name).join('-')
      : 'all';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${collectionName}-${timestamp}.json`;
    onExport(filename);
    toast.success(t('common.exportSuccess'));
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
      </div>

      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="basic" className="flex-1 gap-1.5 font-bold text-xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('card.basicSettings', { defaultValue: 'Basic Settings' })}</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1 gap-1.5 font-bold text-xs">
            <Database className="w-3.5 h-3.5" />
            <span>{t('card.dataManagement', { defaultValue: 'Data & Subscriptions' })}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-0 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
              <span className="font-medium text-fg-primary">{t('frame.autoPlay')}</span>
              <Switch
                checked={settings.autoPlay}
                onCheckedChange={() => toggleSetting('autoPlay')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
              <span className="font-medium text-fg-primary">{t('frame.shuffle')}</span>
              <Switch
                checked={settings.shuffle}
                onCheckedChange={() => toggleSetting('shuffle')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
              <span className="font-medium text-fg-primary">{t('frame.showInfo')}</span>
              <Switch
                checked={settings.showInfo}
                onCheckedChange={() => toggleSetting('showInfo')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
              <span className="font-medium text-fg-primary">{t('frame.filterOrientation')}</span>
              <Switch
                checked={settings.filterByOrientation}
                onCheckedChange={() => toggleSetting('filterByOrientation')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
              <span className="font-medium text-fg-primary">{t('frame.swipeSwitching')}</span>
              <Switch
                checked={settings.swipeSwitching}
                onCheckedChange={() => toggleSetting('swipeSwitching')}
              />
            </div>
          </div>

          <div className="p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
            <label className="block font-medium text-fg-primary mb-3">
              {t('frame.slideInterval')}: {Math.round(settings.slideInterval / 1000)}s
            </label>
            <Slider
              value={[Math.round(settings.slideInterval / 1000)]}
              onValueChange={([value]: number[]) => updateSetting('slideInterval', value * 1000)}
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

          <div className="p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
            <label className="block font-medium text-fg-primary mb-3">
              {t('frame.transitionDuration')}: {((settings.transitionDuration || 800) / 1000).toFixed(1)}s
            </label>
            <Slider
              value={[Math.round((settings.transitionDuration || 800) / 100) / 10]}
              onValueChange={([value]: number[]) => updateSetting('transitionDuration', Math.round(value * 1000))}
              min={0.2}
              max={3.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-fg-muted mt-1">
              <span>0.2s</span>
              <span>3.0s</span>
            </div>
          </div>

          <div className="p-4 rounded-[32px] bg-bg-elevated shadow-extruded border border-white/5">
            <label className="block font-medium text-fg-primary mb-3">
              {t('frame.volume')}: {Math.round(settings.volume * 100)}%
            </label>
            <Slider
              value={[Math.round(settings.volume * 100)]}
              onValueChange={([value]: number[]) => updateSetting('volume', value / 100)}
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
        </TabsContent>

        <TabsContent value="data" className="mt-0 space-y-6">
          <DataManagementSection
            onExport={handleExport}
            onImport={handleImport}
            onCopyJson={exportData}
            onPasteJson={onImport}
          />

          <SubscriptionManagerSection
            subscriptions={settings.subscriptions || []}
            activeDiff={subscriptionDiff}
            isCheckingAll={isCheckingAllSubscriptions}
            checkingId={currentCheckingSubscriptionId}
            onAddSubscription={async ({ name, url, syncStrategy }: any) => {
              addSubscription(name, url, syncStrategy);
              toast.success(t('common.subscriptionAdded', { defaultValue: 'Subscription added!' }));
            }}
            onUpdateSubscription={async (id: string, updates: any) => {
              updateSubscription(id, updates);
              toast.success(t('common.subscriptionUpdated', { defaultValue: 'Subscription updated!' }));
            }}
            onDeleteSubscription={async (id: string) => {
              deleteSubscription(id);
              toast.success(t('common.subscriptionDeleted', { defaultValue: 'Subscription deleted!' }));
            }}
            onToggleSubscription={(id: string, enabled: boolean) => {
              toggleSubscription(id, enabled);
            }}
            onCheckSubscription={async (id: string) => {
              await checkSubscription(id);
            }}
            onCheckAll={async () => {
              await checkAllSubscriptions();
            }}
            onApplyDiff={(diff: any) => {
              applySubscriptionDiff(diff);
              toast.success(t('common.updateApplied', { defaultValue: 'Updates applied successfully!' }));
            }}
            onDismissDiff={clearSubscriptionDiff}
            onTestUrl={testSubscriptionUrl}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}