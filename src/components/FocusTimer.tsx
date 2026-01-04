import { useState, useEffect } from 'react';
import { Play, Octagon, Lock, Unlock, Clock } from 'lucide-react';

import { useVectorStore } from '@/store/useVectorStore';

export function FocusTimer() {
  const { processFocusSession } = useVectorStore();
  const [isActive, setIsActive] = useState(false);
  const [customTime, setCustomTime] = useState(45); // Minutes
  const [seconds, setSeconds] = useState(45 * 60);
  const [distractions, setDistractions] = useState(0);
  const [strictMode, setStrictMode] = useState(false);

  useEffect(() => {
    if (!isActive || !strictMode) return;
    const handleVis = () => { if (document.hidden) setDistractions(p => p + 1); };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [isActive, strictMode]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      processFocusSession(customTime, true, distractions); 
      setDistractions(0);
      alert("SESSION COMPLETE.");
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => {
    if (!isActive) {
        setSeconds(customTime * 60);
        setIsActive(true);
        setDistractions(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`w-full border-t border-border p-4 transition-colors ${isActive ? 'bg-primary/5' : 'bg-black/20'}`}>
      <div className="flex items-center justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">FOCUS LINK</span>
                {!isActive && (
                    <button onClick={() => setStrictMode(!strictMode)} className={`flex items-center gap-1 text-[10px] px-2 rounded border ${strictMode ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
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
            onClick={isActive ? () => setIsActive(false) : toggleTimer}
            className={`p-3 rounded-full border transition-all ${isActive ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}
        >
            {isActive ? <Octagon className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
        </button>
      </div>
    </div>
  );
}