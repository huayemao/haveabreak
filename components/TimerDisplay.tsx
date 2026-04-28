'use client';

import { motion } from 'motion/react';
import CircularProgress from './CircularProgress';
import { Dictionary } from '@/dictionaries';
import InterruptedDisplay from './InterruptedDisplay';

interface TimerDisplayProps {
  dict: Dictionary;
  timeLeft: number;
  totalSeconds: number;
  onStop: () => void;
  isInterrupted?: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerDisplay({ dict, timeLeft, totalSeconds, onStop, isInterrupted = false }: TimerDisplayProps) {
  const progress = (timeLeft / totalSeconds) * 100;

  return (
    <motion.div
      key="running"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center justify-center flex-1 h-screen relative"
    >
      <div className='relative w-full h-64 flex justify-center items-center'>
        {/* Circular progress - centered */}
        {/* <CircularProgress progress={progress} size={320} strokeWidth={8} /> */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Time display in center */}
          <div className="p-12 rounded-[32px] shadow-extruded bg-bg-base space-y-6">
            <div className=" flex items-center justify-center">
              <h2 className="font-display  text-8xl font-black text-primary drop-shadow-sm z-10 tabular-nums">
                {formatTime(timeLeft)}
              </h2>
            </div>
            <p className="text-muted leading-relaxed">{dict.timerTip}</p>
          </div>
        </div>
      </div>


      {/* Interrupt overlay */}
      {isInterrupted && (
        <InterruptedDisplay dict={dict} />
      )}

    </motion.div>
  );
}