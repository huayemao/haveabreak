'use client';

import { useTranslations } from 'next-intl';
import { useScrollLock } from '@/apps/frame/utils/useScrollLock';
import { useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertCircle, Clock, Link2, Plus, Trash2, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Book, Subscription } from '@/apps/card/types';
import { useCardStore } from '@/apps/card/store';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [newSubscriptionName, setNewSubscriptionName] = useState('');
  const [newSubscriptionUrl, setNewSubscriptionUrl] = useState('');
  const [showSubscriptionList, setShowSubscriptionList] = useState(false);

  const {
    settings,
    subscriptionDiff,
    isChecking,
    hasUpdate,
    checkError,
    currentCheckingSubscriptionId,
    addSubscription,
    deleteSubscription,
    setActiveSubscription,
    checkSubscription,
    applyUpdate,
    clearUpdate,
  } = useCardStore();

  const activeSubscription = settings.subscriptions.find(
    sub => sub.id === settings.activeSubscriptionId
  );

  const handleAddSubscription = () => {
    if (newSubscriptionName.trim() && newSubscriptionUrl.trim()) {
      addSubscription(newSubscriptionName.trim(), newSubscriptionUrl.trim());
      setNewSubscriptionName('');
      setNewSubscriptionUrl('');
      setShowAddSubscription(false);
      setSuccessMessage(t('common.subscriptionAdded', { defaultValue: 'Subscription added!' }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
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

  const formatTime = (timestamp: number) => {
    if (!timestamp) return t('common.never');
    return new Date(timestamp).toLocaleString();
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
            setSuccessMessage(t('common.importSuccess'));
            setShowSuccess(true);
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
    const bookName = books.length > 0
      ? books.map(b => b.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')).join('-')
      : 'all';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${bookName}-${timestamp}.json`;
    onExport(filename);
    setSuccessMessage(t('common.exportSuccess'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
        className="relative w-full max-w-lg bg-bg-base shadow-extruded rounded-[32px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
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

        <div className="p-8 space-y-6">
          {showSuccess && (
            <div className="p-4 rounded-2xl bg-green-100 text-green-700 text-center font-medium">
              {successMessage}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-fg-primary">{t('card.dataManagement', { defaultValue: 'Data Management' })}</h3>
            <p className="text-sm text-fg-muted">
              {t('card.dataManagementDesc', { defaultValue: 'Export your books and quotes to back them up, or import data from a previous backup.' })}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 neumorphic-button py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >
                <Download className="w-5 h-5" />
                {t('common.export')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-fg-muted">{t('common.importDataLabel')}</label>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-fg-muted/30 rounded-xl">
              <Upload className="w-12 h-12 text-fg-muted mb-4" />
              <p className="text-fg-muted mb-4">{t('common.selectFile')}</p>
              <label className="cursor-pointer neumorphic-button-primary px-6 py-2">
                {t('common.chooseFile')}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-fg-primary flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                {t('card.subscription', { defaultValue: 'Subscription' })}
              </h3>
              <button
                onClick={() => setShowAddSubscription(!showAddSubscription)}
                className="neumorphic-button px-3 py-1.5 flex items-center gap-1 text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                {t('common.add', { defaultValue: 'Add' })}
              </button>
            </div>
            <p className="text-sm text-fg-muted">
              {t('card.subscriptionDesc', { defaultValue: 'Subscribe to remote JSON configuration files for automatic updates.' })}
            </p>

            {showAddSubscription && (
              <div className="p-4 rounded-xl bg-bg-elevated space-y-3">
                <div>
                  <label className="text-sm font-bold text-fg-muted block mb-1">
                    {t('common.subscriptionName', { defaultValue: 'Subscription Name' })}
                  </label>
                  <input
                    type="text"
                    placeholder={t('common.enterName', { defaultValue: 'Enter subscription name' })}
                    value={newSubscriptionName}
                    onChange={(e) => setNewSubscriptionName(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-white/10 rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-fg-muted block mb-1">
                    {t('common.subscriptionUrl', { defaultValue: 'Subscription URL' })}
                  </label>
                  <input
                    type="url"
                    placeholder={t('common.enterUrl', { defaultValue: 'Enter JSON file URL' })}
                    value={newSubscriptionUrl}
                    onChange={(e) => setNewSubscriptionUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-white/10 rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddSubscription(false)}
                    className="flex-1 neumorphic-button py-2 rounded-lg font-bold"
                  >
                    {t('common.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={handleAddSubscription}
                    disabled={!newSubscriptionName.trim() || !newSubscriptionUrl.trim()}
                    className="flex-1 neumorphic-button-primary py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.save', { defaultValue: 'Save' })}
                  </button>
                </div>
              </div>
            )}

            {settings.subscriptions.length === 0 ? (
              <div className="p-6 rounded-xl bg-bg-elevated text-center text-fg-muted">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('common.noSubscriptions', { defaultValue: 'No subscriptions added yet.' })}</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowSubscriptionList(!showSubscriptionList)}
                    className="w-full neumorphic-button py-3 px-4 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-bold">
                      {activeSubscription?.name || t('common.selectSubscription', { defaultValue: 'Select Subscription' })}
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showSubscriptionList ? 'rotate-180' : ''}`} />
                  </button>

                  {showSubscriptionList && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-bg-base rounded-xl shadow-extruded overflow-hidden z-10"
                    >
                      {settings.subscriptions.map((subscription) => (
                        <button
                          key={subscription.id}
                          onClick={() => handleSelectSubscription(subscription)}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-bg-elevated transition-colors ${
                            subscription.id === settings.activeSubscriptionId ? 'bg-bg-elevated' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${subscription.id === settings.activeSubscriptionId ? 'bg-accent' : 'bg-fg-muted'}`} />
                            <span>{subscription.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubscription(subscription.id);
                            }}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {checkError && (
                  <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {checkError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => checkSubscription()}
                    disabled={isChecking || !activeSubscription}
                    className="flex-1 neumorphic-button py-3 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? t('common.checking', { defaultValue: 'Checking...' }) : t('common.checkUpdate', { defaultValue: 'Check Update' })}
                  </button>
                  {hasUpdate && (
                    <button
                      onClick={applyUpdate}
                      className="flex-1 neumorphic-button-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {t('common.applyUpdate', { defaultValue: 'Apply Update' })}
                    </button>
                  )}
                </div>

                {subscriptionDiff && (
                  <div className="p-4 rounded-xl bg-bg-elevated space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-fg-primary">{t('common.updateAvailable', { defaultValue: 'Update Available' })}</h4>
                      <button onClick={clearUpdate} className="text-sm text-fg-muted hover:text-fg-primary">
                        {t('common.close', { defaultValue: 'Close' })}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {subscriptionDiff.newBooks.length > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-4 h-4" />
                          {t('common.newBooks', { defaultValue: '{count} new books', count: subscriptionDiff.newBooks.length })}
                        </div>
                      )}
                      {subscriptionDiff.updatedBooks.length > 0 && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <RefreshCw className="w-4 h-4" />
                          {t('common.updatedBooks', { defaultValue: '{count} updated books', count: subscriptionDiff.updatedBooks.length })}
                        </div>
                      )}
                      {subscriptionDiff.deletedBooks.length > 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          {t('common.deletedBooks', { defaultValue: '{count} deleted books', count: subscriptionDiff.deletedBooks.length })}
                        </div>
                      )}
                      {subscriptionDiff.newQuotes.length > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-4 h-4" />
                          {t('common.newQuotes', { defaultValue: '{count} new quotes', count: subscriptionDiff.newQuotes.length })}
                        </div>
                      )}
                      {subscriptionDiff.updatedQuotes.length > 0 && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <RefreshCw className="w-4 h-4" />
                          {t('common.updatedQuotes', { defaultValue: '{count} updated quotes', count: subscriptionDiff.updatedQuotes.length })}
                        </div>
                      )}
                      {subscriptionDiff.deletedQuotes.length > 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          {t('common.deletedQuotes', { defaultValue: '{count} deleted quotes', count: subscriptionDiff.deletedQuotes.length })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSubscription && (
                  <div className="text-xs text-fg-muted space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {t('common.lastChecked', { defaultValue: 'Last checked: {time}', time: formatTime(activeSubscription.lastCheckTime) })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {t('common.lastUpdated', { defaultValue: 'Last updated: {time}', time: formatTime(activeSubscription.lastUpdateTime) })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}