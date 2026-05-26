import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task, RecurrencePattern } from '@/types';

const TASK_NOTIFICATION_PREFIX = 10000;

export interface TaskNotificationIds {
  reminder?: number;
  at: number;
}

function baseNotificationId(taskId: string): number {
  return TASK_NOTIFICATION_PREFIX + (parseInt(taskId.slice(0, 8), 16) % 10000);
}

export async function scheduleTaskNotification(task: Task): Promise<TaskNotificationIds | null> {
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

    const baseId = baseNotificationId(task.id);
    const notifications: { title: string; body: string; id: number; schedule: { at: Date } }[] = [];
    let reminderId: number | undefined;

    if (task.reminderMinutes && task.reminderMinutes > 0) {
      const reminderDate = new Date(scheduledDate.getTime() - task.reminderMinutes * 60 * 1000);
      if (reminderDate > now) {
        reminderId = baseId;
        notifications.push({
          title: `Reminder: ${task.text}`,
          body: `In ${task.reminderMinutes} minutes`,
          id: reminderId,
          schedule: { at: reminderDate },
        });
      }
    }

    const atId = baseId + 1;
    notifications.push({
      title: task.text,
      body: `Time to complete: ${task.text}`,
      id: atId,
      schedule: { at: scheduledDate },
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      return { reminder: reminderId, at: atId };
    }

    return null;
  } catch (error) {
    console.error('Failed to schedule task notification:', error);
    return null;
  }
}

export async function cancelTaskNotifications(ids: TaskNotificationIds | undefined) {
  if (!ids) return;
  const toCancel = [ids.reminder, ids.at].filter((id): id is number => id != null);
  if (toCancel.length === 0) return;

  try {
    await LocalNotifications.cancel({
      notifications: toCancel.map((id) => ({ id })),
    });
  } catch (error) {
    console.error('Failed to cancel task notifications:', error);
  }
}

/** @deprecated use cancelTaskNotifications */
export async function cancelTaskNotification(notificationId: number) {
  await cancelTaskNotifications({ at: notificationId });
}

export function getNextScheduledDate(
  scheduledFor: string,
  recurrence: RecurrencePattern
): string | null {
  if (recurrence === 'none') return null;

  const scheduled = new Date(scheduledFor);
  const now = new Date();
  const nextDate = new Date(scheduled);

  const advance = (d: Date) => {
    switch (recurrence) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'weekdays':
        do {
          d.setDate(d.getDate() + 1);
        } while (d.getDay() === 0 || d.getDay() === 6);
        break;
      case 'weekends':
        do {
          d.setDate(d.getDate() + 1);
        } while (d.getDay() !== 0 && d.getDay() !== 6);
        break;
    }
  };

  advance(nextDate);

  if (nextDate <= now) {
    while (nextDate <= now) {
      advance(nextDate);
    }
  }

  return nextDate.toISOString();
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.completed) return false;

  const due = new Date(task.dueDate);
  const now = new Date();
  due.setHours(23, 59, 59, 999);

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

export function isTaskScheduledActive(task: Task): boolean {
  if (!task.scheduledFor || task.completed) return false;
  return isTaskUpcoming(task) || isTaskScheduledForToday(task);
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
    immediate: tasks.filter(
      (t) => !t.completed && !t.scheduledFor && (!t.dueDate || new Date(t.dueDate) >= today)
    ),
    scheduled: tasks.filter((t) => !t.completed && isTaskScheduledActive(t)),
    overdue: tasks.filter((t) => !t.completed && isTaskOverdue(t)),
    today: tasks.filter((t) => !t.completed && isTaskScheduledForToday(t)),
    upcoming: tasks.filter((t) => !t.completed && isTaskUpcoming(t)),
  };
}

export async function rescheduleAllTaskNotifications(tasks: Task[]) {
  const now = new Date();
  for (const task of tasks) {
    if (!task.scheduledFor || task.completed) continue;
    if (new Date(task.scheduledFor) <= now) continue;
    const ids = await scheduleTaskNotification({
      ...task,
      notificationIds: undefined,
      notificationId: undefined,
    });
    if (ids) {
      // Caller should persist ids via updateTask
    }
  }
}
