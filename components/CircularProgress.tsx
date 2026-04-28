'use client';

import { motion } from 'motion/react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({ progress, size = 300, strokeWidth = 12 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =  (progress / 100) * circumference;

  return (
    <div className='rounded-xl  p-16' >
      <div className='rounded-full shadow-extruded' >
        <svg width={size} height={size} className="rounded-full transform -rotate-90 ">
          <defs>
            <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feComponentTransfer in="SourceAlpha">
                <feFuncA type="table" tableValues="0.3 0"/>
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="3"/>
              <feOffset dx="2" dy="2"/>
              <feComposite in2="SourceAlpha" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Background circle */}
          {/* <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
            style={{ filter: 'url(#innerShadow)' }}
          /> */}

          {/* Progress circle */}
          {/* <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={20}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-accent"
            filter="url(#outerGlow)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          /> */}
        </svg>
      </div>
    </div>
  );
}