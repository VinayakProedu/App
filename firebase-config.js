
/* Vinayak ProEdu — Shared Firebase Configuration */
(function () {
  "use strict";

  const encodedConfig =
    "eyJhcGlLZXkiOiAiQUl6YVN5Q3daR1ZLOUlfR1FtSmtSYXRaT3lNczBnZGNaOG5Tb3VjIiwgImF1dGhEb21haW4iOiAidmluYXlhay1wcm9lZHUuZmlyZWJhc2VhcHAuY29tIiwgInByb2plY3RJZCI6ICJ2aW5heWFrLXByb2VkdSIsICJzdG9yYWdlQnVja2V0IjogInZpbmF5YWstcHJvZWR1LmFwcHNwb3QuY29tIiwgIm1lc3NhZ2luZ1NlbmRlcklkIjogIjk5MzY0NjU2MjMzMyIsICJhcHBJZCI6ICIxOjk5MzY0NjU2MjMzMzp3ZWI6NWYzN2EwYjYzZDRkMTc3YWRmNGFmNCJ9";

  if (typeof firebase === "undefined" || !firebase.apps) {
    console.error("Firebase SDK did not load before firebase-config.js.");
    return;
  }

  let firebaseConfig;

  try {
    firebaseConfig = JSON.parse(atob(encodedConfig));
  } catch (error) {
    console.error("Firebase configuration could not be decoded.", error);
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    window.__db = firebase.firestore();
    window.__auth = firebase.auth();

    try {
      window.__storage =
        typeof firebase.storage === "function"
          ? firebase.storage()
          : null;
    } catch (error) {
      window.__storage = null;
    }

    window.__ADMIN_EMAIL = "vinayakproedu@gmail.com";

    // Compatibility aliases used by existing portal pages.
    window.db = window.__db;
    window.auth = window.__auth;
    window.storage = window.__storage;

    // Never store FCM server credentials in browser-side code.
    window.VP_FCM_KEY = "";

    console.info("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
})();
