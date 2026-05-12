'use client';

import { useTranslations } from 'next-intl';

interface AddSubscriptionFormProps {
  newSubscriptionName: string;
  newSubscriptionUrl: string;
  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddSubscriptionForm({
  newSubscriptionName,
  newSubscriptionUrl,
  onNameChange,
  onUrlChange,
  onSave,
  onCancel,
}: AddSubscriptionFormProps) {
  const t = useTranslations();

  return (
    <div className="p-4 rounded-xl bg-bg-elevated space-y-3">
      <div>
        <label className="text-sm font-bold text-fg-muted block mb-1">
          {t('common.subscriptionName', { defaultValue: 'Subscription Name' })}
        </label>
        <input
          type="text"
          placeholder={t('common.enterName', { defaultValue: 'Enter subscription name' })}
          value={newSubscriptionName}
          onChange={(e) => onNameChange(e.target.value)}
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
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full px-4 py-3 bg-bg-base border border-white/10 rounded-xl focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 neumorphic-button py-2 rounded-lg font-bold"
        >
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </button>
        <button
          onClick={onSave}
          disabled={!newSubscriptionName.trim() || !newSubscriptionUrl.trim()}
          className="flex-1 neumorphic-button-primary py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.save', { defaultValue: 'Save' })}
        </button>
      </div>
    </div>
  );
}
