'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Switch } from './ui/switch';
import {
  Subscription,
  SubscriptionDiff,
  SyncStrategy,
  SubscriptionValidationResult,
  fetchSubscriptionJson,
} from '@haveabreak/utils/lib/utils';

export interface SubscriptionManagerSectionProps {
  subscriptions: Subscription[];
  activeDiff: SubscriptionDiff | null;
  isCheckingAll?: boolean;
  checkingId?: string | null;
  onAddSubscription: (sub: { name: string; url: string; syncStrategy: SyncStrategy }) => Promise<void> | void;
  onUpdateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void> | void;
  onDeleteSubscription: (id: string) => Promise<void> | void;
  onToggleSubscription: (id: string, enabled: boolean) => Promise<void> | void;
  onCheckSubscription: (id: string) => Promise<void> | void;
  onCheckAll?: () => Promise<void> | void;
  onApplyDiff: (diff: SubscriptionDiff) => Promise<void> | void;
  onDismissDiff: () => void;
  onTestUrl?: (url: string) => Promise<SubscriptionValidationResult>;
}

export default function SubscriptionManagerSection({
  subscriptions,
  activeDiff,
  isCheckingAll = false,
  checkingId = null,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  onToggleSubscription,
  onCheckSubscription,
  onCheckAll,
  onApplyDiff,
  onDismissDiff,
  onTestUrl,
}: SubscriptionManagerSectionProps) {
  const t = useTranslations();

  // Modal states
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formStrategy, setFormStrategy] = useState<SyncStrategy>('merge');

  // Test URL state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SubscriptionValidationResult | null>(null);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormUrl('');
    setFormStrategy('merge');
    setTestResult(null);
  };

  const openEditModal = (sub: Subscription) => {
    setModalMode('edit');
    setEditingId(sub.id);
    setFormName(sub.name);
    setFormUrl(sub.url);
    setFormStrategy(sub.syncStrategy || 'merge');
    setTestResult(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setIsTesting(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const url = formUrl.trim();
    if (!url) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      if (onTestUrl) {
        const res = await onTestUrl(url);
        setTestResult(res);
      } else {
        const json = await fetchSubscriptionJson(url);
        const keys = Object.keys(json);
        setTestResult({
          valid: true,
          summary: `Valid JSON (fields: ${keys.slice(0, 4).join(', ')})`,
          data: json,
        });
      }
    } catch (err: any) {
      setTestResult({
        valid: false,
        error: err.message || t('common.testFailed', { defaultValue: 'Connection failed' }),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveModal = async () => {
    if (!formName.trim() || !formUrl.trim()) return;

    if (modalMode === 'add') {
      await onAddSubscription({
        name: formName.trim(),
        url: formUrl.trim(),
        syncStrategy: formStrategy,
      });
    } else if (modalMode === 'edit' && editingId) {
      await onUpdateSubscription(editingId, {
        name: formName.trim(),
        url: formUrl.trim(),
        syncStrategy: formStrategy,
      });
    }

    closeModal();
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return t('common.never', { defaultValue: 'Never' });
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-fg-primary text-base">
            {t('common.subscription', { defaultValue: 'Subscription' })}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {onCheckAll && subscriptions.length > 0 && (
            <button
              onClick={() => onCheckAll()}
              disabled={isCheckingAll}
              className="neumorphic-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg-primary disabled:opacity-50"
              title={t('common.checkAll', { defaultValue: 'Check All' })}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin' : ''}`} />
              <span>{isCheckingAll ? t('common.checkingAll', { defaultValue: 'Checking...' }) : t('common.checkAll', { defaultValue: 'Check All' })}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="neumorphic-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-accent"
          >
            <Plus className="w-4 h-4" />
            <span>{t('common.add', { defaultValue: 'Add' })}</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-fg-muted leading-relaxed">
        {t('common.subscriptionDesc', {
          defaultValue: 'Subscribe to remote JSON configuration files for automatic updates.',
        })}
      </p>

      {/* Subscription List */}
      {subscriptions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-bg-elevated/60 text-center space-y-2 border border-white/5">
          <Link2 className="w-8 h-8 mx-auto text-fg-muted/40" />
          <p className="text-sm font-medium text-fg-muted">
            {t('common.noSubscriptions', { defaultValue: 'No subscriptions added yet.' })}
          </p>
          <button
            onClick={openAddModal}
            className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1 mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('common.addSubscription', { defaultValue: 'Add Subscription' })}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const isItemChecking = checkingId === sub.id || isCheckingAll;
            return (
              <div
                key={sub.id}
                className={`p-4 rounded-2xl bg-bg-elevated border transition-all ${
                  sub.enabled ? 'border-white/10 shadow-sm' : 'border-white/5 opacity-70'
                }`}
              >
                {/* Row 1: Switch, Name, Badges, Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={sub.enabled}
                      onCheckedChange={(checked) => onToggleSubscription(sub.id, checked)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-fg-primary truncate">
                          {sub.name}
                        </span>
                        {/* Status badge */}
                        {isItemChecking ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            {t('common.checking', { defaultValue: 'Checking...' })}
                          </span>
                        ) : sub.status === 'has_update' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <Sparkles className="w-2.5 h-2.5" />
                            {t('common.hasUpdate', { defaultValue: 'Update available' })}
                          </span>
                        ) : sub.status === 'up_to_date' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-2.5 h-2.5" />
                            {t('common.upToDate', { defaultValue: 'Up to date' })}
                          </span>
                        ) : sub.status === 'error' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-500">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {t('common.syncError', { defaultValue: 'Error' })}
                          </span>
                        ) : null}

                        {/* Strategy badge */}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-fg-muted/10 text-fg-muted">
                          {sub.syncStrategy === 'overwrite'
                            ? t('common.strategyOverwrite', { defaultValue: 'Overwrite' })
                            : t('common.strategyMerge', { defaultValue: 'Merge' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onCheckSubscription(sub.id)}
                      disabled={isItemChecking || !sub.enabled}
                      className="p-1.5 rounded-lg neumorphic-button text-fg-primary hover:text-accent disabled:opacity-40"
                      title={t('common.checkUpdate', { defaultValue: 'Check Update' })}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isItemChecking ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => openEditModal(sub)}
                      className="p-1.5 rounded-lg neumorphic-button text-fg-primary hover:text-accent"
                      title={t('common.edit', { defaultValue: 'Edit' })}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('common.confirmDelete', { defaultValue: 'Are you sure you want to delete this subscription?' }))) {
                          onDeleteSubscription(sub.id);
                        }
                      }}
                      className="p-1.5 rounded-lg neumorphic-button text-fg-muted hover:text-rose-500"
                      title={t('common.delete', { defaultValue: 'Delete' })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: URL & Timestamp */}
                <div className="mt-2 text-xs text-fg-muted space-y-1">
                  <div className="flex items-center gap-1 text-[11px] truncate font-mono text-fg-muted/70">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{sub.url}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-fg-muted/50" />
                      {t('common.lastChecked', {
                        defaultValue: 'Checked: {time}',
                        time: formatTimestamp(sub.lastCheckTime),
                      })}
                    </span>
                    {sub.lastUpdateTime ? (
                      <span className="flex items-center gap-1 text-fg-muted/60">
                        {t('common.lastUpdated', {
                          defaultValue: 'Updated: {time}',
                          time: formatTimestamp(sub.lastUpdateTime),
                        })}
                      </span>
                    ) : null}
                  </div>

                  {sub.errorMessage && sub.status === 'error' && (
                    <div className="mt-1 p-2 rounded-lg bg-rose-500/10 text-rose-500 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{sub.errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diff Review Modal */}
      <AnimatePresence>
        {activeDiff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onDismissDiff}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-bg-base shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10 z-10"
            >
              {/* Diff Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-fg-primary">
                      {t('common.diffPreview', { defaultValue: 'Subscription Changes' })}
                    </h3>
                    <p className="text-xs text-fg-muted">{activeDiff.subscriptionName}</p>
                  </div>
                </div>
                <button
                  onClick={onDismissDiff}
                  className="w-8 h-8 rounded-full neumorphic-button flex items-center justify-center text-fg-muted hover:text-fg-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Diff Stat Badges */}
              <div className="px-6 py-3 bg-bg-elevated/50 flex items-center gap-2 flex-wrap text-xs flex-shrink-0 border-b border-white/5">
                {activeDiff.counts.added > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{activeDiff.counts.added} {t('common.add', { defaultValue: 'New' })}
                  </span>
                )}
                {activeDiff.counts.updated > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                    ↻ {activeDiff.counts.updated} {t('common.edit', { defaultValue: 'Updated' })}
                  </span>
                )}
                {activeDiff.counts.deleted > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold">
                    -{activeDiff.counts.deleted} {t('common.delete', { defaultValue: 'Deleted' })}
                  </span>
                )}
                {activeDiff.counts.total === 0 && (
                  <span className="text-fg-muted">
                    {t('common.noUpdatesAvailable', { defaultValue: 'No changes detected' })}
                  </span>
                )}
              </div>

              {/* Diff Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
                {activeDiff.items.length === 0 ? (
                  <div className="text-center py-8 text-fg-muted text-sm">
                    {t('common.noUpdatesAvailable', { defaultValue: 'Everything is up to date!' })}
                  </div>
                ) : (
                  activeDiff.items.map((item, idx) => (
                    <div
                      key={`${item.category}-${item.id}-${idx}`}
                      className="p-3 rounded-xl bg-bg-elevated/70 border border-white/5 flex items-start gap-3 text-xs"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 flex-shrink-0 ${
                          item.action === 'add'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : item.action === 'update'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.action === 'add' ? '+ ADD' : item.action === 'update' ? '↻ UPD' : '- DEL'}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-fg-primary truncate">{item.title}</span>
                          {item.categoryLabel && (
                            <span className="text-[10px] text-fg-muted bg-fg-muted/10 px-1.5 py-0.2 rounded">
                              {item.categoryLabel}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-fg-muted text-[11px] truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Diff Footer Actions */}
              <div className="px-6 py-4 border-t border-white/10 bg-bg-elevated/30 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={onDismissDiff}
                  className="neumorphic-button px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg-primary"
                >
                  {t('common.dismiss', { defaultValue: 'Dismiss' })}
                </button>
                <button
                  onClick={() => onApplyDiff(activeDiff)}
                  disabled={activeDiff.counts.total === 0}
                  className="neumorphic-button-primary px-5 py-2 text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('common.applyAll', { defaultValue: 'Apply Updates' })}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Subscription Modal */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-bg-base shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-white/10 z-10 p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-fg-primary flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-accent" />
                  {modalMode === 'add'
                    ? t('common.addSubscription', { defaultValue: 'Add Subscription' })
                    : t('common.editSubscription', { defaultValue: 'Edit Subscription' })}
                </h3>
                <button
                  onClick={closeModal}
                  className="w-7 h-7 rounded-full neumorphic-button flex items-center justify-center text-fg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-fg-muted mb-1">
                    {t('common.subscriptionName', { defaultValue: 'Subscription Name' })}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t('common.enterName', { defaultValue: 'e.g. Curated Highlights' })}
                    className="w-full px-3.5 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-fg-primary focus:outline-none focus:border-accent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg-muted mb-1">
                    {t('common.subscriptionUrl', { defaultValue: 'JSON Feed URL' })}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formUrl}
                      onChange={(e) => {
                        setFormUrl(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="https://example.com/feed.json"
                      className="flex-1 px-3.5 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-fg-primary focus:outline-none focus:border-accent text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={!formUrl.trim() || isTesting}
                      className="neumorphic-button px-3 py-2 text-xs font-semibold text-fg-primary flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span>{isTesting ? t('common.testing', { defaultValue: 'Testing...' }) : t('common.testConnection', { defaultValue: 'Test' })}</span>
                    </button>
                  </div>
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      testResult.valid
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {testResult.valid ? (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {testResult.valid
                          ? t('common.testSuccess', { defaultValue: 'Connection Successful' })
                          : t('common.testFailed', { defaultValue: 'Connection Failed' })}
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {testResult.valid ? testResult.summary : testResult.error}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Sync Strategy Picker */}
                <div>
                  <label className="block text-xs font-bold text-fg-muted mb-1.5">
                    {t('common.syncStrategy', { defaultValue: 'Sync Mode' })}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <label
                      onClick={() => setFormStrategy('merge')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        formStrategy === 'merge'
                          ? 'bg-accent/10 border-accent text-fg-primary'
                          : 'bg-bg-elevated border-white/5 text-fg-muted hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="syncStrategy"
                        value="merge"
                        checked={formStrategy === 'merge'}
                        onChange={() => setFormStrategy('merge')}
                        className="mt-1 accent-accent"
                      />
                      <div>
                        <div className="font-bold text-xs text-fg-primary">
                          {t('common.strategyMerge', { defaultValue: 'Incremental Merge (Recommended)' })}
                        </div>
                        <p className="text-[11px] text-fg-muted mt-0.5 leading-relaxed">
                          {t('common.strategyMergeDesc', {
                            defaultValue: 'Only add new items and update changes, keeping your existing local data safe.',
                          })}
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setFormStrategy('overwrite')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        formStrategy === 'overwrite'
                          ? 'bg-accent/10 border-accent text-fg-primary'
                          : 'bg-bg-elevated border-white/5 text-fg-muted hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="syncStrategy"
                        value="overwrite"
                        checked={formStrategy === 'overwrite'}
                        onChange={() => setFormStrategy('overwrite')}
                        className="mt-1 accent-accent"
                      />
                      <div>
                        <div className="font-bold text-xs text-fg-primary">
                          {t('common.strategyOverwrite', { defaultValue: 'Full Mirror' })}
                        </div>
                        <p className="text-[11px] text-fg-muted mt-0.5 leading-relaxed">
                          {t('common.strategyOverwriteDesc', {
                            defaultValue: 'Strictly mirror remote content. Items not in the remote feed will be deleted.',
                          })}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 neumorphic-button py-2.5 rounded-xl font-bold text-xs text-fg-muted hover:text-fg-primary"
                >
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={!formName.trim() || !formUrl.trim()}
                  className="flex-1 neumorphic-button-primary py-2.5 rounded-xl font-bold text-xs text-white disabled:opacity-50"
                >
                  {t('common.save', { defaultValue: 'Save' })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
