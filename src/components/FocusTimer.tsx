import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Octagon, Lock, Unlock, Clock } from 'lucide-react';

import { haptics } from '@/lib/haptics';
import { useVectorStore } from '@/store/useVectorStore';

export function FocusTimer() {
  const { processFocusSession } = useVectorStore();
  const [isActive, setIsActive] = useState(false);
  const [customTime, setCustomTime] = useState(45);
  const [seconds, setSeconds] = useState(45 * 60);
  const [distractions, setDistractions] = useState(0);
  const [strictMode, setStrictMode] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const completedRef = useRef(false);
  const totalSecondsRef = useRef(45 * 60);
  const secondsRef = useRef(seconds);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    if (!isActive || !strictMode) return;
    const handleVis = () => {
      if (document.hidden) setDistractions((p) => p + 1);
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [isActive, strictMode]);

  const finishSession = useCallback(
    (success: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setIsActive(false);

      const elapsedMinutes = Math.max(
        1,
        Math.ceil((totalSecondsRef.current - secondsRef.current) / 60)
      );
      const minutes = success ? customTime : elapsedMinutes;

      processFocusSession(minutes, success, distractions);
      if (success) {
        haptics.success();
        setSessionMessage('SESSION COMPLETE');
      } else {
        haptics.warning();
        setSessionMessage('SESSION ABORTED — INTEGRITY -5');
      }
      setDistractions(0);
      setTimeout(() => setSessionMessage(null), 4000);
    },
    [customTime, distractions, processFocusSession]
  );

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          queueMicrotask(() => finishSession(true));
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, finishSession]);

  const toggleTimer = () => {
    if (!isActive) {
      totalSecondsRef.current = customTime * 60;
      setSeconds(customTime * 60);
      completedRef.current = false;
      setIsActive(true);
      setDistractions(0);
      haptics.medium();
    }
  };

  const stopEarly = () => {
    finishSession(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`w-full border-t border-border p-4 transition-colors ${isActive ? 'bg-primary/5' : 'bg-black/20'}`}
    >
      <AnimatePresence>
        {sessionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 text-center text-xs font-mono font-bold text-primary border border-primary/30 rounded-lg py-2 px-3"
          >
            {sessionMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono text-muted-foreground">FOCUS LINK</span>
            {!isActive && (
              <button
                onClick={() => {
                  setStrictMode(!strictMode);
                  haptics.selection();
                }}
                className={`flex items-center gap-1 text-[10px] px-2 rounded border ${strictMode ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}
              >
                {strictMode ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                STRICT
              </button>
            )}
          </div>

          {isActive ? (
            <div className="text-3xl font-mono font-bold tracking-widest">{formatTime(seconds)}</div>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={customTime}
                onChange={(e) => setCustomTime(Number(e.target.value))}
                className="bg-transparent text-xl font-mono font-bold w-12 border-b border-border focus:border-primary outline-none"
              />
              <span className="text-xs text-muted-foreground">MIN</span>
            </div>
          )}
        </div>

        <button
          onClick={isActive ? stopEarly : toggleTimer}
          className={`p-3 rounded-full border transition-all ${isActive ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}
        >
          {isActive ? <Octagon className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
        </button>
      </div>
    </div>
  );
}
