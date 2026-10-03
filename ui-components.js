// =====================================================
// Vinayak ProEdu — Shared UI Components
// Reusable: toasts, modals, loaders, empty states.
// =====================================================

window.__UI = {
  toast(msg, type = 'info', duration = 3000) {
    let container = document.getElementById('ui-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ui-toast-container';
      container.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:99999;
        display:flex; flex-direction:column; gap:10px;
        font-family:'DM Sans',sans-serif;
      `;
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const colors = {
      info:  '#0D1B40',
      success:'#065f46',
      error: '#b42318',
      warn:  '#92400e'
    };
    el.style.cssText = `
      background:${colors[type] || colors.info}; color:#fff;
      padding:12px 18px; border-radius:12px; font-size:0.9rem;
      box-shadow:0 8px 24px rgba(0,0,0,0.2); max-width:320px;
      animation: slideInToast 0.3s ease;
    `;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  modal({ title, body, onClose, width = 'min(520px, 92vw)' }) {
    const overlay = document.createElement('div');
    overlay.className = 'ui-modal-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:30000;
      background:rgba(13,27,64,0.88); backdrop-filter:blur(8px);
      display:flex; align-items:center; justify-content:center;
      padding:20px; animation: fadeIn 0.2s ease;
    `;
    overlay.innerHTML = `
      <div style="
        background:#fff; border-radius:24px; padding:36px;
        width:${width}; max-height:86vh; overflow:auto;
        box-shadow:0 40px 100px rgba(0,0,0,0.45);
        border:1px solid rgba(201,146,42,0.25);
        animation: scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h2 style="font-family:'Playfair Display',serif; color:#0D1B40; margin:0; font-size:1.5rem;">${esc(title || '')}</h2>
          <button class="ui-modal-close" style="
            width:36px; height:36px; border-radius:50%; border:1px solid #e5e7eb;
            background:#f8fafc; cursor:pointer; font-size:1.2rem; color:#0D1B40;
          ">×</button>
        </div>
        <div class="ui-modal-body">${body}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => { overlay.remove(); if (onClose) onClose(); };
    overlay.querySelector('.ui-modal-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
    });
    return { close, overlay };
  },

  empty(msg = 'No data found.') {
    return `<div class="ui-empty" style="
      padding:24px; border:1px dashed #d9e2ef; border-radius:14px;
      background:#fbfdff; color:#5d6e83; text-align:center; font-size:0.92rem;
    ">${esc(msg)}</div>`;
  },

  loader(size = 40) {
    return `<div style="display:flex; justify-content:center; padding:28px;">
      <div style="width:${size}px; height:${size}px; border:3px solid #e5e7eb;
        border-top-color:#C9922A; border-radius:50%;
        animation: spin 0.8s linear infinite;"></div>
    </div>`;
  },

  confirm(msg, onYes) {
    const { close, overlay } = this.modal({
      title: 'Confirm',
      body: `<p style="margin:0 0 18px; color:#374151;">${esc(msg)}</p>
             <div style="display:flex; gap:10px; justify-content:flex-end;">
               <button class="ui-btn-cancel" style="padding:10px 16px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; font-weight:600;">Cancel</button>
               <button class="ui-btn-yes" style="padding:10px 16px; border-radius:10px; border:none; background:linear-gradient(135deg,#C9922A,#E8AA48); color:#12203a; font-weight:700; cursor:pointer;">Yes</button>
             </div>`
    });
    overlay.querySelector('.ui-btn-cancel').onclick = close;
    overlay.querySelector('.ui-btn-yes').onclick = () => { close(); onYes(); };
  }
};

// Inject keyframes once
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInToast { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes spin { to { transform:rotate(360deg); } }
`;
document.head.appendChild(style);
