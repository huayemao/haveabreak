import { useTranslations } from 'next-intl';
import Settings from './Settings';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

interface TimeSelectorProps {
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  onStart: () => void;
  customTips: string[];
  onTipsChange: (tips: string[]) => void;
  disabledPresetTips: string[];
  onDisabledPresetTipsChange: (tips: string[]) => void;
}

const presetMinutes = [1, 2, 3, 5, 10];

export default function TimeSelector({
  selectedMinutes,
  onSelect,
  onStart,
  customTips,
  onTipsChange,
  disabledPresetTips,
  onDisabledPresetTipsChange
}: TimeSelectorProps) {
  const t = useTranslations();
  const [customMinutes, setCustomMinutes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCustomChange = (value: string) => {
    setCustomMinutes(value);
    const num = parseInt(value, 10);
    if (num > 0 && num <= 120) {
      onSelect(num);
    }
  };

  const hasCustomInput = customMinutes !== '' && parseInt(customMinutes, 10) > 0;

  useEffect(() => {
    if (hasCustomInput) {
      inputRef.current?.focus();
    }
  }, [hasCustomInput]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col items-center space-y-12"
    >
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-full shadow-extruded p-1 mb-8 bg-bg-base">
          <img src="/api/icon?size=96" alt="haveabreak logo" className="w-full h-full rounded-full" />
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight">{t('title')}</h1>
        <p className="text-fg-muted text-lg">{t('subtitle')}</p>
      </div>

      <div className="p-8 rounded-[32px] shadow-extruded bg-bg-base w-full space-y-8">
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl">{t('minutes')}</h3>
          <div className="flex bg-bg-base shadow-inset p-2 rounded-2xl justify-between">
            {presetMinutes.map((min) => (
              <button
                key={min}
                onClick={() => {
                  onSelect(min);
                  setCustomMinutes('');
                }}
                className={`flex-1 py-3 px-2 rounded-xl text-center font-bold transition-all duration-300 ${!hasCustomInput && selectedMinutes === min ? 'shadow-extruded bg-bg-base text-accent' : ''} outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`}
              >
                {min}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <input
              ref={inputRef}
              type="number"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder={t('customMinutes')}
              className="w-full px-4 py-3 rounded-xl bg-bg-base shadow-inset text-center font-bold text-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            />
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-5 rounded-2xl font-bold text-lg bg-accent text-white shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] hover:shadow-[12px_12px_20px_rgb(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)] active:shadow-[inset_6px_6px_10px_rgba(0,0,0,0.2),inset_-6px_-6px_10px_rgba(255,255,255,0.2)] hover:-translate-y-px active:translate-y-px transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          {t('startBtn')}
        </button>

        <Settings
          customTips={customTips}
          onTipsChange={onTipsChange}
          disabledPresetTips={disabledPresetTips}
          onDisabledPresetTipsChange={onDisabledPresetTipsChange}
        />
      </div>
    </motion.div>
  );
}
