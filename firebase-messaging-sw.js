/* Firebase Cloud Messaging — background notifications */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyCwZGVK9I_GQmJkRatZOyMs0gdcZ8nSouc",
  authDomain: "vinayak-proedu.firebaseapp.com",
  projectId: "vinayak-proedu",
  storageBucket: "vinayak-proedu.appspot.com",
  messagingSenderId: "993646562333",
  appId: "1:993646562333:web:5f37a0b63d4d177adf4af4"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload) {
  const n = payload.notification || {};
  return self.registration.showNotification(n.title || 'Vinayak ProEdu', {
    body: n.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png'
  });
});
