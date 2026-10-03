// =====================================================
// Vinayak ProEdu — Shared Firebase Configuration
// Import this ONCE in every page that needs Firebase.
// =====================================================

// Obfuscated config — decoded at runtime
const _encoded = "eyJhcGlLZXkiOiAiQUl6YVN5Q3daR1ZLOUlfR1FtSmtSYXRaT3lNczBnZGNaOG5Tb3VjIiwgImF1dGhEb21haW4iOiAidmluYXlhay1wcm9lZHUuZmlyZWJhc2VhcHAuY29tIiwgInByb2plY3RJZCI6ICJ2aW5heWFrLXByb2VkdSIsICJzdG9yYWdlQnVja2V0IjogInZpbmF5YWstcHJvZWR1LmFwcHNwb3QuY29tIiwgIm1lc3NhZ2luZ1NlbmRlcklkIjogIjk5MzY0NjU2MjMzMyIsICJhcHBJZCI6ICIxOjk5MzY0NjU2MjMzMzp3ZWI6NWYzN2EwYjYzZDRkMTc3YWRmNGFmNCJ9";

let firebaseConfig = {};
try {
  firebaseConfig = JSON.parse(atob(_encoded));
} catch (e) {
  console.error("Firebase config decode failed", e);
}

// Initialize only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export global handles for legacy compatibility
window.__db = firebase.firestore();
window.__auth = firebase.auth();
window.__storage = firebase.storage();
window.__ADMIN_EMAIL = "vinayakproedu@gmail.com";

// Convenience helpers
window.db = window.__db;
window.auth = window.__auth;
window.storage = window.__storage;
