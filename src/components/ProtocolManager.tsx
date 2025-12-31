import { useState } from 'react';
import { useVectorStore, type AttributeType } from '../store/useVectorStore';
import { Moon, Plus, Trash2, Shield } from 'lucide-react';

export function ProtocolManager() {
  const { protocols, addProtocol, removeProtocol, logSleep, energy } = useVectorStore();
  const [newRule, setNewRule] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    // Default to 'creation' for generic rules, user can change logic if needed
    addProtocol(newRule, 'creation', 30); 
    setNewRule('');
  };

  const handleSleepLog = () => {
    const hours = parseFloat(sleepHours);
    if (!isNaN(hours) && hours > 0) {
        logSleep(hours);
        setSleepHours('');
    }
  };

  return (
    <div className="space-y-4">
        {/* Sleep Tracker Card */}
        <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-400">
                    <Moon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold">Sleep Log</h3>
                    <p className="text-[10px] text-muted-foreground">Restores Energy (Current: {energy}%)</p>
                </div>
            </div>
            <div className="flex gap-2">
                <input 
                    type="number" 
                    placeholder="Hrs" 
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-16 bg-background border border-border rounded px-2 text-sm focus:outline-none focus:border-primary"
                />
                <button 
                    onClick={handleSleepLog}
                    className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90"
                >
                    LOG
                </button>
            </div>
        </div>

        {/* Protocols List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-3 bg-secondary/50 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold tracking-wider uppercase">Active Protocols</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{protocols.length} Active</span>
            </div>
            
            <div className="p-2 max-h-40 overflow-y-auto space-y-1">
                {protocols.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary/30 text-xs group">
                        <span className="font-mono">{p.text}</span>
                        <button onClick={() => removeProtocol(p.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {protocols.length === 0 && <div className="text-center p-4 text-xs text-muted-foreground">No protocols defined.</div>}
            </div>

            {/* Add New Protocol */}
            <form onSubmit={handleAddRule} className="p-2 border-t border-border flex gap-2">
                <input 
                    value={newRule} 
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="New daily rule..." 
                    className="flex-1 bg-transparent text-xs outline-none px-2"
                />
                <button type="submit" className="text-primary hover:text-primary/80">
                    <Plus className="w-4 h-4" />
                </button>
            </form>
        </div>
    </div>
  );
}