'use client';

import { motion } from 'motion/react';
import { Dictionary } from '@/dictionaries';

interface FinishedDisplayProps {
  dict: Dictionary;
  onRestart: () => void;
}

export default function FinishedDisplay({ dict, onRestart }: FinishedDisplayProps) {
  return (
    <motion.div
      key="finished"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-10 rounded-[32px] shadow-extruded bg-bg-base text-center space-y-8 max-w-sm"
    >
      <div className="w-24 h-24 mx-auto rounded-full shadow-inset flex items-center justify-center">
        <div className="w-16 h-16 shadow-extruded rounded-full text-accent-sec flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-extrabold">{dict.congrats}</h2>
        <p className="  text-lg">{dict.congratsDesc}</p>
      </div>
      
      <button
        onClick={onRestart}
        className="w-full py-4 rounded-2xl font-bold bg-bg-base text-accent shadow-extruded hover:shadow-extruded-hover active:shadow-inset-sm hover:-translate-y-px active:translate-y-px transition-all duration-300 outline-none"
      >
        {dict.restartBtn}
      </button>
    </motion.div>
  );
}