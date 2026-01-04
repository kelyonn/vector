import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Settings2, X } from 'lucide-react';

import { useVectorStore } from '@/store/useVectorStore';
import type { AttributeType } from '@/types';

export function TaskList() {
  const { tasks, addTask, toggleTask, deleteTask, protocols, addProtocol, removeProtocol } = useVectorStore();
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<AttributeType>('work');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');

  // Manual Task Add
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addTask(inputText, selectedType, 10); // Standard Tasks = 10 XP
    setInputText('');
  };

  // Iron Rule Add
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    addProtocol(newRuleText, selectedType, 2.5); // Iron Rules = 2.5 XP
    setNewRuleText('');
  };

  const types: AttributeType[] = ['strength', 'intellect', 'create', 'mind', 'work', 'others'];

  return (
    <div className="w-full h-full flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-lg relative">
      
      {/* Header */}
      <div className="bg-secondary/50 p-4 border-b border-border backdrop-blur-sm flex justify-between items-center">
        <h2 className="font-bold tracking-tight text-xs uppercase text-muted-foreground">Active Operations</h2>
        <button 
            onClick={() => setShowRuleEditor(!showRuleEditor)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded border ${showRuleEditor ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
        >
            <Settings2 className="w-3 h-3" /> IRON RULES
        </button>
      </div>

      {/* IRON RULE EDITOR OVERLAY */}
      <AnimatePresence>
        {showRuleEditor && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/50 border-b border-border p-4 space-y-3"
            >
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Edit Daily System Rules (Resets 00:00)</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {protocols.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-card border border-border rounded">
                            <span>{p.text} <span className="text-[10px] text-muted-foreground">({p.type})</span></span>
                            <button onClick={() => removeProtocol(p.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddRule} className="flex gap-2">
                    <input 
                        value={newRuleText} 
                        onChange={(e) => setNewRuleText(e.target.value)} 
                        placeholder="New Iron Rule (2.5 XP)..."
                        className="flex-1 bg-secondary text-xs p-2 rounded border border-border outline-none"
                    />
                    <button type="submit" className="bg-primary text-primary-foreground px-3 rounded"><Plus className="w-4 h-4" /></button>
                </form>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <p className="text-xs font-mono">SYSTEM IDLE</p>
            </div>
        )}
        
        <AnimatePresence mode='popLayout'>
            {/* Sort: Iron Rules first, then others */}
            {[...tasks].sort((a,b) => (a.isSystem === b.isSystem ? 0 : a.isSystem ? -1 : 1)).map((task) => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                  task.completed 
                    ? 'bg-secondary/20 border-transparent opacity-50' 
                    : task.isSystem ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-card border-border'
                }`}
              >
                <button onClick={() => toggleTask(task.id)} className="flex items-center gap-3 flex-1 text-left">
                  <div className={task.completed ? 'text-primary' : 'text-muted-foreground'}>
                    {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      {task.isSystem && <span className="text-indigo-400 font-bold">IRON • </span>}
                      {task.type} • +{task.xpValue}xp
                    </span>
                  </div>
                </button>
                {!task.isSystem && (
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                )}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* New Task Input Area */}
      <form onSubmit={handleAdd} className="p-3 bg-card border-t border-border flex flex-col gap-2">
          <div className="flex gap-2">
            <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as AttributeType)}
                className="bg-secondary text-[10px] uppercase font-bold p-2 rounded border border-border outline-none"
            >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Add operation..."
                className="flex-1 bg-secondary/50 border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="bg-primary text-primary-foreground p-2 rounded-md"><Plus className="w-5 h-5" /></button>
          </div>
      </form>
    </div>
  );
}