// =====================================================
// Vinayak ProEdu — Shared Utilities
// Pure functions, no side effects, no DOM.
// =====================================================

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtDate(v) {
  if (!v) return '';
  const d = v.toDate ? v.toDate() : new Date(v.seconds ? v.seconds * 1000 : v);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtDateOnly(v) {
  if (!v) return '';
  const d = v.toDate ? v.toDate() : new Date(v.seconds ? v.seconds * 1000 : v);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTestId(v) {
  return String(v ?? '').trim();
}

function getTestIdValue(q) {
  return normalizeTestId(
    q?.testId ?? q?.testID ?? q?.test_id ?? q?.testid ?? ''
  );
}

function getYouTubeId(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const short = raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (short) return short[1];
  const watch = raw.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
  if (watch) return watch[1];
  const embed = raw.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
  if (embed) return embed[1];
  const shorts = raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
  if (shorts) return shorts[1];
  if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return raw;
  return '';
}

function val(id) {
  const node = document.getElementById(id);
  return node ? node.value.trim() : '';
}

function setStatus(node, msg, error = false) {
  if (!node) return;
  node.textContent = msg;
  node.classList.toggle('error', !!error);
}

function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Expose globally for now (modules will import later)
window.esc = esc;
window.fmtDate = fmtDate;
window.fmtDateOnly = fmtDateOnly;
window.slugify = slugify;
window.normalizeTestId = normalizeTestId;
window.getTestIdValue = getTestIdValue;
window.getYouTubeId = getYouTubeId;
window.val = val;
window.setStatus = setStatus;
window.debounce = debounce;
