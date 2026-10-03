// =====================================================
// Vinayak ProEdu — Auth Guard & Routing
// Handles: login state, role detection, redirects.
// =====================================================

const ADMIN_EMAIL = "vinayakproedu@gmail.com";

window.__AuthGuard = {
  user: null,
  isAdmin: false,
  listeners: [],

  init() {
    if (!window.auth) {
      console.error("AuthGuard: Firebase Auth not loaded. Include firebase-config.js first.");
      return;
    }
    auth.onAuthStateChanged(user => this.handle(user));
  },

  handle(user) {
    this.user = user || null;
    this.isAdmin = !!(user && user.email === ADMIN_EMAIL);
    this.listeners.forEach(cb => cb(this.user, this.isAdmin));

    // Auto-redirect based on page context
    const path = location.pathname;
    const isAdminPage = path.includes('/admin/');
    const isStudentPage = path.includes('/student/');

    if (!user) {
      if (isAdminPage || isStudentPage) {
        // Not logged in on a portal page → send to landing
        location.href = '/index.html';
      }
      return;
    }

    if (isAdminPage && !this.isAdmin) {
      // Student trying to access admin
      location.href = '/student/index.html';
      return;
    }

    if (isStudentPage && this.isAdmin) {
      // Admin on student page → optional: redirect to admin
      // location.href = '/admin/index.html';
      return;
    }

    // If admin logs in from landing page, auto-jump to admin
    if (this.isAdmin && path.endsWith('index.html') && !path.includes('/admin/') && !path.includes('/student/')) {
      const unlocked = sessionStorage.getItem('adminUnlocked') === '1' || localStorage.getItem('adminUnlocked') === '1';
      if (unlocked) location.href = '/admin/index.html';
    }
  },

  onChange(cb) {
    this.listeners.push(cb);
    if (this.user !== undefined) cb(this.user, this.isAdmin);
  },

  async requireAuth() {
    return new Promise((resolve) => {
      if (this.user !== null) { resolve(this.user); return; }
      const unsub = auth.onAuthStateChanged(user => {
        unsub();
        resolve(user);
      });
    });
  },

  async logout() {
    sessionStorage.removeItem('adminUnlocked'); localStorage.removeItem('adminUnlocked');
    await auth.signOut();
    location.href = '/index.html';
  }
};

// Auto-init when DOM + Firebase are ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.auth) window.__AuthGuard.init();
});
