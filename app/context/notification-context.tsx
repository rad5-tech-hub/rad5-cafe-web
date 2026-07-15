import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./toast-context";
import { getWebPushToken, getMessagingInstance, onMessage } from "~/lib/firebase";
import { api } from "~/lib/api";

export type AppNotificationContent = {
  title: string;
  body: string;
  categoryId?: string;
  data?: Record<string, any>;
};

type NotificationContextValue = {
  permissionStatus: NotificationPermission;
  fcmToken: string | null;
  notify: (content: AppNotificationContent) => Promise<string>;
  requestPermission: () => Promise<NotificationPermission>;
  registerWebPush: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { showToast } = useToast();
  const registeredRef = useRef(false);
  const foregroundListenerRef = useRef<(() => void) | null>(null);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied' as NotificationPermission;
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    return result;
  }, []);

  /**
   * Register for FCM web push notifications:
   * 1. Request permission
   * 2. Get FCM token
   * 3. Save token to backend
   * 4. Set up foreground message listener
   */
  const registerWebPush = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (registeredRef.current) return;

    try {
      // Request permission if not already granted
      let permission = 'default' as NotificationPermission;
      if ('Notification' in window) {
        permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
          setPermissionStatus(permission);
        }
      }

      if (permission !== 'granted') {
        console.log('[FCM] Notification permission not granted.');
        return;
      }

      // Get FCM token
      const token = await getWebPushToken();
      if (!token) return;

      setFcmToken(token);
      registeredRef.current = true;

      // Save token to backend
      try {
        await api.auth.saveWebPushToken(token);
      } catch (err) {
        console.warn('[FCM] Failed to save web push token to backend:', err);
      }

      // Set up foreground message listener
      if (!foregroundListenerRef.current) {
        const messaging = await getMessagingInstance();
        if (messaging) {
          foregroundListenerRef.current = onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground message received:', payload);

            const title = payload.notification?.title || 'RAD5 Café';
            const body = payload.notification?.body || 'You have a new notification';

            // Show in-app toast
            showToast(body, 'success');

            // Also show a browser notification if the page is not focused
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(title, {
                  body,
                  icon: '/RAD5 Cafe.svg',
                });
              } catch {
                // ignore
              }
            }
          });
        }
      }
    } catch (err) {
      console.error('[FCM] Registration failed:', err);
    }
  }, [showToast]);

  // Check initial permission status and auto-register if already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted') {
        registerWebPush();
      }
    }
  }, [registerWebPush]);

  // Show a local notification (toast + browser notification)
  const notify = useCallback(
    async (content: AppNotificationContent) => {
      // 1. Show a beautiful toast alert in-app
      showToast(content.body, content.categoryId === 'error' ? 'error' : 'success');

      // 2. Trigger native browser push notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(content.title, {
            body: content.body,
            icon: '/RAD5 Cafe.svg',
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
      fcmToken,
      notify,
      requestPermission,
      registerWebPush,
    }),
    [permissionStatus, fcmToken, notify, requestPermission, registerWebPush]
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
