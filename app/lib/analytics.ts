import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  isSupported,
  type Analytics,
} from 'firebase/analytics';
import { app } from './firebase';

let analyticsInstance: Analytics | null = null;
let supportChecked = false;

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  if (supportChecked) return null;
  supportChecked = true;

  // Requires GA4 to be linked in the Firebase console (Project Settings →
  // Integrations → Google Analytics) and VITE_FIREBASE_MEASUREMENT_ID set —
  // silently no-ops until that's done, rather than crashing the app.
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  try {
    analyticsInstance = getAnalytics(app);
  } catch {
    return null;
  }
  return analyticsInstance;
}

/** Logs a GA4 `page_view` — call on every route change. */
export async function logPageView(path: string, title?: string): Promise<void> {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  logEvent(analytics, 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

/** Logs a custom `element_click` event — the web-side "every button click" autocapture. */
export async function logElementClick(details: {
  tag: string;
  text?: string;
  id?: string;
  route: string;
}): Promise<void> {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  logEvent(analytics, 'element_click', details);
}

/** Ties subsequent events to a signed-in user + tags them customer/admin. */
export async function setAnalyticsActor(userId: string | null, role?: 'customer' | 'admin'): Promise<void> {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  setUserId(analytics, userId);
  if (role) setUserProperties(analytics, { role });
}
