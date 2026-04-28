'use client';

import { motion } from 'motion/react';
import { Dictionary } from '@/dictionaries';

interface InterruptedDisplayProps {
  dict: Dictionary;
}

export default function InterruptedDisplay({ dict }: InterruptedDisplayProps) {
  return (
    <motion.div
      key="interrupted"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="text-center space-y-6 absolute -bottom-64 w-xs"
    >
      <h2 className="font-display text-4xl font-extrabold">{dict.moveWarning}</h2>
      <p className="  text-lg max-w-xs mx-auto text-red-400">{dict.moveWarningDesc}</p>
    </motion.div>
  );
}