import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Settings2, X, Calendar, Clock, AlertCircle } from 'lucide-react';

import { haptics } from '@/lib/haptics';
import { getTasksByStatus, isTaskOverdue, isTaskScheduledForToday, isTaskUpcoming } from '@/lib/taskScheduler';
import { TaskScheduler } from '@/components/TaskScheduler';
import { useVectorStore } from '@/store/useVectorStore';
import type { AttributeType, RecurrencePattern } from '@/types';

export function TaskList() {
  const { tasks, addTask, toggleTask, deleteTask, protocols, addProtocol, removeProtocol } = useVectorStore();
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<AttributeType>('work');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerTaskText, setSchedulerTaskText] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'immediate' | 'scheduled' | 'overdue' | 'today' | 'completed'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const taskStatus = getTasksByStatus(tasks);

  useEffect(() => {
    const overdueTasks = taskStatus.overdue;
    if (overdueTasks.length > 0) {
      import('@/lib/notifications').then(({ requestNotificationPermission }) => {
        requestNotificationPermission().then((hasPermission) => {
          if (hasPermission) {
            import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
              LocalNotifications.schedule({
                notifications: overdueTasks.map((task, idx) => ({
                  title: 'Overdue Task',
                  body: `${task.text} is overdue`,
                  id: 20000 + idx,
                  schedule: { at: new Date(Date.now() + 1000) },
                })),
              });
            });
          }
        });
      });
    }
  }, [taskStatus.overdue.length]);

  const handleSchedule = (
    scheduledFor: string,
    dueDate: string,
    recurrence: RecurrencePattern,
    reminderMinutes: number,
    priority: 'low' | 'medium' | 'high'
  ) => {
    if (!schedulerTaskText.trim()) return;
    addTask(
      schedulerTaskText,
      selectedType,
      10,
      false,
      scheduledFor || undefined,
      dueDate || undefined,
      recurrence,
      reminderMinutes || undefined,
      priority
    );
    haptics.medium();
    setSchedulerTaskText('');
    setShowScheduler(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addTask(inputText, selectedType, 10);
    haptics.light();
    setInputText('');
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Filter by view type
    switch (viewFilter) {
      case 'immediate':
        filtered = filtered.filter(t => !t.completed && !t.scheduledFor);
        break;
      case 'scheduled':
        filtered = filtered.filter(t => !t.completed && t.scheduledFor && isTaskUpcoming(t));
        break;
      case 'overdue':
        filtered = filtered.filter(t => !t.completed && isTaskOverdue(t));
        break;
      case 'today':
        filtered = filtered.filter(t => !t.completed && isTaskScheduledForToday(t));
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      default:
        // 'all' - show all tasks, but optionally filter completed
        if (!showCompleted) {
          filtered = filtered.filter(t => !t.completed);
        }
        break;
    }
    
    return filtered;
  };

  const formatScheduledTime = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    if (isToday) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  // Iron Rule Add
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    addProtocol(newRuleText, selectedType, 2.5);
    haptics.medium();
    setNewRuleText('');
  };

  const types: AttributeType[] = ['strength', 'intellect', 'create', 'mind', 'work', 'others'];

  return (
    <div className="w-full h-full flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-lg relative">
      
      {/* Header */}
      <div className="bg-secondary/50 p-5 border-b border-border backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold tracking-tight text-xs uppercase text-muted-foreground">Active Operations</h2>
          <button 
              onClick={() => setShowRuleEditor(!showRuleEditor)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border ${showRuleEditor ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
          >
              <Settings2 className="w-3 h-3" /> IRON RULES
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 text-xs flex-wrap">
          {(['all', 'immediate', 'scheduled', 'today', 'overdue', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setViewFilter(filter)}
              className={`px-3 py-1.5 rounded capitalize transition-colors ${
                viewFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {filter}
              {filter === 'overdue' && taskStatus.overdue.length > 0 && (
                <span className="ml-1 text-destructive">({taskStatus.overdue.length})</span>
              )}
              {filter === 'completed' && tasks.filter(t => t.completed).length > 0 && (
                <span className="ml-1 text-muted-foreground">({tasks.filter(t => t.completed).length})</span>
              )}
            </button>
          ))}
          {viewFilter === 'all' && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                showCompleted
                  ? 'bg-secondary text-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
              title={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
            >
              {showCompleted ? '✓ Show All' : 'Show All'}
            </button>
          )}
        </div>
      </div>

      {/* IRON RULE EDITOR OVERLAY */}
      <AnimatePresence>
        {showRuleEditor && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/50 border-b border-border p-5 space-y-4"
            >
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Edit Daily System Rules (Resets 00:00)</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {protocols.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs p-3 bg-card border border-border rounded-lg">
                            <span>{p.text} <span className="text-xs text-muted-foreground">({p.type})</span></span>
                            <button 
                              onClick={() => {
                                removeProtocol(p.id);
                                haptics.light();
                              }} 
                              className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddRule} className="flex gap-3">
                    <input 
                        value={newRuleText} 
                        onChange={(e) => setNewRuleText(e.target.value)} 
                        placeholder="New Iron Rule (2.5 XP)..."
                        className="flex-1 bg-secondary text-xs p-2.5 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="submit" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /></button>
                </form>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {showScheduler && (
          <TaskScheduler
            onSchedule={handleSchedule}
            onCancel={() => {
              setShowScheduler(false);
              setSchedulerTaskText('');
            }}
            initialText={schedulerTaskText}
          />
        )}

        {getFilteredTasks().length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-8">
                <p className="text-sm font-mono">SYSTEM IDLE</p>
                <p className="text-xs mt-2">No tasks to display</p>
            </div>
        )}
        
        <AnimatePresence mode='popLayout'>
            {getFilteredTasks()
              .sort((a, b) => {
                if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
                if (isTaskOverdue(a) !== isTaskOverdue(b)) return isTaskOverdue(a) ? -1 : 1;
                if (a.priority !== b.priority) {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
                }
                return 0;
              })
              .map((task) => {
                const overdue = isTaskOverdue(task);
                const scheduledToday = isTaskScheduledForToday(task);
                
                return (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`group flex items-center justify-between p-4 rounded-lg border transition-all ${
                      task.completed 
                        ? 'bg-secondary/20 border-transparent opacity-50' 
                        : overdue
                        ? 'bg-destructive/10 border-destructive/50'
                        : task.isSystem 
                        ? 'bg-indigo-500/5 border-indigo-500/20' 
                        : scheduledToday
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-card border-border'
                    }`}
                  >
                    <button 
                      onClick={() => {
                        toggleTask(task.id);
                        haptics.medium();
                      }} 
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={task.completed ? 'text-primary' : overdue ? 'text-destructive' : 'text-muted-foreground'}>
                        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.text}
                          </span>
                          {overdue && <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />}
                          {task.priority === 'high' && !overdue && (
                            <span className="text-xs px-1.5 py-0.5 bg-destructive/20 text-destructive rounded">HIGH</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                            {task.isSystem && <span className="text-indigo-400 font-bold">IRON • </span>}
                            {task.type} • +{task.xpValue}xp
                          </span>
                          {task.scheduledFor && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatScheduledTime(task.scheduledFor)}
                            </span>
                          )}
                          {task.dueDate && !task.scheduledFor && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {task.recurrence && task.recurrence !== 'none' && (
                            <span className="text-xs text-muted-foreground">• Repeats {task.recurrence}</span>
                          )}
                        </div>
                      </div>
                    </button>
                    {!task.isSystem && (
                      <div className="flex items-center gap-2">
                        {!task.completed && !task.scheduledFor && (
                          <button
                            onClick={() => {
                              setSchedulerTaskText(task.text);
                              setShowScheduler(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground transition-opacity"
                            title="Schedule task"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            deleteTask(task.id);
                            haptics.light();
                          }} 
                          className="opacity-0 group-hover:opacity-100 p-2 text-destructive transition-opacity"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </div>

      {/* New Task Input Area */}
      <form onSubmit={handleAdd} className="p-4 bg-card border-t border-border flex flex-col gap-3">
        {/* Input Row */}
        <div className="flex gap-2">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as AttributeType)}
            className="bg-secondary text-xs uppercase font-bold p-2.5 rounded-lg border border-border outline-none"
          >
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Now
          </button>
          <button
            type="button"
            onClick={() => {
              if (inputText.trim()) {
                setSchedulerTaskText(inputText);
              }
              setShowScheduler(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2.5 rounded-lg hover:bg-primary/20 transition-colors font-medium text-sm"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
        </div>
      </form>
    </div>
  );
}