// =====================================================
// Vinayak ProEdu — Shared Firebase Configuration
// =====================================================
const _encoded = "eyJhcGlLZXkiOiAiQUl6YVN5Q3daR1ZLOUlfR1FtSmtSYXRaT3lNczBnZGNaOG5Tb3VjIiwgImF1dGhEb21haW4iOiAidmluYXlhay1wcm9lZHUuZmlyZWJhc2VhcHAuY29tIiwgInByb2plY3RJZCI6ICJ2aW5heWFrLXByb2VkdSIsICJzdG9yYWdlQnVja2V0IjogInZpbmF5YWstcHJvZWR1LmFwcHNwb3QuY29tIiwgIm1lc3NhZ2luZ1NlbmRlcklkIjogIjk5MzY0NjU2MjMzMyIsICJhcHBJZCI6ICIxOjk5MzY0NjU2MjMzMzp3ZWI6NWYzN2EwYjYzZDRkMTc3YWRmNGFmNCJ9";
let firebaseConfig = {};
try { firebaseConfig = JSON.parse(atob(_encoded)); } catch (e) { console.error("Firebase config decode failed", e); }
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

window.__db = firebase.firestore();
window.__auth = firebase.auth();
// Guarded: some pages don't load the storage SDK — never crash
try { window.__storage = (typeof firebase.storage === 'function') ? firebase.storage() : null; } catch (e) { window.__storage = null; }
window.__ADMIN_EMAIL = "vinayakproedu@gmail.com";
window.db = window.__db;
window.auth = window.__auth;
window.storage = window.__storage;

/* ===== PUSH NOTIFICATIONS (optional) =====
   Firebase Console → Project settings → Cloud Messaging → copy the
   Legacy "Server key", base64-encode it, paste below. */
try { window.VP_FCM_KEY = atob("UE9TVF9ZT1VSX0xFR0FDWV9TRVJWRVJfS0VZX0hFUkU="); } catch(e) { window.VP_FCM_KEY = ""; }
