/* Student push: subscribe device to "allStudents" topic after login.
   Requires: VAPID key pasted below (Firebase Console → Project settings →
   Cloud Messaging → Web Push certificates → Generate). If left as
   placeholder, everything silently skips — announcements still show in-app. */
(function(){
  'use strict';
  var VAPID_KEY = 'VP_VAPID_KEY_PLACEHOLDER';
  var TOPIC = 'allStudents';
  var booted = false;

  function loadScript(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function boot(){
    if (booted) return; booted = true;
    if (VAPID_KEY.indexOf('PLACEHOLDER') !== -1) return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    try{
      var reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      var messaging = firebase.messaging();
      var token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
      if (!token) return;
      await db.collection('fcmTokens').doc(token).set({
        uid: (auth.currentUser && auth.currentUser.uid) || '',
        platform: 'web',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (window.VP_FCM_KEY) {
        await fetch('https://iid.googleapis.com/iid/v1/' + token + '/rel/topics/' + TOPIC, {
          method: 'POST',
          headers: { Authorization: 'key=' + window.VP_FCM_KEY }
        }).catch(function(){});
      }
      messaging.onMessage(function(p){
        var t = (p.notification && p.notification.title) || 'Vinayak ProEdu';
        var b = (p.notification && p.notification.body) || '';
        if (window.__UI) window.__UI.toast(t + (b ? ' — ' + b : ''), 'info', 6000);
      });
    }catch(e){ console.warn('push:', e); }
  }

  auth.onAuthStateChanged(function(u){ if (u) boot(); });
})();
