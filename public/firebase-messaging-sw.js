/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Firebase Messaging Service Worker for background push notifications
// Initialized directly with public config keys for background wake-up support.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBKgOavgM86MoUON7F2TW4yrmgg8bbXOE0",
  authDomain: "shield-3f2ba.firebaseapp.com",
  projectId: "shield-3f2ba",
  storageBucket: "shield-3f2ba.firebasestorage.app",
  messagingSenderId: "655121686902",
  appId: "1:655121686902:android:c748d3f15831445c595a57",
};

firebase.initializeApp(firebaseConfig);
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
