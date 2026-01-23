import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationSettings {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  remindIronRules: boolean;
  remindGoals: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  morningTime: '08:00',
  eveningTime: '20:00',
  remindIronRules: true,
  remindGoals: true,
};

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyNotifications(settings: NotificationSettings) {
  if (!settings.enabled) {
    await LocalNotifications.cancel({ notifications: [] });
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];

  if (settings.remindIronRules) {
    const [morningHour, morningMinute] = settings.morningTime.split(':').map(Number);
    const [eveningHour, eveningMinute] = settings.eveningTime.split(':').map(Number);

    notifications.push({
      title: 'Vector: Morning Check-in',
      body: 'Complete your Iron Rules for the day',
      id: 1,
      schedule: {
        every: 'day' as const,
        on: {
          hour: morningHour,
          minute: morningMinute,
        },
      },
    });

    notifications.push({
      title: 'Vector: Evening Check-in',
      body: 'Review your progress and complete remaining tasks',
      id: 2,
      schedule: {
        every: 'day' as const,
        on: {
          hour: eveningHour,
          minute: eveningMinute,
        },
      },
    });
  }

  await LocalNotifications.schedule({
    notifications,
  });
}

export async function cancelAllNotifications() {
  await LocalNotifications.cancel({ notifications: [] });
}

export function getDefaultNotificationSettings(): NotificationSettings {
  const stored = localStorage.getItem('vector-notification-settings');
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem('vector-notification-settings', JSON.stringify(settings));
}
