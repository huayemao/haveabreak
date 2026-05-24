'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';

interface AutoPlaySectionProps {
  swipeInterval: number;
  onSwipeIntervalChange: (interval: number) => void;
}

const INTERVAL_OPTIONS = [
  { value: 3000, label: '3s' },
  { value: 5000, label: '5s' },
  { value: 8000, label: '8s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s' },
];

export default function AutoPlaySection({
  swipeInterval,
  onSwipeIntervalChange,
}: AutoPlaySectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-fg-primary">{t('card.autoPlayInterval', { defaultValue: 'Auto Play Interval' })}</h3>
      <p className="text-sm text-fg-muted">
        {t('card.autoPlayIntervalDesc', { defaultValue: 'Set how long each quote is displayed before moving to the next one.' })}
      </p>

      <div className="grid grid-cols-5 gap-2">
        {INTERVAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSwipeIntervalChange(option.value)}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              swipeInterval === option.value
                ? 'neumorphic-button-primary'
                : 'neumorphic-button'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-bg-secondary text-xs text-fg-muted">
        {t('card.autoPlayIntervalNote', { defaultValue: 'This setting controls the duration each quote is shown during auto-play mode.' })}
      </div>
    </div>
  );
}