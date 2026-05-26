import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

export const haptics = {
  light: () => {
    if (!isNative()) return;
    void Haptics.impact({ style: ImpactStyle.Light });
  },
  medium: () => {
    if (!isNative()) return;
    void Haptics.impact({ style: ImpactStyle.Medium });
  },
  heavy: () => {
    if (!isNative()) return;
    void Haptics.impact({ style: ImpactStyle.Heavy });
  },
  success: () => {
    if (!isNative()) return;
    void Haptics.notification({ type: NotificationType.Success });
  },
  warning: () => {
    if (!isNative()) return;
    void Haptics.notification({ type: NotificationType.Warning });
  },
  error: () => {
    if (!isNative()) return;
    void Haptics.notification({ type: NotificationType.Error });
  },
  selection: () => {
    if (!isNative()) return;
    void Haptics.selectionStart();
  },
};
