import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "./toast-context";

export type AppNotificationContent = {
  title: string;
  body: string;
  categoryId?: string;
  data?: Record<string, any>;
};

type NotificationContextValue = {
  permissionStatus: NotificationPermission;
  notify: (content: AppNotificationContent) => Promise<string>;
  requestPermission: () => Promise<NotificationPermission>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { showToast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    return result;
  }, []);

  const notify = useCallback(
    async (content: AppNotificationContent) => {
      // 1. Show a beautiful toast alert in-app
      showToast(content.body, content.categoryId === 'error' ? 'error' : 'success');

      // 2. Trigger native browser push notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(content.title, {
            body: content.body,
            icon: '/favicon.ico',
          });
        } catch (err) {
          console.warn('Native notification failed:', err);
        }
      }

      return Math.random().toString(36).substring(2);
    },
    [showToast]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      permissionStatus,
      notify,
      requestPermission,
    }),
    [permissionStatus, notify, requestPermission]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
export type { NotificationContextValue };
