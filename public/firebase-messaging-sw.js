/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Firebase Messaging Service Worker for background push notifications
// Config is passed from the main app via postMessage — no hardcoded credentials.

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

let isInitialized = false;

// Receive Firebase config from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !isInitialized) {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    // Handle background messages (when the tab is not focused or closed)
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw] Background message received:', payload);

      const title = payload.notification?.title || 'RAD5 Café';
      const options = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/RAD5 Cafe.svg',
        badge: '/RAD5 Cafe.svg',
        data: payload.data || {},
        tag: 'rad5-cafe-notification',
        renotify: true,
      };

      self.registration.showNotification(title, options);
    });

    isInitialized = true;
    console.log('[firebase-messaging-sw] Initialized via postMessage.');
  }
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('rad5cafe') && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    }),
  );
});
