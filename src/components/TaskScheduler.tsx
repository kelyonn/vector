import { useState } from 'react';
import { Calendar, Repeat, Bell, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RecurrencePattern } from '@/types';

interface TaskSchedulerProps {
  onSchedule: (scheduledFor: string, dueDate: string, recurrence: RecurrencePattern, reminderMinutes: number, priority: 'low' | 'medium' | 'high') => void;
  onCancel: () => void;
  initialText?: string;
}

export function TaskScheduler({ onSchedule, onCancel }: TaskSchedulerProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrencePattern>('none');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledDate || !scheduledTime) {
      return;
    }

    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hour, minute] = scheduledTime.split(':').map(Number);
    const dateTime = new Date(year, month - 1, day, hour, minute);
    const scheduledFor = dateTime.toISOString();

    onSchedule(
      scheduledFor,
      dueDate || '',
      recurrence,
      reminderMinutes,
      priority
    );
  };

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getNextHour = () => {
    const next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);
    const hours = String(next.getHours()).padStart(2, '0');
    const minutes = String(next.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-lg font-bold mb-1">Schedule Task</h3>
          <p className="text-xs text-muted-foreground">Set date, time, and get notifications</p>
        </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-secondary rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
        {/* Scheduled Date & Time */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-2 mb-2">
            <Calendar className="w-3 h-3" />
            Schedule Date & Time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 bg-secondary border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setScheduledDate(getTomorrow());
              setScheduledTime(getNextHour());
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Quick: Tomorrow {getNextHour()}
          </button>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label className="text-xs font-medium mb-2 block">Due Date (Optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={scheduledDate || new Date().toISOString().split('T')[0]}
            className="w-full bg-secondary border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-2 mb-2">
            <Repeat className="w-3 h-3" />
            Repeat
          </label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)}
            className="w-full bg-secondary border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="none">No Repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="weekdays">Weekdays Only</option>
            <option value="weekends">Weekends Only</option>
          </select>
        </div>

        {/* Reminder */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-2 mb-2">
            <Bell className="w-3 h-3 text-primary" />
            Notification Reminder
          </label>
          <select
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="0">No reminder (only at scheduled time)</option>
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
            <option value="1440">1 day before</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            You'll receive notifications at the reminder time and at the scheduled time
          </p>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-medium mb-2 block">Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-3 rounded-lg text-xs font-medium transition-colors ${
                  priority === p
                    ? p === 'high'
                      ? 'bg-destructive text-destructive-foreground'
                      : p === 'medium'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-secondary border border-border rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!scheduledDate || !scheduledTime}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            Schedule & Enable Notifications
          </button>
        </div>
        </form>
      </div>
    </motion.div>
  );
}
