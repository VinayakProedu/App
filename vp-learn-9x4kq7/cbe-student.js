/* ============================================================
   Vinayak ProEdu — Student ACCA CBE engine (v2)
   Depends on: cbe-core.js (window.CBE) + Firebase compat SDK.
   Renders papers into #mockListX / #paperList / .mocks-list
   ============================================================ */
(function () {
  'use strict';
  const C = window.CBE;
  if(!C) return console.error('cbe-core.js must load first');
  C.injectCss();

  /* ---------------- engine CSS + overlay DOM ---------------- */
  if(!document.getElementById('cbe-student-css')){
    const st = document.createElement('style');
    st.id = 'cbe-student-css';
    st.textContent = `
    .cbe-ov{position:fixed;inset:0;background:#f5f7fb;z-index:20000;display:none;flex-direction:column;overflow:hidden;font-family:'DM Sans',sans-serif;}
    .cbe-ov.open{display:flex;}
    .cbe-topbar{background:#fff;padding:12px 22px;display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:14px;align-items:center;border-bottom:1px solid #d8dee9;box-shadow:0 8px 22px rgba(15,23,42,.08);z-index:8;}
    .cbe-brand{font-size:.7rem;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;font-weight:800;}
    .cbe-topbar h2{margin:2px 0 0;font-size:1rem;color:#111827;font-family:'Playfair Display',serif;line-height:1.35;}
    .cbe-pill{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:7px 11px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-weight:800;font-size:.85rem;white-space:nowrap;}
    .cbe-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
    .cbe-prog{width:150px;height:8px;overflow:hidden;border-radius:999px;background:#e2e8f0;display:inline-block;}
    .cbe-prog>span{display:block;height:100%;width:0%;border-radius:999px;background:linear-gradient(90deg,#C9922A,#1e3c72);transition:width .2s;}
    .cbe-timer{background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;padding:6px 12px;border-radius:10px;font-weight:900;}
    .cbe-timer.warn{background:#fff7ed;color:#c2410c;border:1px solid #fdba74;}
    .cbe-timer.crit{background:#fecaca;color:#7f1d1d;border:1px solid #f87171;}
    .cbe-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 14px;background:#f1f3f6;border-bottom:1px solid #d8dee9;}
    .cbe-bar button{border:1px solid #c9d2e0;background:#fff;color:#1f2d3d;border-radius:6px;padding:6px 12px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;}
    .cbe-bar button:hover{background:#eef4ff;}
    .cbe-scroll{flex:1;overflow:auto;}
    .cbe-shell{width:min(1180px,100%);margin:0 auto;padding:22px;}
    .cbe-nav-shell{border-radius:14px;border:1px solid #d8dee9;box-shadow:0 12px 30px rgba(15,23,42,.08);overflow:hidden;background:#fff;padding:14px;margin-bottom:18px;}
    .cbe-nav-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}
    .cbe-nav-head b{color:#0D1B40;}
    .cbe-nav-mini{display:flex;gap:8px;flex-wrap:wrap;font-size:.78rem;color:#6B7280;margin:8px 0;}
    .cbe-chip2{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e5e7eb;}
    .cbe-nav-prog{width:100%;height:12px;overflow:hidden;border-radius:999px;background:#e5e7eb;border:1px solid #dbe4f0;}
    .cbe-nav-prog>div{height:100%;border-radius:999px;background:linear-gradient(135deg,#0D1B40,#1e3c72);transition:width .2s;}
    .cbe-nav-toggle{width:38px;height:32px;border-radius:999px;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;cursor:pointer;}
    .cbe-nav-panel{display:none;}
    .cbe-nav-panel.open{display:block;}
    .cbe-nav-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px;}
    .cbe-nav-btn{border:1px solid #dbe4f0;background:#eef4ff;padding:7px 0;border-radius:10px;font-weight:800;cursor:pointer;font-size:.84rem;}
    .cbe-nav-btn.answered{background:#d1fae5;border-color:#a7f3d0;}
    .cbe-nav-btn.review{background:#fef3c7;border-color:#C9922A;}
    .cbe-nav-btn.current{outline:2px solid #1e3c72;background:#dbeafe;}
    .cbe-qcard{border-radius:18px;border:1px solid #d8dee9;box-shadow:0 18px 46px rgba(15,23,42,.10);overflow:hidden;background:#fff;}
    .cbe-qhead{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:linear-gradient(180deg,#fff,#f8fafc);}
    .cbe-qbody{padding:18px 22px 22px;position:relative;}
    .cbe-wm{position:absolute;right:14px;bottom:12px;font-family:Georgia,serif;font-size:1.1rem;letter-spacing:.18em;color:#111;opacity:.08;pointer-events:none;user-select:none;}
    .cbe-qbtns{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}
    .cbe-btn{border:none;border-radius:12px;padding:11px 16px;cursor:pointer;font-weight:800;font-family:inherit;font-size:.9rem;}
    .cbe-btn-g{background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;}
    .cbe-btn-p{background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;}
    .cbe-btn-n{background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;}
    .cbe-lock{padding:26px;border:1px solid #fecaca;background:#fff5f5;border-radius:18px;text-align:center;}
    .cbe-scratch{position:fixed;right:18px;bottom:24px;width:300px;z-index:21000;background:#fffbe6;border:1px solid #e5d9a0;border-radius:14px;box-shadow:0 12px 45px rgba(13,27,64,.14);padding:12px;display:none;gap:8px;}
    .cbe-scratch.show{display:grid;}
    .cbe-scratch textarea{min-height:140px;width:100%;margin:0;background:#fffdf2;border:1px solid #e5d9a0;border-radius:10px;padding:10px;font:inherit;}
    .cbe-calc{position:fixed;right:18px;bottom:24px;width:240px;z-index:21000;background:#111827;border-radius:14px;padding:12px;display:none;gap:8px;}
    .cbe-calc.show{display:grid;}
    .cbe-calc input{width:100%;margin:0;text-align:right;font-weight:800;background:#1f2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:10px;}
    .cbe-calc-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
    .cbe-calc-keys button{padding:10px 0;border:none;border-radius:8px;background:#374151;color:#fff;font-weight:800;cursor:pointer;}
    .cbe-calc-keys button.op{background:#C9922A;color:#111;}
    .cbe-modal{position:fixed;inset:0;z-index:22000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.62);backdrop-filter:blur(5px);}
    .cbe-modal.show{display:flex;}
    .cbe-modal-card{width:min(440px,100%);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:22px;}
    .cbe-modal-card h3{margin:0 0 8px;font-size:1.18rem;color:#0D1B40;font-family:'Playfair Display',serif;}
    .cbe-modal-card p{margin:0 0 14px;color:#6B7280;line-height:1.55;}
    .cbe-modal-card label{display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;}
    .cbe-modal-card input{width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px;font:inherit;outline:none;}
    .cbe-modal-act{display:flex;gap:10px;justify-content:flex-end;margin-top:12px;}
    .cbe-timer-warn{display:none;color:#92400e;background:#fef3c7;border:1px solid #f3d18b;padding:6px 10px;border-radius:10px;font-size:.83rem;font-weight:700;}
    .cbe-res-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
    .cbe-res-card{padding:16px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 4px 20px rgba(13,27,64,.08);}
    .cbe-res-ok{background:#ecfdf5 !important;border-color:#86efac !important;}
    .cbe-res-warn{background:#fef3c7 !important;border-color:#f3d18b !important;}
    .cbe-review{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:14px;margin-top:12px;}
    .vp-mock-card{display:block;border:1.5px solid #e5e7eb;border-radius:16px;padding:18px;background:#fff;margin-bottom:12px;}
    .vp-tag{display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:#0D1B40;font-size:.72rem;font-weight:800;margin:0 6px 6px 0;}
    @media(max-width:900px){.cbe-topbar{grid-template-columns:1fr;align-items:start;}.cbe-meta{justify-content:flex-start;}}
    `;
    document.head.appendChild(st);
  }

  if(!document.getElementById('cbeOverlay')){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div id="cbeOverlay" class="cbe-ov">
      <div class="cbe-topbar">
        <div style="min-width:0;">
          <div class="cbe-brand">Vinayak ProEdu · CBE Mock</div>
          <h2 id="cbeTitle">Paper</h2>
        </div>
        <div class="cbe-meta">
          <span class="cbe-pill" id="cbeQp">Question 1 of 1</span>
          <span class="cbe-pill" id="cbeMp">0 marks</span>
          <span class="cbe-pill"><span id="cbeMetricLbl">Time</span> <strong class="cbe-timer" id="cbeTimer">00:00</strong></span>
          <span class="cbe-timer-warn" id="cbeTimerWarn">15 minutes left</span>
        </div>
        <div class="cbe-meta">
          <span class="cbe-pill"><span id="cbeProgLbl">0% complete</span><span class="cbe-prog"><span id="cbeProgFill"></span></span></span>
          <button class="cbe-btn cbe-btn-g" id="cbeSubmitTop" type="button">Submit</button>
        </div>
      </div>
      <div class="cbe-bar">
        <button type="button" data-act="scratch">🗒 Scratch Pad</button>
        <button type="button" data-act="symbol">$ Symbol</button>
        <button type="button" data-act="hl">🖍 Highlight</button>
        <button type="button" data-act="strike">➕ Strikethrough</button>
        <button type="button" data-act="calc">🧮 Calculator</button>
        <button type="button" data-act="nav">▦ Navigator</button>
        <button type="button" data-act="flag">🚩 Flag for Review</button>
        <button type="button" data-act="close">Close All</button>
      </div>
      <div class="cbe-scroll"><div id="cbeBody"></div></div>
      <div id="cbeScratch" class="cbe-scratch">
        <strong style="font-size:.85rem;color:#0D1B40;">Scratch Pad</strong>
        <textarea placeholder="Notes are kept for this exam only."></textarea>
        <button class="cbe-btn cbe-btn-n" type="button" onclick="document.getElementById('cbeScratch').classList.remove('show')">Close</button>
      </div>
      <div id="cbeCalc" class="cbe-calc">
        <input id="cbeCalcDisp" value="0" readonly>
        <div class="cbe-calc-keys" id="cbeCalcKeys"></div>
        <button class="cbe-btn cbe-btn-n" type="button" onclick="document.getElementById('cbeCalc').classList.remove('show')">Close</button>
      </div>
    </div>
    <div id="cbeModal" class="cbe-modal" role="dialog" aria-modal="true">
      <div class="cbe-modal-card">
        <h3 id="cbeModalTitle">Confirm</h3>
        <p id="cbeModalMsg"></p>
        <div id="cbeModalInputWrap" style="display:none;">
          <label>Student Name</label>
          <input id="cbeModalInput" type="text" placeholder="Enter your name">
        </div>
        <div class="cbe-modal-act">
          <button class="cbe-btn cbe-btn-n" id="cbeModalCancel" type="button">Cancel</button>
          <button class="cbe-btn cbe-btn-p" id="cbeModalOk" type="button">Confirm</button>
        </div>
      </div>
    </div>`;
    while(wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ---------------- state ---------------- */
  const db = () => firebase.firestore();
  const esc = C.esc;
  const S = {
    user: null, papers: [], questions: [], attempts: [],
    activeSubject: '', paper: null, qs: [], idx: 0,
    answers: {}, review: {}, active: false, locked: false, armed: false,
    remaining: 0, endAt: 0, timer: null, startTime: 0, submitting: false,
    studentName: '', navOpen: false, uiPrompt: false, pendingPaper: ''
  };
  const $ = id => document.getElementById(id);

  function listBox(){
    return $('mockListX') || $('paperList') || document.querySelector('.mocks-list');
  }
  const getQs = pid => S.questions.filter(q => String(q.paperId) === String(pid)).sort((a, b) => (a.order || 0) - (b.order || 0));

  /* ---------------- data ---------------- */
  async function loadData(){
    const [pSnap, qSnap, aSnap] = await Promise.all([
      db().collection('mockPapers').orderBy('createdAt', 'desc').get().catch(() => ({docs: []})),
      db().collection('mockQuestions').orderBy('createdAt', 'asc').get().catch(() => ({docs: []})),
      S.user ? db().collection('mockAttempts').where('userId', '==', S.user.uid).get().catch(() => ({docs: []})) : Promise.resolve({docs: []})
    ]);
    S.papers = pSnap.docs.map(d => ({id: d.id, ...d.data()})).filter(p => !p.locked);
    S.questions = qSnap.docs.map(d => C.normalize({id: d.id, ...d.data()}));
    S.attempts = aSnap.docs.map(d => ({id: d.id, ...d.data()}));
    renderCards();
  }

  function renderCards(){
    const box = listBox();
    if(!box) return;
    let papers = S.papers;
    if(S.activeSubject) papers = papers.filter(p => !p.subject || String(p.subject).toLowerCase() === S.activeSubject.toLowerCase());
    box.innerHTML = papers.length ? papers.map(card).join('') : '<div style="padding:16px;border:1px dashed #d9e2ef;border-radius:14px;color:#5d6e83;">No mock papers available yet.</div>';
    const empty = $('mockEmptyX');
    if(empty) empty.classList.toggle('hidden', papers.length > 0);
  }
  function card(p){
    const qs = getQs(p.id);
    const used = S.attempts.filter(a => String(a.paperId) === String(p.id)).length;
    const max = Math.max(1, Number(p.attemptLimit || 1));
    const mine = S.attempts.filter(a => String(a.paperId) === String(p.id)).map(a => Number(a.percentage || 0));
    const best = mine.length ? Math.max(...mine) : 0;
    return `
    <div class="vp-mock-card">
      <div>
        <span class="vp-tag">${esc(p.code || '')}</span><span class="vp-tag">${esc(p.level || '')}</span>
        ${mine.length ? `<span class="vp-tag" style="background:#ecfdf5;color:#0f7a2a;">Best: ${best}%</span>` : ''}
      </div>
      <h3 style="font-family:'Playfair Display',serif;color:#0D1B40;margin:4px 0 6px;font-size:1.1rem;">${esc(p.title || 'Mock Paper')}</h3>
      <div style="color:#6B7280;font-size:.9rem;margin-bottom:12px;">${Number(p.timeLimit || 0)} min · ${Number(p.totalMarks || 0)} marks · ${qs.length} questions · ${used}/${max} attempts used</div>
      ${qs.length && used < max
        ? `<button class="cbe-btn cbe-btn-p" onclick="window.startMock('${p.id}')">Start Mock</button>`
        : `<button class="cbe-btn cbe-btn-n" disabled>${!qs.length ? 'No Questions Yet' : 'Attempts Exhausted'}</button>`}
    </div>`;
  }
  window.__loadMocksForCourse = function(subject){ S.activeSubject = subject || ''; S.papers.length ? renderCards() : loadData(); };

  /* ---------------- modal ---------------- */
  let modalAction = null;
  function modal({title, msg, input = false, inputValue = '', okText = 'Confirm', onOk}){
    modalAction = onOk || null;
    $('cbeModalTitle').textContent = title;
    $('cbeModalMsg').textContent = msg;
    $('cbeModalOk').textContent = okText;
    $('cbeModalInputWrap').style.display = input ? 'block' : 'none';
    $('cbeModalInput').value = inputValue;
    $('cbeModal').classList.add('show');
    setTimeout(() => (input ? $('cbeModalInput') : $('cbeModalOk')).focus(), 0);
  }
  function closeModal(){ $('cbeModal').classList.remove('show'); modalAction = null; }

  /* ---------------- exam lifecycle ---------------- */
  window.startMock = function(paperId){
    const p = S.papers.find(x => x.id === paperId);
    if(!p) return alert('Paper not found.');
    if(!getQs(paperId).length) return alert('No questions uploaded for this paper yet.');
    const used = S.attempts.filter(a => String(a.paperId) === String(paperId)).length;
    const max = Math.max(1, Number(p.attemptLimit || 1));
    if(used >= max) return alert(`You have already used all ${max} attempt(s) for this paper.`);
    S.pendingPaper = paperId;
    modal({
      title: 'Start Test',
      msg: `Enter your name before starting ${p.code || ''} - ${p.title || 'this test'}.`,
      input: true, inputValue: S.studentName || (S.user?.displayName || ''), okText: 'Start Test',
      onOk: () => {
        const name = $('cbeModalInput').value.trim();
        if(!name){ $('cbeModalInput').style.borderColor = '#ef4444'; $('cbeModalInput').focus(); return false; }
        S.studentName = name;
        closeModal();
        begin(paperId);
        return true;
      }
    });
  };

  function begin(paperId){
    const p = S.papers.find(x => x.id === paperId);
    S.paper = p;
    S.qs = getQs(paperId);
    S.idx = 0; S.answers = {}; S.review = {};
    S.active = true; S.locked = false; S.armed = false;
    S.remaining = Number(p.timeLimit || 90) * 60;
    S.startTime = Date.now(); S.submitting = false; S.navOpen = false;
    $('cbeTitle').textContent = `${p.code || ''} - ${p.title || ''}`;
    $('cbeMetricLbl').textContent = 'Time';
    $('cbeOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    enterFs();
    setTimeout(() => { if(S.active && !S.locked) S.armed = true; }, 3000);
    renderQ();
    startTimer();
  }

  window.closeMock = function(){
    closeModal();
    $('cbeOverlay').classList.remove('open');
    document.body.style.overflow = '';
    clearInterval(S.timer);
    Object.assign(S, {active: false, locked: false, armed: false, submitting: false, navOpen: false, qs: [], idx: 0});
    $('cbeTimerWarn').style.display = 'none';
    $('cbeTimer').classList.remove('warn', 'crit');
    exitFs();
  };

  /* ---------------- timer ---------------- */
  function startTimer(){
    clearInterval(S.timer);
    S.endAt = Date.now() + S.remaining * 1000;
    tick();
    S.timer = setInterval(tick, 1000);
  }
  function tick(){
    if(!S.active || S.locked) return;
    const left = Math.max(0, Math.ceil((S.endAt - Date.now()) / 1000));
    S.remaining = left;
    $('cbeTimer').textContent = C.fmtTime(left);
    $('cbeTimer').classList.toggle('warn', left <= 900 && left > 300);
    $('cbeTimer').classList.toggle('crit', left <= 300 && left > 0);
    const warn = $('cbeTimerWarn');
    if(left <= 900 && left > 300){ warn.style.display = 'inline-flex'; warn.textContent = 'Warning: 15 minutes left'; }
    else if(left <= 300 && left > 0){ warn.style.display = 'inline-flex'; warn.textContent = 'Urgent: 5 minutes left'; }
    else warn.style.display = 'none';
    if(left <= 0){ clearInterval(S.timer); submit(); }
  }

  /* ---------------- navigator ---------------- */
  const hasAns = q => {
    const a = S.answers[q.id];
    if(C.isCR(q)) return q.type === 'word' ? String(a || '').replace(/<[^>]*>/g, '').trim() !== '' : Array.isArray(a) && a.some(r => Array.isArray(r) && r.some(v => String(v ?? '').trim() !== ''));
    if(a === null || a === undefined) return false;
    if(Array.isArray(a)) return a.length > 0 && a.some(v => String(v ?? '').trim() !== '');
    if(typeof a === 'object') return Object.keys(a).length > 0;
    return String(a) !== '';
  };
  function navBtnClass(q, i){
    return 'cbe-nav-btn' + (i === S.idx ? ' current' : '') + (hasAns(q) ? ' answered' : '') + (S.review[q.id] ? ' review' : '');
  }
  function navHtml(){
    const total = S.qs.length, answered = S.qs.filter(hasAns).length, rev = S.qs.filter(q => S.review[q.id]).length;
    const prog = total ? Math.round(answered / total * 100) : 0;
    return `
    <div class="cbe-nav-shell">
      <div class="cbe-nav-head"><b>Question Navigator</b><span style="color:#6B7280;font-size:.85rem;">${S.idx + 1}/${total}</span></div>
      <div class="cbe-nav-mini">
        <span class="cbe-chip2">Answered: <strong>${answered}</strong>/${total}</span>
        <span class="cbe-chip2">Flagged: <strong>${rev}</strong></span>
      </div>
      <div style="display:grid;gap:10px;margin-top:8px;">
        <div class="cbe-nav-prog"><div style="width:${prog}%"></div></div>
        <div style="display:flex;justify-content:center;"><button class="cbe-nav-toggle" type="button" data-act="nav">${S.navOpen ? '▲' : '▼'}</button></div>
        <div class="cbe-nav-panel ${S.navOpen ? 'open' : ''}">
          <div class="cbe-nav-grid">
            ${S.qs.map((q, i) => `<button type="button" class="${navBtnClass(q, i)}" onclick="window.cbeGoto(${i})">${i + 1}${S.review[q.id] ? ' ★' : ''}</button>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button class="cbe-btn cbe-btn-n" type="button" onclick="window.cbePrev()">Previous</button>
            <button class="cbe-btn cbe-btn-p" type="button" onclick="window.cbeNext()">Next</button>
            <button class="cbe-btn cbe-btn-g" type="button" data-act="flag">${S.review[S.qs[S.idx]?.id] ? 'Unflag Review' : 'Flag for Review'}</button>
            <button class="cbe-btn cbe-btn-n" type="button" data-act="close">Submit</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  function refreshChrome(){
    document.querySelectorAll('.cbe-nav-btn').forEach(btn => {
      const i = [...btn.parentNode.children].indexOf(btn);
      const q = S.qs[i];
      btn.className = navBtnClass(q, i);
      btn.textContent = `${i + 1}${S.review[q.id] ? ' ★' : ''}`;
    });
    const total = S.qs.length || 1, answered = S.qs.filter(hasAns).length;
    const q = S.qs[S.idx];
    $('cbeQp').textContent = `Question ${Math.min(S.idx + 1, S.qs.length || 1)} of ${S.qs.length || 1}`;
    $('cbeMp').textContent = `${q ? C.marksOf(q) : 0} marks`;
    $('cbeProgLbl').textContent = `${Math.round(answered / total * 100)}% complete`;
    $('cbeProgFill').style.width = `${Math.round(answered / total * 100)}%`;
    document.querySelectorAll('[data-act="flag"]').forEach(b => { b.textContent = S.review[q?.id] ? 'Unflag Review' : (S.navOpen ? 'Unflag Review' : '🚩 Flag for Review'); });
  }

  /* ---------------- question render ---------------- */
  function renderQ(){
    if(!S.active) return;
    if(S.locked){
      $('cbeBody').innerHTML = `<div class="cbe-shell"><div class="cbe-lock"><h3 style="margin:0 0 8px;">Exam Locked</h3><p>${esc(S.lockReason || 'Focus changed.')}</p><p>The attempt is frozen because the tab or window changed.</p><button class="cbe-btn cbe-btn-g" data-act="close">Submit Now</button></div></div>`;
      bindActs();
      return;
    }
    const q = S.qs[S.idx];
    if(!q){ $('cbeBody').innerHTML = '<div class="cbe-shell"><div class="cbe-lock">No question found.</div></div>'; return; }
    const body = C.render(q, S.answers[q.id], { answerTitle: C.isCR(q) ? 'Answer Area' : 'Answer' });
    $('cbeBody').innerHTML = `
    <div class="cbe-shell">
      ${navHtml()}
      <div class="cbe-qcard">
        <div class="cbe-qhead">
          <div style="font-weight:800;color:#111;font-size:.9rem;">Section ${esc(q.section || '-')}</div>
          <div style="color:#6B7280;font-size:.9rem;">Question ${S.idx + 1} of ${S.qs.length}</div>
        </div>
        <div class="cbe-qbody">
          <div style="position:relative;">
            <div class="cbe-wm">Vinayak ProEdu</div>
            ${body}
          </div>
          <div class="cbe-qbtns">
            <button class="cbe-btn cbe-btn-n" onclick="window.cbePrev()">Previous</button>
            <button class="cbe-btn cbe-btn-p" onclick="window.cbeNext()">Next</button>
            <button class="cbe-btn cbe-btn-g" data-act="flag">${S.review[q.id] ? 'Unflag Review' : '🚩 Flag for Review'}</button>
            <button class="cbe-btn cbe-btn-n" data-act="close">Submit Paper</button>
          </div>
        </div>
      </div>
    </div>`;
    C.wire($('cbeBody'), q, () => { S.answers[q.id] = C.capture(q, $('cbeBody')); refreshChrome(); });
    bindActs();
    refreshChrome();
  }

  function bindActs(){
    document.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = () => act(b.dataset.act);
    });
  }
  function act(a){
    if(a === 'scratch') $('cbeScratch').classList.toggle('show');
    else if(a === 'calc') toggleCalc();
    else if(a === 'nav'){ S.navOpen = !S.navOpen; renderQ(); }
    else if(a === 'flag'){
      const q = S.qs[S.idx];
      if(q){ S.review[q.id] = !S.review[q.id]; renderQ(); }
    }
    else if(a === 'symbol') insertSymbol();
    else if(a === 'hl') applyFmt('hiliteColor', 'yellow');
    else if(a === 'strike') applyFmt('strikeThrough');
    else if(a === 'close') requestSubmit();
  }

  window.cbeGoto = i => { if(i < 0 || i >= S.qs.length) return; saveAns(); S.idx = i; renderQ(); $('cbeOverlay').querySelector('.cbe-scroll').scrollTop = 0; };
  window.cbeNext = () => { saveAns(); if(S.idx < S.qs.length - 1){ S.idx++; renderQ(); } };
  window.cbePrev = () => { saveAns(); if(S.idx > 0){ S.idx--; renderQ(); } };
  function saveAns(){ const q = S.qs[S.idx]; if(q) S.answers[q.id] = C.capture(q, $('cbeBody')); }

  /* ---------------- toolbar helpers ---------------- */
  const ui = fn => { S.uiPrompt = true; try{ return fn(); } finally{ setTimeout(() => S.uiPrompt = false, 400); } };
  function insertSymbol(){
    const sym = ui(() => prompt('Enter symbol to insert ($, €, £, %)', '$'));
    if(!sym) return;
    const ae = document.activeElement;
    const put = node => { node.focus(); document.execCommand('insertText', false, sym); node.dispatchEvent(new Event('input', {bubbles: true})); };
    if(ae && ae.isContentEditable) return put(ae);
    if(ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')){
      const s = ae.selectionStart ?? ae.value.length, e = ae.selectionEnd ?? s;
      ae.value = ae.value.slice(0, s) + sym + ae.value.slice(e);
      ae.dispatchEvent(new Event('input', {bubbles: true}));
      return;
    }
    const ed = document.querySelector('[data-cbe-word]');
    if(ed) return put(ed);
    const cell = document.querySelector('[data-cbe-cell]');
    if(cell) return put(cell);
    ui(() => alert('Place the cursor in an answer box or the Scratch Pad first.'));
  }
  function applyFmt(cmd, v){
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed){ ui(() => alert('Select some text first, then apply.')); return; }
    try{
      if(cmd === 'strikeThrough' || cmd === 'hiliteColor'){
        const span = document.createElement('span');
        if(cmd === 'strikeThrough') span.style.textDecoration = 'line-through';
        else span.style.background = v || 'yellow';
        sel.getRangeAt(0).surroundContents(span);
        sel.removeAllRanges();
      } else document.execCommand(cmd, false, v || null);
    }catch(e){ try{ document.execCommand(cmd, false, v || null); }catch(_){} }
    const q = S.qs[S.idx];
    if(q) S.answers[q.id] = C.capture(q, $('cbeBody'));
  }
  function toggleCalc(){
    const pop = $('cbeCalc');
    pop.classList.toggle('show');
    if(!pop.dataset.built){
      pop.dataset.built = '1';
      ['C','(',')','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','⌫'].forEach(k => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = k;
        if('/*-+'.includes(k) || k === '=') b.classList.add('op');
        b.onclick = () => calcKey(k);
        $('cbeCalcKeys').appendChild(b);
      });
    }
  }
  function calcKey(k){
    const d = $('cbeCalcDisp');
    if(k === 'C') d.value = '0';
    else if(k === '⌫') d.value = d.value.length > 1 ? d.value.slice(0, -1) : '0';
    else if(k === '='){ try{ d.value = String(Function('"use strict";return(' + d.value + ')')()); }catch(e){ d.value = 'Error'; } }
    else d.value = (d.value === '0' || d.value === 'Error') ? k : d.value + k;
  }

  /* ---------------- proctoring ---------------- */
  function lock(reason){ if(!S.active || S.locked || !S.armed || S.uiPrompt) return; S.locked = true; S.lockReason = reason; renderQ(); }
  const enterFs = () => { const r = document.documentElement, f = r.requestFullscreen || r.webkitRequestFullscreen; if(!f) return; try{ const p = f.call(r); if(p && p.catch) p.catch(() => {}); }catch(e){} };
  const exitFs = () => { const f = document.exitFullscreen || document.webkitExitFullscreen; if(!document.fullscreenElement || !f) return; try{ const p = f.call(document); if(p && p.catch) p.catch(() => {}); }catch(e){} };
  window.addEventListener('blur', () => S.active && lock('Browser focus changed.'));
  document.addEventListener('visibilitychange', () => document.hidden && S.active && lock('Tab switch detected.'));
  window.addEventListener('beforeunload', e => { if(S.active){ e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- submit ---------------- */
  function requestSubmit(){
    if(!S.active || S.submitting) return;
    const hasCR = S.qs.some(C.isCR);
    modal({
      title: 'Are you sure?',
      msg: hasCR
        ? 'Objective-test questions will be auto-marked now. Word / Spreadsheet answers are NOT auto-marked — they will be sent to the tutor for manual marking.'
        : 'Once submitted, this attempt will be scored and saved automatically.',
      okText: 'Submit Paper',
      onOk: () => { closeModal(); submit(); return true; }
    });
  }
  async function submit(){
    if(S.submitting) return;
    S.submitting = true;
    saveAns();
    clearInterval(S.timer);
    let score = 0, summed = 0, hasManual = false;
    const detail = [];
    S.qs.forEach((q, i) => {
      const res = C.score(q, S.answers[q.id]);
      summed += res.marks;
      score = Math.round((score + res.gained) * 100) / 100;
      if(res.manual) hasManual = true;
      detail.push({ q, i, res });
    });
    const total = Number(S.paper?.totalMarks) > 0 ? Number(S.paper.totalMarks) : summed;
    const pct = total ? Math.round(score / total * 100) : 0;
    const answered = S.qs.filter(hasAns).length;
    const timeTakenSec = Math.max(0, Math.round((Date.now() - S.startTime) / 1000));
    const name = (S.studentName || S.user?.displayName || S.user?.email || 'Student').trim();
    let saved = null;
    try{
      const ref = await db().collection('mockAttempts').add({
        userId: S.user ? S.user.uid : '', userEmail: S.user ? S.user.email || '' : '', studentName: name,
        paperId: S.paper.id, paperCode: S.paper.code || '', paperTitle: S.paper.title || '',
        score, total, percentage: pct, answered, reviewedCount: Object.values(S.review).filter(Boolean).length,
        timeTakenSec, status: hasManual ? 'pending_marking' : 'auto_marked',
        autoScore: score, autoTotal: total, pendingManualMarking: hasManual,
        answers: S.answers, review: S.review,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      saved = ref.id;
    }catch(err){
      console.error('Save failed:', err);
      alert('Could not save your attempt. Check your connection and press Submit again.');
      S.submitting = false;
      return;
    }
    S.active = false;
    S.submitting = false;
    exitFs();
    renderResult({ name, score, total, pct, answered, timeTakenSec, hasManual, detail, saved });
    await loadData();
  }

  function renderResult(r){
    $('cbeTitle').textContent = 'Exam Results';
    $('cbeMetricLbl').textContent = 'Score';
    $('cbeTimer').textContent = `${r.score}/${r.total}`;
    const reviewRows = r.detail.map(({q, i, res}) => `
      <div class="cbe-review">
        <div style="font-weight:800;color:#0D1B40;margin-bottom:6px;">Q${i + 1} · ${C.marksOf(q)} marks ${res.manual ? '<span class="vp-tag" style="background:#fef3c7;">manual marking</span>' : `<span class="vp-tag" style="background:${res.fullyCorrect ? '#d1fae5' : '#fee2e2'};">${res.gained}/${res.marks} marks</span>`}</div>
        ${q.heading ? `<div style="white-space:pre-wrap;font-size:.95rem;margin-bottom:6px;">${esc(q.heading)}</div>` : ''}
        ${C.isCR(q)
          ? `<div style="font-size:.9rem;color:#6B7280;">Your constructed response was submitted and will be marked by the tutor against the marking guide.</div>`
          : `<div style="font-size:.9rem;line-height:1.6;"><div><strong>Your answer:</strong> ${esc(C.answerText(q, S.answers[q.id]))}</div>
             <div><strong>Correct answer:</strong> ${esc(C.correctText(q))}</div>
             ${q.explanation ? `<div style="margin-top:6px;padding:10px;background:#f8fafc;border-radius:8px;"><strong>Explanation:</strong> ${esc(q.explanation)}</div>` : ''}</div>`}
      </div>`).join('');
    $('cbeBody').innerHTML = `
    <div class="cbe-shell">
      <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 20px rgba(13,27,64,.08);">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <h2 style="margin:0 0 6px;font-size:1.2rem;font-family:'Playfair Display',serif;color:#0D1B40;">${esc(S.paper.title || 'Exam Results')}</h2>
            <p style="margin:0;color:#6B7280;font-size:.92rem;">${esc(S.paper.code || '')} · ${esc(r.name)} · Completed attempt</p>
          </div>
          <button class="cbe-btn cbe-btn-n" onclick="window.closeMock()">Back to Dashboard</button>
        </div>
        <div class="cbe-res-grid">
          <div class="cbe-res-card cbe-res-ok"><h3 style="margin:0 0 6px;">Score (OT)</h3><div style="font-size:1.8rem;font-weight:900;">${r.score}/${r.total}</div></div>
          <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Percentage</h3><div style="font-size:1.8rem;font-weight:900;">${r.pct}%</div></div>
          <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Answered</h3><div style="font-size:1.8rem;font-weight:900;">${r.answered}/${S.qs.length}</div></div>
          <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Time Taken</h3><div style="font-size:1.8rem;font-weight:900;">${C.fmtTime(r.timeTakenSec)}</div></div>
          ${r.hasManual ? `<div class="cbe-res-card cbe-res-warn" style="grid-column:1/-1;"><h3 style="margin:0 0 6px;">⏳ Manual Marking Pending</h3><div style="font-weight:600;font-size:.93rem;">Constructed-response (Word / Spreadsheet) answers are not auto-marked, exactly like the real ACCA Skills & Professional papers. Your objective-test score is shown above; the tutor will add the constructed-response marks and your final score will update.</div></div>` : ''}
        </div>
      </div>
      <h3 style="font-family:'Playfair Display',serif;color:#0D1B40;margin:18px 0 4px;">Question Review</h3>
      ${reviewRows}
    </div>`;
  }

  /* ---------------- events ---------------- */
  $('cbeSubmitTop').addEventListener('click', requestSubmit);
  $('cbeModalCancel').addEventListener('click', closeModal);
  $('cbeModalOk').addEventListener('click', () => { if(modalAction && modalAction() === false) return; closeModal(); });
  $('cbeModalInput').addEventListener('keydown', e => { if(e.key === 'Enter') $('cbeModalOk').click(); });

  firebase.auth().onAuthStateChanged(async user => { S.user = user || null; if(user) await loadData(); });
})();
