'use client';

import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'motion/react';
import TimeSelector from '@/components/TimeSelector';
import TimerDisplay from '@/components/TimerDisplay';
import FinishedDisplay from '@/components/FinishedDisplay';
import LandingSection from '@/components/LandingSection';
import { loadCustomTips, loadDisabledPresets } from '@/components/Settings';
import { useNavbar } from '@/context/NavbarContext';

export default function TimerApp() {
  const t = useTranslations();
  const { setIsHidden } = useNavbar();
  const [isRunning, setIsRunning] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(selectedMinutes * 60);
  const [customTips, setCustomTips] = useState<string[]>([]);
  const [disabledPresetTips, setDisabledPresetTips] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const custom = loadCustomTips();
    const disabled = loadDisabledPresets();
    setCustomTips(custom);
    setDisabledPresetTips(disabled);
  }, []);

  const timerTips = t.raw('timerTips') as string[];
  const enabledPresetTips = timerTips.filter(tip => !disabledPresetTips.includes(tip));
  const allTips = [...enabledPresetTips, ...customTips];

  useEffect(() => {
    setIsHidden(isRunning);
  }, [isRunning, setIsHidden]);

  useEffect(() => {
    if (isRunning) {
      let canInterrupt = false;
      const gracePeriodTimeout = setTimeout(() => {
        canInterrupt = true;
      }, 500);

      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
      } catch (e) {
        // ignore
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const handleMovement = () => {
        if (!isFinished && isRunning && !isInterrupted && canInterrupt) {
          handleInterrupt();
        }
      };

      window.addEventListener('mousemove', handleMovement);
      window.addEventListener('keydown', handleMovement);
      window.addEventListener('scroll', handleMovement);
      window.addEventListener('mousedown', handleMovement);
      window.addEventListener('touchstart', handleMovement);

      return () => {
        clearTimeout(gracePeriodTimeout);
        if (timerRef.current) clearInterval(timerRef.current);
        window.removeEventListener('mousemove', handleMovement);
        window.removeEventListener('keydown', handleMovement);
        window.removeEventListener('scroll', handleMovement);
        window.removeEventListener('mousedown', handleMovement);
        window.removeEventListener('touchstart', handleMovement);
      };
    }
  }, [isRunning, isFinished, isInterrupted]);

  const handleInterrupt = () => {
    setIsInterrupted(true);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(selectedMinutes * 60);
    setIsRunning(true);

    setTimeout(() => {
      setIsInterrupted(false);
    }, 3000);
  };

  const handleComplete = () => {
    setIsFinished(true);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    triggerConfetti();

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    } catch (e) { }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6C63FF', '#8B84FF', '#38B2AC']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6C63FF', '#8B84FF', '#38B2AC']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const startTimer = () => {
    setTimeLeft(selectedMinutes * 60);
    setIsRunning(true);
    setIsInterrupted(false);
    setIsFinished(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(selectedMinutes * 60);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    } catch (e) { }
  };

  return (
    <main className="flex-1 relative overflow-x-hidden flex flex-col p-8">

      {/* <div className="absolute inset-x-0 top-0 h-screen z-0 flex items-center justify-center pointer-events-none opacity-50">
        <div className="w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] rounded-full shadow-extruded absolute" />
        <div className="w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] rounded-full shadow-inset-deep absolute" />
      </div> */}

      <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-12">
          <AnimatePresence mode="wait">
            {!isRunning && !isInterrupted && !isFinished && (
              <TimeSelector
                selectedMinutes={selectedMinutes}
                onSelect={setSelectedMinutes}
                onStart={startTimer}
                customTips={customTips}
                onTipsChange={setCustomTips}
                disabledPresetTips={disabledPresetTips}
                onDisabledPresetTipsChange={setDisabledPresetTips}
              />
            )}

            {(isRunning || isInterrupted) && (
              <TimerDisplay
                timeLeft={timeLeft}
                totalSeconds={selectedMinutes * 60}
                onStop={stopTimer}
                isInterrupted={isInterrupted}
                tips={allTips}
              />
            )}

            {isFinished && (
              <FinishedDisplay
                onRestart={startTimer}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {!isRunning && !isFinished && !isInterrupted && (
          <LandingSection />
        )}
      </AnimatePresence>
    </main>
  );
}
