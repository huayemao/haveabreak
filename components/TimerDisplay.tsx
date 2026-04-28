'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import CircularProgress from './CircularProgress';
import { Dictionary } from '@/dictionaries';
import InterruptedDisplay from './InterruptedDisplay';

interface TimerDisplayProps {
  dict: Dictionary;
  timeLeft: number;
  totalSeconds: number;
  onStop: () => void;
  isInterrupted?: boolean;
  tips: string[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerDisplay({ dict, timeLeft, totalSeconds, onStop, isInterrupted = false, tips }: TimerDisplayProps) {
  const progress = (timeLeft / totalSeconds) * 100;
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const displayTips = tips;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => 
        (prevIndex + 1) % displayTips.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [displayTips.length]);

  const currentTip = displayTips[currentTipIndex];

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
              <h2 className="font-display  text-8xl font-black  text-fg-primary drop-shadow-sm z-10 tabular-nums">
                {formatTime(timeLeft)}
              </h2>
            </div>
            <motion.p 
              key={currentTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="  leading-relaxed text-center"
            >
              {currentTip}
            </motion.p>
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