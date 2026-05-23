'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import TimeSelector from '@/components/TimeSelector';
import TimerDisplay from '@/components/TimerDisplay';
import FinishedDisplay from '@/components/FinishedDisplay';
import { useNavbar } from '@/context/NavbarContext';
import { useTimerStore } from '@/store/timerStore';
import InstallPrompt from '@/components/InstallPrompt';

export default function TimerApp() {
  const t = useTranslations();
  const { setIsHidden } = useNavbar();
  const {
    settings,
    isRunning,
    isInterrupted,
    isFinished,
    timeLeft,
    startTimer,
    stopTimer,
    interruptTimer,
    tickTimer,
    setSelectedMinutes,
    addCustomTip,
    removeCustomTip,
    togglePresetTip,
  } = useTimerStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const timerTips = t.raw('timer.timerTips') as string[];
  const enabledPresetTips = timerTips.filter(tip => !settings.disabledPresetTips.includes(tip));
  const allTips = [...enabledPresetTips, ...settings.customTips];
  
  const handleInterrupt = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    interruptTimer();
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

  useEffect(() => {
    setIsHidden(isRunning || isInterrupted);
  }, [isRunning, isInterrupted, setIsHidden]);

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
        tickTimer();
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
  }, [isRunning, isFinished, isInterrupted, tickTimer]);



  useEffect(() => {
    if (isFinished) {
      triggerConfetti();
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => { });
        }
      } catch (e) { }
    }
  }, [isFinished]);



  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopTimer();
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    } catch (e) { }
  };

  const handleTipsChange = (tips: string[]) => {
    settings.customTips.forEach(tip => removeCustomTip(tip));
    tips.forEach(tip => addCustomTip(tip));
  };

  const handleDisabledPresetTipsChange = (tips: string[]) => {
    settings.disabledPresetTips.forEach(tip => togglePresetTip(tip));
    tips.forEach(tip => togglePresetTip(tip));
  };

  return (
    <main className="flex-1 relative overflow-x-hidden flex flex-col">
      <InstallPrompt appId="timer" />
      <AnimatePresence mode="wait">
        {!isRunning && !isInterrupted && !isFinished ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8"
          >
            <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
              <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-12">
                <TimeSelector
                  selectedMinutes={settings.selectedMinutes}
                  onSelect={setSelectedMinutes}
                  onStart={startTimer}
                  customTips={settings.customTips}
                  onTipsChange={handleTipsChange}
                  disabledPresetTips={settings.disabledPresetTips}
                  onDisabledPresetTipsChange={handleDisabledPresetTipsChange}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="running-or-finished"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
              {isFinished ? (
                <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
                  <FinishedDisplay onRestart={startTimer} />
                </div>
              ) : (
                <TimerDisplay
                  timeLeft={timeLeft}
                  totalSeconds={settings.selectedMinutes * 60}
                  onStop={handleStopTimer}
                  isInterrupted={isInterrupted}
                  tips={allTips}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
