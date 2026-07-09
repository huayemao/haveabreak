'use client';

import { useTranslations } from 'next-intl';
import { Link2, Plus, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { Subscription } from '@haveabreak/card/types';
import AddSubscriptionForm from './AddSubscriptionForm';
import SubscriptionList from './SubscriptionList';
import SubscriptionUpdateInfo from './SubscriptionUpdateInfo';

interface SubscriptionSectionProps {
  subscriptions: Subscription[];
  activeSubscriptionId: string | null;
  subscriptionDiff: {
    newBooks: any[];
    updatedBooks: any[];
    deletedBooks: any[];
    newQuotes: any[];
    updatedQuotes: any[];
    deletedQuotes: any[];
  } | null;
  isChecking: boolean;
  hasUpdate: boolean;
  checkError: string | null;
  showAddSubscription: boolean;
  showSubscriptionList: boolean;
  newSubscriptionName: string;
  newSubscriptionUrl: string;
  onToggleAddSubscription: () => void;
  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onAddSubscription: () => void;
  onCancelAddSubscription: () => void;
  onToggleSubscriptionList: () => void;
  onSelectSubscription: (subscription: Subscription) => void;
  onDeleteSubscription: (id: string) => void;
  onCheckSubscription: () => void;
  onApplyUpdate: () => void;
  onClearUpdate: () => void;
}

export default function SubscriptionSection({
  subscriptions,
  activeSubscriptionId,
  subscriptionDiff,
  isChecking,
  hasUpdate,
  checkError,
  showAddSubscription,
  showSubscriptionList,
  newSubscriptionName,
  newSubscriptionUrl,
  onToggleAddSubscription,
  onNameChange,
  onUrlChange,
  onAddSubscription,
  onCancelAddSubscription,
  onToggleSubscriptionList,
  onSelectSubscription,
  onDeleteSubscription,
  onCheckSubscription,
  onApplyUpdate,
  onClearUpdate,
}: SubscriptionSectionProps) {
  const t = useTranslations();

  const activeSubscription = subscriptions.find(
    sub => sub.id === activeSubscriptionId
  );

  const formatTime = (timestamp: number) => {
    if (!timestamp) return t('common.never');
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-fg-primary flex items-center gap-2">
          <Link2 className="w-5 h-5 text-accent" />
          {t('card.subscription', { defaultValue: 'Subscription' })}
        </h3>
        <button
          onClick={onToggleAddSubscription}
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
        <AddSubscriptionForm
          newSubscriptionName={newSubscriptionName}
          newSubscriptionUrl={newSubscriptionUrl}
          onNameChange={onNameChange}
          onUrlChange={onUrlChange}
          onSave={onAddSubscription}
          onCancel={onCancelAddSubscription}
        />
      )}

      {subscriptions.length === 0 ? (
        <div className="p-6 rounded-xl bg-bg-elevated text-center text-fg-muted">
          <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('common.noSubscriptions', { defaultValue: 'No subscriptions added yet.' })}</p>
        </div>
      ) : (
        <>
          <SubscriptionList
            subscriptions={subscriptions}
            activeSubscriptionId={activeSubscriptionId}
            showList={showSubscriptionList}
            onToggle={onToggleSubscriptionList}
            onSelect={onSelectSubscription}
            onDelete={onDeleteSubscription}
          />

          {checkError && (
            <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {checkError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCheckSubscription}
              disabled={isChecking || !activeSubscription}
              className="flex-1 neumorphic-button py-3 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? t('common.checking', { defaultValue: 'Checking...' }) : t('common.checkUpdate', { defaultValue: 'Check Update' })}
            </button>
            {hasUpdate && (
              <button
                onClick={onApplyUpdate}
                className="flex-1 neumorphic-button-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                <RefreshCw className="w-5 h-5" />
                {t('common.applyUpdate', { defaultValue: 'Apply Update' })}
              </button>
            )}
          </div>

          <SubscriptionUpdateInfo
            subscriptionDiff={subscriptionDiff}
            hasUpdate={hasUpdate}
            onApplyUpdate={onApplyUpdate}
            onClearUpdate={onClearUpdate}
          />

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
  );
}
