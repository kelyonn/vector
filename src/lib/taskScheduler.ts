import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task, RecurrencePattern } from '@/types';

const TASK_NOTIFICATION_PREFIX = 10000; // Start task notifications from ID 10000

export async function scheduleTaskNotification(task: Task): Promise<number | null> {
  if (!task.scheduledFor) return null;

  try {
    const hasPermission = await LocalNotifications.requestPermissions();
    if (hasPermission.display !== 'granted') {
      return null;
    }

    const scheduledDate = new Date(task.scheduledFor);
    const now = new Date();

    if (scheduledDate <= now) {
      return null;
    }

    const notificationId = TASK_NOTIFICATION_PREFIX + parseInt(task.id.slice(0, 8), 16) % 10000;

    const notifications = [];

    if (task.reminderMinutes && task.reminderMinutes > 0) {
      const reminderDate = new Date(scheduledDate.getTime() - task.reminderMinutes * 60 * 1000);
      if (reminderDate > now) {
        notifications.push({
          title: `Reminder: ${task.text}`,
          body: `In ${task.reminderMinutes} minutes`,
          id: notificationId,
          schedule: {
            at: reminderDate,
          },
        });
      }
    }

    notifications.push({
      title: task.text,
      body: `Time to complete: ${task.text}`,
      id: notificationId + 1,
      schedule: {
        at: scheduledDate,
      },
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications,
      });
      return notificationId;
    }

    return null;
  } catch (error) {
    console.error('Failed to schedule task notification:', error);
    return null;
  }
}

export async function cancelTaskNotification(notificationId: number) {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  } catch (error) {
    console.error('Failed to cancel task notification:', error);
  }
}

export function getNextScheduledDate(
  scheduledFor: string,
  recurrence: RecurrencePattern
): string | null {
  if (recurrence === 'none') return null;

  const scheduled = new Date(scheduledFor);
  const now = new Date();
  let nextDate = new Date(scheduled);

  switch (recurrence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'weekdays':
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;
    case 'weekends':
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
      break;
  }

  if (nextDate <= now) {
    while (nextDate <= now) {
      switch (recurrence) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'weekdays':
          do {
            nextDate.setDate(nextDate.getDate() + 1);
          } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
          break;
        case 'weekends':
          do {
            nextDate.setDate(nextDate.getDate() + 1);
          } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
          break;
      }
    }
  }

  return nextDate.toISOString();
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.completed) return false;
  
  const due = new Date(task.dueDate);
  const now = new Date();
  due.setHours(23, 59, 59, 999); // End of due date
  
  return now > due;
}

export function isTaskScheduledForToday(task: Task): boolean {
  if (!task.scheduledFor) return false;
  
  const scheduled = new Date(task.scheduledFor);
  const today = new Date();
  
  return (
    scheduled.getDate() === today.getDate() &&
    scheduled.getMonth() === today.getMonth() &&
    scheduled.getFullYear() === today.getFullYear()
  );
}

export function isTaskUpcoming(task: Task): boolean {
  if (!task.scheduledFor) return false;
  if (task.completed) return false;
  
  const scheduled = new Date(task.scheduledFor);
  const now = new Date();
  
  return scheduled > now;
}

export function getTasksByStatus(tasks: Task[]): {
  immediate: Task[];
  scheduled: Task[];
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    immediate: tasks.filter(t => !t.completed && !t.scheduledFor && (!t.dueDate || new Date(t.dueDate) >= today)),
    scheduled: tasks.filter(t => !t.completed && t.scheduledFor),
    overdue: tasks.filter(t => !t.completed && isTaskOverdue(t)),
    today: tasks.filter(t => !t.completed && isTaskScheduledForToday(t)),
    upcoming: tasks.filter(t => !t.completed && isTaskUpcoming(t)),
  };
}
