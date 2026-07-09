'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Subscription } from '@haveabreak/card/types';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  activeSubscriptionId: string | null;
  showList: boolean;
  onToggle: () => void;
  onSelect: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}

export default function SubscriptionList({
  subscriptions,
  activeSubscriptionId,
  showList,
  onToggle,
  onSelect,
  onDelete,
}: SubscriptionListProps) {
  const t = useTranslations();

  const activeSubscription = subscriptions.find(
    sub => sub.id === activeSubscriptionId
  );

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-full neumorphic-button py-3 px-4 rounded-xl flex items-center justify-between"
      >
        <span className="font-bold">
          {activeSubscription?.name || t('common.selectSubscription', { defaultValue: 'Select Subscription' })}
        </span>
        <ChevronDown className={`w-5 h-5 transition-transform ${showList ? 'rotate-180' : ''}`} />
      </button>

      {showList && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-bg-base rounded-xl shadow-extruded overflow-hidden z-10"
        >
          {subscriptions.map((subscription) => (
            <button
              key={subscription.id}
              onClick={() => onSelect(subscription)}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-bg-elevated transition-colors ${
                subscription.id === activeSubscriptionId ? 'bg-bg-elevated' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${subscription.id === activeSubscriptionId ? 'bg-accent' : 'bg-fg-muted'}`} />
                <span>{subscription.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(subscription.id);
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
  );
}
