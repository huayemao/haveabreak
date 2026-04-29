import { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, FrameSettings, MediaOrientation } from '../types';
import { Dictionary } from '@/dictionaries';

interface FullscreenPlayerProps {
  media: MediaItem[];
  settings: FrameSettings;
  dict: Dictionary;
  onExit: () => void;
  onDelete?: (id: string) => void;
  startPaused?: boolean;
}

export default function FullscreenPlayer({ media, settings, dict, onExit, onDelete, startPaused = false }: FullscreenPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(startPaused ? false : settings.autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const slideIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const filteredMedia = media.filter(item => {
    if (!settings.filterByOrientation) return true;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetOrientation: MediaOrientation = isMobile ? 'portrait' : 'landscape';
    return item.orientation === targetOrientation || item.orientation === 'square';
  });

  const currentMedia = filteredMedia[currentIndex] || filteredMedia[0];

  const shuffleMedia = useCallback(() => {
    if (settings.shuffle && filteredMedia.length > 1) {
      const shuffled = [...filteredMedia].sort(() => Math.random() - 0.5);
      setCurrentIndex(shuffled.indexOf(currentMedia) || 0);
    }
  }, [settings.shuffle, filteredMedia, currentMedia]);

  const goToNext = useCallback(() => {
    if (filteredMedia.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
    setProgress(0);
    shuffleMedia();
  }, [filteredMedia.length, shuffleMedia]);

  const goToPrev = useCallback(() => {
    if (filteredMedia.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
    setProgress(0);
  }, [filteredMedia.length]);

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.warn('Fullscreen not available:', error);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onExit]);

  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  useEffect(() => {
    if (isPlaying && currentMedia?.type === 'image') {
      slideIntervalRef.current = window.setInterval(goToNext, settings.slideInterval);
    } else {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    }

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [isPlaying, currentMedia?.type, settings.slideInterval, goToNext]);

  useEffect(() => {
    if (currentMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentMedia?.type, isPlaying]);

  useEffect(() => {
    if (currentMedia?.type === 'video' && videoRef.current) {
      progressIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && videoRef.current.duration) {
          setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
      }, 100);

      const handleVideoEnd = () => {
        goToNext();
      };
      videoRef.current.addEventListener('ended', handleVideoEnd);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        videoRef.current?.removeEventListener('ended', handleVideoEnd);
      };
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [currentMedia?.type, goToNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          e.preventDefault();
          if (currentMedia?.type === 'image') {
            goToNext();
          } else {
            setIsPlaying((prev) => !prev);
          }
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'Escape':
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onExit, currentMedia?.type]);

  useEffect(() => {
    const handleClick = () => {
      setShowControls((prev) => !prev);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!currentMedia) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">{dict.frame.noMedia}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      <div className="absolute inset-0">
        {currentMedia.type === 'image' ? (
          <img
            src={currentMedia.url}
            alt={currentMedia.title || ''}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            draggable={false}
          >
            <source src={currentMedia.url} type="video/mp4" />
          </video>
        )}
      </div>

      {settings.showInfo && currentMedia.title && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/80 text-center">
          <p className="text-lg font-medium backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full">
            {currentMedia.title}
          </p>
        </div>
      )}

      {showControls && (
        <>
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={onExit}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all group"
              title={dict.frame.exitFullscreen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {dict.frame.exitFullscreen}
              </span>
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <button
              onClick={goToPrev}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {filteredMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setProgress(0);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {currentMedia.type === 'video' && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-4/5">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <audio ref={audioRef} loop />
    </div>
  );
}