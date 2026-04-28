'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Dictionary } from '@/dictionaries';

interface TimeSelectorProps {
  dict: Dictionary;
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  onStart: () => void;
}

const presetMinutes = [1, 2, 3, 5, 10];

export default function TimeSelector({ dict, selectedMinutes, onSelect, onStart }: TimeSelectorProps) {
  const [customMinutes, setCustomMinutes] = useState('');

  const handleCustomSubmit = () => {
    const num = parseInt(customMinutes, 10);
    if (num > 0 && num <= 120) {
      onSelect(num);
      setCustomMinutes('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    }
  };

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
        <h1 className="font-display text-5xl font-extrabold tracking-tight">{dict.title}</h1>
        <p className="text-muted text-lg">{dict.subtitle}</p>
      </div>

      <div className="p-8 rounded-[32px] shadow-extruded bg-bg-base w-full space-y-8">
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl">{dict.minutes}</h3>
          <div className="flex bg-bg-base shadow-inset p-2 rounded-2xl justify-between">
            {presetMinutes.map((min) => (
              <button
                key={min}
                onClick={() => onSelect(min)}
                className={`flex-1 py-3 px-2 rounded-xl text-center font-bold transition-all duration-300 ${selectedMinutes === min ? 'shadow-extruded bg-bg-base text-accent' : 'text-muted hover:text-primary'} outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`}
              >
                {min}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={dict.customMinutes}
              className="flex-1 px-4 py-3 rounded-xl bg-bg-base shadow-inset text-center font-bold text-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            />
            <button
              onClick={handleCustomSubmit}
              className="px-6 py-3 rounded-xl font-bold bg-accent text-white shadow-extruded hover:shadow-extruded-hover active:shadow-inset-sm transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            >
              {dict.setBtn}
            </button>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-5 rounded-2xl font-bold text-lg bg-accent text-white shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] hover:shadow-[12px_12px_20px_rgb(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)] active:shadow-[inset_6px_6px_10px_rgba(0,0,0,0.2),inset_-6px_-6px_10px_rgba(255,255,255,0.2)] hover:-translate-y-px active:translate-y-px transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          {dict.startBtn}
        </button>
      </div>
    </motion.div>
  );
}