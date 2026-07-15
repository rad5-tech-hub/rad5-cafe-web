import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// ── Firebase Cloud Messaging (web push) ──────────────
let messagingInstance: Messaging | null = null;

/**
 * Get the Firebase Messaging instance (browser-only, lazy-init).
 * Returns null if messaging is not supported.
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  }

  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Register the service worker and retrieve an FCM web push token.
 * Returns null if permission is denied or messaging is unsupported.
 */
export async function getWebPushToken(): Promise<string | null> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('VITE_FIREBASE_VAPID_KEY is not set — web push disabled.');
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] Web push token obtained.');
      return token;
    }

    console.warn('[FCM] No token returned. Permission may not be granted.');
    return null;
  } catch (err) {
    console.error('[FCM] Failed to get web push token:', err);
    return null;
  }
}

export { onMessage };
