import { lazy, Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, ShieldAlert, ChevronDown, ChevronUp, LayoutDashboard, ListTodo, Settings, BarChart3 } from 'lucide-react';

import { AttributeCards } from '@/components/AttributeCards';
import { Ledger } from '@/components/Ledger';
import { Nexus } from '@/components/Nexus';
import { Settings as SettingsComponent } from '@/components/Settings';
import { TaskList } from '@/components/TaskList';
import { Templates } from '@/components/Templates';
import { onStorageError } from '@/lib/persistStorage';
import { useVectorStore } from '@/store/useVectorStore';
import { useStorageErrorStore } from '@/store/useStorageErrorStore';

const MetricRadar = lazy(() =>
  import('@/components/MetricRadar').then((m) => ({ default: m.MetricRadar }))
);
const FocusTimer = lazy(() =>
  import('@/components/FocusTimer').then((m) => ({ default: m.FocusTimer }))
);
const Goals = lazy(() => import('@/components/Goals').then((m) => ({ default: m.Goals })));

const Statistics = lazy(() =>
  import('@/components/Statistics').then((m) => ({ default: m.Statistics }))
);
const Achievements = lazy(() =>
  import('@/components/Achievements').then((m) => ({ default: m.Achievements }))
);

function App() {
  const { integrity, energy, checkDailyReset, updateGoalProgress, importData } = useVectorStore();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'dashboard' | 'tasks' | 'stats'>('tasks');

  useEffect(() => {
    onStorageError((message) => {
      useStorageErrorStore.getState().setMessage(message);
    });
    checkDailyReset();
    updateGoalProgress();
    
    (async () => {
      const { pullFromGistIfNewer, getSyncStatus } = await import('@/lib/gistSync');
      const syncStatus = getSyncStatus();
      if (syncStatus.enabled) {
        try {
          const data = await pullFromGistIfNewer();
          if (data) {
            importData(data);
          }
        } catch {
          // Silent fail on startup
        }
      }
    })();
    
    const interval = setInterval(() => {
      checkDailyReset();
      updateGoalProgress();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkDailyReset, updateGoalProgress, importData]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center overflow-x-hidden selection:bg-primary/20 pb-20 lg:pb-0">
      
      {/* TOP BAR */}
      <div className="w-full max-w-lg flex justify-between items-center p-4 text-xs font-mono border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className={`w-4 h-4 ${integrity < 30 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                <span className={integrity < 30 ? 'text-destructive' : ''}>HP: {integrity}%</span>
            </div>
            <div className="h-3 w-[1px] bg-border"></div>
            <div className="flex items-center gap-2 font-bold">
                <Battery className={`w-4 h-4 ${energy < 20 ? 'text-orange-500' : 'text-primary'}`} />
                <span className={energy < 20 ? 'text-orange-500' : ''}>NRG: {energy}%</span>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)} 
            className="p-1.5 hover:text-primary transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        <button onClick={() => setLedgerOpen(!ledgerOpen)} className="flex items-center gap-1 hover:text-primary transition-colors">
            ASSETS {ledgerOpen ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
        </button>
      </div>
      </div>

      {/* SETTINGS DRAWER */}
      <AnimatePresence>
        {settingsOpen && (
            <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="w-full max-w-lg overflow-hidden border-b border-border bg-card"
            >
                <div className="p-4">
                    <SettingsComponent />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* LEDGER DRAWER */}
      <AnimatePresence>
        {ledgerOpen && (
            <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="w-full max-w-lg overflow-hidden border-b border-border bg-card"
            >
                <Ledger />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8">
        
        {/* LEFT COLUMN (Dashboard) - Hidden on mobile if view is 'tasks' or 'stats' */}
        <div className={`lg:col-span-5 space-y-6 ${mobileView === 'tasks' || mobileView === 'stats' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <Nexus />
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
                <span className="absolute top-3 left-4 text-[10px] tracking-widest uppercase text-muted-foreground font-bold">Attribute Matrix</span>
                <Suspense fallback={<div className="h-32 animate-pulse bg-secondary/30 rounded" />}>
                  <MetricRadar />
                </Suspense>
            </div>

            <AttributeCards />
            
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                <Suspense fallback={<div className="h-24 animate-pulse bg-secondary/30" />}>
                  <FocusTimer />
                </Suspense>
            </div>

            <Suspense fallback={<div className="h-40 animate-pulse bg-secondary/30 rounded-xl" />}>
              <Goals />
            </Suspense>
        </div>

        {/* RIGHT COLUMN (Tasks or Stats) - Hidden on mobile if view is 'dashboard' */}
        <div className={`lg:col-span-7 h-full ${mobileView === 'dashboard' ? 'hidden lg:block' : 'block'}`}>
          {mobileView === 'stats' ? (
            <div className="space-y-6">
              <Suspense fallback={<div className="text-sm text-muted-foreground p-4">Loading stats…</div>}>
                <Statistics />
                <Achievements />
              </Suspense>
            </div>
          ) : (
            <div className="space-y-6">
              <TaskList />
              <Templates />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV - Visible only on mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border p-2 flex justify-around items-center lg:hidden z-50 safe-area-bottom">
        <button 
            onClick={() => setMobileView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${mobileView === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
        >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">SYSTEM</span>
        </button>
        <div className="w-[1px] h-6 bg-border"></div>
        <button 
            onClick={() => setMobileView('tasks')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${mobileView === 'tasks' ? 'text-primary' : 'text-muted-foreground'}`}
        >
            <ListTodo className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">TASKS</span>
        </button>
        <div className="w-[1px] h-6 bg-border"></div>
        <button 
            onClick={() => setMobileView('stats')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-colors ${mobileView === 'stats' ? 'text-primary' : 'text-muted-foreground'}`}
        >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">STATS</span>
        </button>
      </div>


    </div>
  );
}

export default App;