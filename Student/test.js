/* ============================================================
   Vinayak ProEdu - Student Mock Engine (student/test.js)
   Renders mock papers into #mockListX, full ACCA CBE overlay.
   ============================================================ */
(function(){
  'use strict';

  /* ========== 1. INJECT CSS ========== */
  if (!document.getElementById('vp-mocks-css')) {
    const st = document.createElement('style');
    st.id = 'vp-mocks-css';
    st.textContent = `
      .vp-mock-overlay{position:fixed;inset:0;background:#f5f7fb;z-index:20000;display:none;flex-direction:column;overflow:hidden;}
      .vp-mock-overlay.active{display:flex;}
      .vp-mock-topbar{background:#fff;color:#111827;padding:12px 22px;display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:14px;align-items:center;border-bottom:1px solid #d8dee9;box-shadow:0 8px 22px rgba(15,23,42,.08);z-index:8;}
      .vp-mock-topbar h2{margin:2px 0 0;font-size:1rem;line-height:1.35;color:#111827;font-family:'Playfair Display',serif;}
      .vp-exam-kicker{font-size:.7rem;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;font-weight:800;}
      .vp-exam-pill{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:7px 11px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-weight:800;font-size:.85rem;white-space:nowrap;}
      .vp-exam-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
      .vp-exam-progress{width:150px;height:8px;overflow:hidden;border-radius:999px;background:#e2e8f0;display:inline-block;}
      .vp-exam-progress>span{display:block;height:100%;width:0%;border-radius:999px;background:linear-gradient(90deg,#C9922A,#1e3c72);transition:width .2s ease;}
      .vp-timer{background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;padding:6px 12px;border-radius:10px;font-weight:900;letter-spacing:.3px;}
      .vp-timer.warning{background:#fff7ed;color:#c2410c;border:1px solid #fdba74;}
      .vp-timer.critical{background:#fecaca;color:#7f1d1d;border:1px solid #f87171;}
      .vp-acca-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 14px;background:#f1f3f6;border-bottom:1px solid #d8dee9;}
      .vp-acca-bar button{border:1px solid #c9d2e0;background:#fff;color:#1f2d3d;border-radius:6px;padding:6px 12px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:'DM Sans',sans-serif;}
      .vp-acca-bar button:hover{background:#eef4ff;}
      .vp-mock-body{flex:1;overflow:auto;}
      .vp-exam-shell{gap:18px;width:min(1180px,100%);margin:0 auto;padding:22px 22px 40px;}
      .vp-nav-shell{border-radius:14px;border:1px solid #d8dee9;box-shadow:0 12px 30px rgba(15,23,42,.08);overflow:hidden;background:#fff;padding:14px;margin-bottom:18px;}
      .vp-nav-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}
      .vp-nav-head b{color:#0D1B40;}
      .vp-nav-mini{display:flex;gap:8px;flex-wrap:wrap;font-size:.78rem;color:#6B7280;margin:8px 0;}
      .vp-nav-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e5e7eb;}
      .vp-nav-progress{width:100%;height:12px;overflow:hidden;border-radius:999px;background:#e5e7eb;border:1px solid #dbe4f0;}
      .vp-nav-progress-bar{height:100%;border-radius:999px;background:linear-gradient(135deg,#0D1B40,#1e3c72);transition:width .2s ease;}
      .vp-nav-toggle{width:38px;height:32px;border-radius:999px;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;cursor:pointer;font-size:.95rem;}
      .vp-nav-panel{display:none;}
      .vp-nav-panel.open{display:block;}
      .vp-nav-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:2px;}
      .vp-nav-btn{border:1px solid #dbe4f0;background:#eef4ff;padding:7px 0;border-radius:10px;font-weight:800;cursor:pointer;font-size:.84rem;}
      .vp-nav-btn.answered{background:#d1fae5;border-color:#a7f3d0;}
      .vp-nav-btn.review{background:#fef3c7;border-color:#C9922A;}
      .vp-nav-btn.current{outline:2px solid #1e3c72;background:#dbeafe;}
      .vp-q-card{border-radius:18px;border:1px solid #d8dee9;box-shadow:0 18px 46px rgba(15,23,42,.10);padding:0;overflow:hidden;background:#fff;}
      .vp-q-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px 18px;border-bottom:1px solid #e2e8f0;background:linear-gradient(180deg,#fff,#f8fafc);}
      .vp-q-text{color:#111827;font-size:1.03rem;line-height:1.65;font-weight:400;white-space:pre-wrap;word-break:break-word;tab-size:4;margin:0;padding:12px 14px 4px;}
      .vp-q-main{color:#111827;padding:18px 22px 6px;font-size:1.13rem;font-weight:800;line-height:1.5;white-space:pre-wrap;word-break:break-word;tab-size:4;}
      .vp-q-body{padding:18px 22px 22px;background:#fff;}
      .vp-q-shell{position:relative;padding:8px 0 28px;}
      .vp-watermark{position:absolute;right:12px;bottom:10px;font-family:Georgia,serif;font-size:1.15rem;letter-spacing:.18em;color:#111;opacity:.08;pointer-events:none;user-select:none;white-space:nowrap;}
      .vp-btn{border:none;border-radius:12px;padding:11px 14px;cursor:pointer;font-weight:800;font-family:'DM Sans',sans-serif;font-size:.9rem;}
      .vp-btn-ghost{background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;}
      .vp-btn-primary{background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;}
      .vp-btn-gold{background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;}
      .vp-option{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border:1px solid #d8dee9;border-radius:12px;margin:8px 0;background:#fff;cursor:pointer;transition:background .15s;}
      .vp-option:hover{background:#f8fafc;}
      .vp-option input{width:auto;margin:2px 0 0;accent-color:#1e3c72;}
      .vp-option span{color:#111827;font-size:1.03rem;line-height:1.65;}
      .vp-qimg{max-width:100%;border-radius:16px;border:1px solid #e5e7eb;margin:12px 0;}
      .vp-qimg img{width:100%;display:block;border-radius:16px;}
      .vp-fib{min-width:120px;width:160px;padding:8px 10px;margin:0 4px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;font:inherit;}
      .vp-sb-layout{display:grid;grid-template-columns:1fr 1.1fr;gap:16px;align-items:start;}
      .vp-sb-panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;box-shadow:0 4px 20px rgba(13,27,64,0.08);}
      .vp-sb-panel h4{margin:0 0 10px;font-size:1rem;font-weight:900;color:#0D1B40;}
      .vp-sb-scheme{padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;margin-bottom:12px;font-size:.9rem;}
      .vp-sb-custom{width:100%;}
      .vp-sb-custom table{width:100%;border-collapse:collapse;}
      .vp-sb-custom th,.vp-sb-custom td{padding:8px;border:1px solid #e5e7eb;text-align:left;vertical-align:top;}
      .vp-empty{padding:16px;border:1px dashed #d9e2ef;border-radius:14px;background:#fbfdff;color:#5d6e83;}
      .vp-lock{padding:26px;border:1px solid #fecaca;background:#fff5f5;border-radius:18px;text-align:center;}
      .vp-result-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}
      .vp-result-card{padding:16px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 4px 20px rgba(13,27,64,0.08);}
      .vp-result-ok{background:#ecfdf5 !important;border-color:#86efac !important;}
      .vp-result-warn{background:#fef3c7 !important;border-color:#f3d18b !important;}
      /* Constructed response */
      .vp-cr-layout{align-items:stretch;}
      .vp-cr-word{min-height:220px;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;background:#fff;outline:none;font-size:.95rem;line-height:1.6;}
      .vp-cr-word:focus{border-color:#b8c7ea;box-shadow:0 0 0 3px rgba(30,60,114,.07);}
      .vp-cr-toolbar{display:flex;gap:6px;margin-bottom:8px;}
      .vp-cr-toolbar button{border:1px solid #e5e7eb;background:#f8fafc;border-radius:8px;padding:5px 12px;cursor:pointer;font-weight:700;font-family:inherit;}
      .vp-cr-grid-wrap{overflow:auto;border:1px solid #e5e7eb;border-radius:12px;background:#fff;}
      .vp-cr-grid{border-collapse:collapse;width:100%;min-width:520px;}
      .vp-cr-grid th{background:#eef2f8;border:1px solid #dbe2ee;font-size:.75rem;padding:4px 6px;color:#0D1B40;width:96px;}
      .vp-cr-grid td{border:1px solid #e2e8f0;min-width:96px;height:28px;padding:3px 6px;font-size:.88rem;outline:none;}
      .vp-cr-grid td:focus{background:#f8fbff;box-shadow:inset 0 0 0 2px rgba(30,60,114,.25);}
      .vp-cr-note{margin-top:8px;font-size:.85rem;color:#6B7280;}
      .vp-cr-scenario{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;box-shadow:0 4px 20px rgba(13,27,64,0.08);}
      .vp-cr-scenario h4{margin:0 0 10px;font-size:1rem;font-weight:900;color:#0D1B40;}
      /* Scratchpad + calculator */
      .vp-scratchpad{position:fixed;right:18px;bottom:24px;width:300px;z-index:21000;background:#fffbe6;border:1px solid #e5d9a0;border-radius:14px;box-shadow:0 12px 45px rgba(13,27,64,.14);padding:12px;display:none;gap:8px;}
      .vp-scratchpad.show{display:grid;}
      .vp-scratchpad textarea{min-height:140px;width:100%;margin:0;background:#fffdf2;font-family:'DM Sans',sans-serif;border:1px solid #e5d9a0;border-radius:10px;padding:10px;font-size:.9rem;}
      .vp-calc{position:fixed;right:18px;bottom:24px;width:240px;z-index:21000;background:#111827;border-radius:14px;padding:12px;box-shadow:0 12px 45px rgba(13,27,64,.14);display:none;gap:8px;}
      .vp-calc.show{display:grid;}
      .vp-calc input{width:100%;margin:0;text-align:right;font-weight:800;background:#1f2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:10px;}
      .vp-calc-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
      .vp-calc-keys button{padding:10px 0;border:none;border-radius:8px;background:#374151;color:#fff;font-weight:800;cursor:pointer;}
      .vp-calc-keys button.op{background:#C9922A;color:#111;}
      /* Center modal */
      .vp-center-modal{position:fixed;inset:0;z-index:22000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.62);backdrop-filter:blur(5px);}
      .vp-center-modal.show{display:flex;}
      .vp-center-card{width:min(430px,100%);background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:22px;}
      .vp-center-card h3{margin:0 0 8px;font-size:1.18rem;color:#0D1B40;font-family:'Playfair Display',serif;}
      .vp-center-card p{margin:0 0 14px;color:#6B7280;line-height:1.55;}
      .vp-center-card label{display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;}
      .vp-center-card input{width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#15223b;margin-bottom:12px;font:inherit;outline:none;}
      .vp-center-card input:focus{border-color:#b8c7ea;}
      .vp-center-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px;}
      .vp-timer-warning{display:none;color:#92400e;background:#fef3c7;border:1px solid #f3d18b;padding:8px 10px;border-radius:10px;font-size:.85rem;font-weight:700;}
      @media(max-width:900px){
        .vp-mock-topbar{grid-template-columns:1fr;align-items:start;}
        .vp-sb-layout{grid-template-columns:1fr;}
        .vp-exam-meta{justify-content:flex-start;}
      }
    `;
    document.head.appendChild(st);
  }

  /* ========== 2. INJECT OVERLAY + MODAL HTML ========== */
  if (!document.getElementById('mockOverlay')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="mockOverlay" class="vp-mock-overlay">
        <div class="vp-mock-topbar">
          <div style="min-width:0;">
            <div class="vp-exam-kicker">Vinayak ProEdu Mock Paper</div>
            <h2 id="overlayTitle">Paper</h2>
          </div>
          <div class="vp-exam-meta">
            <span class="vp-exam-pill" id="examQuestionPill">Question 1 of 1</span>
            <span class="vp-exam-pill" id="examMarksPill">0 marks</span>
            <span class="vp-exam-pill"><span id="overlayMetricLabel">Time</span> <strong class="vp-timer" id="overlayTimer">00:00</strong></span>
            <span class="vp-timer-warning" id="timerWarning">15 minutes left</span>
          </div>
          <div class="vp-exam-meta">
            <span class="vp-exam-pill"><span id="examProgressLabel">0% complete</span><span class="vp-exam-progress"><span id="examProgressFill"></span></span></span>
            <button class="vp-btn vp-btn-gold" id="submitMockBtn" type="button">Submit</button>
          </div>
        </div>
        <div class="vp-acca-bar">
          <button type="button" onclick="window.__vpToggleScratchpad()">🗒 Scratch Pad</button>
          <button type="button" onclick="window.__vpInsertSymbol()">$ Symbol</button>
          <button type="button" onclick="window.__vpFormat('hiliteColor','yellow')">🖍 Highlight</button>
          <button type="button" onclick="window.__vpFormat('strikeThrough')">➕ Strikethrough</button>
          <button type="button" onclick="window.__vpToggleCalc()">🧮 Calculator</button>
          <button type="button" onclick="window.__vpToggleNav()">▦ Navigator</button>
          <button type="button" onclick="window.__vpToggleReview()">🚩 Flag for Review</button>
          <button type="button" onclick="window.__vpRequestSubmit()">Close All</button>
        </div>
        <div class="vp-mock-body"><div id="overlayBody"></div></div>
        <div id="vpScratchpad" class="vp-scratchpad">
          <strong style="font-size:.85rem;color:#0D1B40;">Scratch Pad</strong>
          <textarea id="vpScratchpadText" placeholder="Type notes here — kept during this exam only."></textarea>
          <button class="vp-btn vp-btn-ghost" type="button" onclick="document.getElementById('vpScratchpad').classList.remove('show')" style="justify-self:end;">Close</button>
        </div>
        <div id="vpCalc" class="vp-calc">
          <input id="vpCalcDisplay" value="0" readonly>
          <div class="vp-calc-keys" id="vpCalcKeys"></div>
          <button class="vp-btn vp-btn-ghost" type="button" onclick="document.getElementById('vpCalc').classList.remove('show')">Close</button>
        </div>
      </div>
      <div id="centerModal" class="vp-center-modal" role="dialog" aria-modal="true">
        <div class="vp-center-card">
          <h3 id="centerModalTitle">Confirm</h3>
          <p id="centerModalMessage"></p>
          <div id="centerModalInputWrap" style="display:none;">
            <label>Student Name</label>
            <input id="centerModalInput" type="text" placeholder="Enter your name">
          </div>
          <div class="vp-center-actions">
            <button class="vp-btn vp-btn-ghost" id="centerModalCancelBtn" type="button">Cancel</button>
            <button class="vp-btn vp-btn-primary" id="centerModalConfirmBtn" type="button">Confirm</button>
          </div>
        </div>
      </div>`;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ========== 3. HELPERS / STATE ========== */
  const db = () => firebase.firestore();
  const auth = () => firebase.auth();
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const renderPastedText = value => esc(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const normalizeText = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const pad2 = n => String(n).padStart(2, '0');
  const fmtTime = sec => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;

  const state = {
    user: null, papers: [], questions: [], attempts: [],
    activeSubject: '', activePaper: null, activeQuestions: [], currentIndex: 0,
    selected: {}, reviewed: {}, examActive: false, examLocked: false,
    examProtectionArmed: false, lockReason: '', remaining: 0,
    timerEndAt: 0, submitting: false, startTime: 0, timer: null,
    studentName: '', pendingStartPaperId: '', centerModalAction: null,
    resultData: null, examNavOpen: false, uiPromptOpen: false
  };

  const el = {
    mockOverlay: document.getElementById('mockOverlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayMetricLabel: document.getElementById('overlayMetricLabel'),
    overlayTimer: document.getElementById('overlayTimer'),
    overlayBody: document.getElementById('overlayBody'),
    examQuestionPill: document.getElementById('examQuestionPill'),
    examMarksPill: document.getElementById('examMarksPill'),
    examProgressLabel: document.getElementById('examProgressLabel'),
    examProgressFill: document.getElementById('examProgressFill'),
    submitMockBtn: document.getElementById('submitMockBtn'),
    timerWarning: document.getElementById('timerWarning'),
    centerModal: document.getElementById('centerModal'),
    centerModalTitle: document.getElementById('centerModalTitle'),
    centerModalMessage: document.getElementById('centerModalMessage'),
    centerModalInputWrap: document.getElementById('centerModalInputWrap'),
    centerModalInput: document.getElementById('centerModalInput'),
    centerModalCancelBtn: document.getElementById('centerModalCancelBtn'),
    centerModalConfirmBtn: document.getElementById('centerModalConfirmBtn')
  };

  function listContainer(){
    return document.getElementById('mockListX')
        || document.getElementById('paperList')
        || document.querySelector('.mocks-list');
  }

  /* ========== 4. DATA ========== */
  async function loadData(){
    try{
      const [pSnap, qSnap, aSnap] = await Promise.all([
        db().collection('mockPapers').orderBy('createdAt','desc').get().catch(()=>({docs:[]})),
        db().collection('mockQuestions').orderBy('createdAt','asc').get().catch(()=>({docs:[]})),
        state.user ? db().collection('mockAttempts').where('userId','==',state.user.uid).get().catch(()=>({docs:[]})) : Promise.resolve({docs:[]})
      ]);
      state.papers = pSnap.docs.map(d => ({id:d.id,...d.data()})).filter(p => !p.locked);
      state.questions = qSnap.docs.map(d => ({id:d.id,...d.data()}));
      state.attempts = aSnap.docs.map(d => ({id:d.id,...d.data()}));
    }catch(err){ console.error('Firebase load error:', err); }
    renderPapers();
  }

  function getQuestionsForPaper(paperId){ return state.questions.filter(q => String(q.paperId) === String(paperId)); }
  function getAttemptCount(paperId){ return state.attempts.filter(a => String(a.paperId) === String(paperId) && String(a.userId) === String(state.user?.uid)).length; }

  function paperCard(p){
    const qCount = getQuestionsForPaper(p.id).length;
    const attempts = getAttemptCount(p.id);
    const maxAttempts = Math.max(1, Number(p.attemptLimit || 1));
    const canStart = attempts < maxAttempts && qCount > 0;
    const best = state.attempts.filter(a => String(a.paperId) === String(p.id) && String(a.userId) === String(state.user?.uid)).map(a => Number(a.percentage || 0));
    const bestScore = best.length ? Math.max(...best) : 0;
    return `
      <div class="mock-card" style="display:block;border:1.5px solid #e5e7eb;border-radius:16px;padding:18px;background:#fff;margin-bottom:12px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <span class="mock-tag">${esc(p.code || '')}</span>
          <span class="mock-tag">${esc(p.level || '')}</span>
          ${attempts > 0 ? `<span class="mock-tag" style="background:#ecfdf5;color:#0f7a2a;">Best: ${bestScore}%</span>` : ''}
        </div>
        <h3 style="font-family:'Playfair Display',serif;color:#0D1B40;margin:0 0 6px;font-size:1.1rem;">${esc(p.title || 'Mock Paper')}</h3>
        <div style="color:#6B7280;font-size:.9rem;margin-bottom:14px;">${Number(p.timeLimit || 0)} min · ${Number(p.totalMarks || 0)} marks · ${qCount} questions · ${attempts}/${maxAttempts} attempts used</div>
        ${canStart
          ? `<button class="vp-btn vp-btn-primary" onclick="window.startMock('${p.id}')">Start Mock</button>`
          : `<button class="vp-btn vp-btn-ghost" disabled>${qCount === 0 ? 'No Questions Yet' : 'Attempts Exhausted'}</button>`}
      </div>`;
  }

  function renderPapers(){
    const box = listContainer();
    if(!box) return;
    let papers = state.papers;
    if(state.activeSubject) papers = papers.filter(p => !p.subject || String(p.subject).toLowerCase() === state.activeSubject.toLowerCase());
    box.innerHTML = papers.length
      ? papers.map(paperCard).join('')
      : '<div class="vp-empty">No mock papers available for this course yet.</div>';
    const empty = document.getElementById('mockEmptyX');
    if(empty) empty.classList.toggle('hidden', papers.length > 0);
  }

  window.__loadMocksForCourse = function(subject){
    state.activeSubject = subject || '';
    if(!state.papers.length){ loadData(); } else { renderPapers(); }
  };

  /* ========== 5. CENTER MODAL ========== */
  function openCenterModal({title, message, input=false, inputValue='', confirmText='Confirm', onConfirm}){
    state.centerModalAction = typeof onConfirm === 'function' ? onConfirm : null;
    el.centerModalTitle.textContent = title || 'Confirm';
    el.centerModalMessage.textContent = message || '';
    el.centerModalConfirmBtn.textContent = confirmText || 'Confirm';
    el.centerModalInputWrap.style.display = input ? 'block' : 'none';
    el.centerModalInput.value = inputValue || '';
    el.centerModal.classList.add('show');
    setTimeout(() => { if(input) el.centerModalInput.focus(); else el.centerModalConfirmBtn.focus(); }, 0);
  }
  function closeCenterModal(){ el.centerModal.classList.remove('show'); state.centerModalAction = null; }

  function confirmStartMock(paperId){
    const paper = state.papers.find(p => p.id === paperId);
    if(!paper) return;
    state.pendingStartPaperId = paperId;
    const defaultName = state.studentName || (state.user?.displayName || '').trim();
    openCenterModal({
      title:'Start Test',
      message:`Enter your name before starting ${paper.code || ''} - ${paper.title || 'this test'}.`,
      input:true, inputValue:defaultName, confirmText:'Start Test',
      onConfirm:() => {
        const name = el.centerModalInput.value.trim();
        if(!name){ el.centerModalInput.focus(); el.centerModalInput.style.borderColor = '#ef4444'; return false; }
        el.centerModalInput.style.borderColor = '';
        state.studentName = name;
        closeCenterModal();
        beginMock(state.pendingStartPaperId);
        return true;
      }
    });
  }

  function requestSubmitMock(){
    if(!state.examActive || state.submitting) return;
    const hasCR = state.activeQuestions.some(q => q.type === 'word' || q.type === 'excel');
    openCenterModal({
      title:'Are you sure?',
      message: hasCR
        ? 'Objective-test questions will be auto-marked now. Word / Spreadsheet constructed responses are NOT auto-marked — they will be sent to the tutor for manual marking.'
        : 'Once submitted, this attempt will be scored and saved.',
      confirmText:'Submit Paper',
      onConfirm:() => { closeCenterModal(); submitMock(); return true; }
    });
  }
  window.__vpRequestSubmit = requestSubmitMock;

  /* ========== 6. TIMER ========== */
  function updateTimerDisplay(){
    if(!state.examActive || state.examLocked) return;
    const secondsLeft = Math.max(0, Math.ceil((state.timerEndAt - Date.now()) / 1000));
    state.remaining = secondsLeft;
    el.overlayMetricLabel.textContent = 'Time';
    el.overlayTimer.textContent = fmtTime(secondsLeft);
    el.overlayTimer.classList.toggle('warning', secondsLeft <= 900 && secondsLeft > 300);
    el.overlayTimer.classList.toggle('critical', secondsLeft <= 300 && secondsLeft > 0);
    if(el.timerWarning){
      if(secondsLeft <= 900 && secondsLeft > 300){ el.timerWarning.style.display = 'inline-flex'; el.timerWarning.textContent = 'Warning: 15 minutes left'; }
      else if(secondsLeft <= 300 && secondsLeft > 0){ el.timerWarning.style.display = 'inline-flex'; el.timerWarning.textContent = 'Urgent: 5 minutes left'; }
      else el.timerWarning.style.display = 'none';
    }
    if(secondsLeft <= 0){ state.remaining = 0; clearInterval(state.timer); submitMock(); }
  }
  function startTimer(){
    clearInterval(state.timer);
    state.timerEndAt = Date.now() + (Number(state.remaining || 0) * 1000);
    updateTimerDisplay();
    state.timer = setInterval(updateTimerDisplay, 1000);
  }

  /* ========== 7. NAVIGATOR ========== */
  function questionHasAnswer(q){
    const ans = state.selected[q.id];
    const type = q.type || 'mcq';
    if(type === 'fill'){ const arr = Array.isArray(ans) ? ans : []; return arr.some(v => String(v ?? '').trim() !== ''); }
    if(type === 'sectionb'){ const arr = Array.isArray(ans) ? ans : []; return arr.some(v => String(v ?? '').trim() !== ''); }
    if(type === 'word') return String(ans || '').replace(/<[^>]*>/g,'').trim() !== '';
    if(type === 'excel') return Array.isArray(ans) && ans.some(row => Array.isArray(row) && row.some(v => String(v ?? '').trim() !== ''));
    if(type === 'multi') return Array.isArray(ans) ? ans.length > 0 : false;
    if(type === 'mcq' || type === 'screenshot' || type === 'dropdown') return ans !== undefined && ans !== null && String(ans) !== '';
    return Array.isArray(ans) ? ans.length > 0 : String(ans || '').trim() !== '';
  }
  function navButtonClass(q, idx){
    const parts = ['vp-nav-btn'];
    if(idx === state.currentIndex) parts.push('current');
    if(questionHasAnswer(q)) parts.push('answered');
    if(state.reviewed[q.id]) parts.push('review');
    return parts.join(' ');
  }
  function renderNavigator(){
    const total = state.activeQuestions.length;
    const answered = state.activeQuestions.filter(questionHasAnswer).length;
    const reviewed = state.activeQuestions.filter(q => state.reviewed[q.id]).length;
    const progress = total ? Math.round((answered / total) * 100) : 0;
    const isOpen = !!state.examNavOpen;
    return `
      <div class="vp-nav-shell">
        <div class="vp-nav-head"><b>Question Navigator</b><span style="color:#6B7280;font-size:.85rem;" id="navCurrentCount">${state.currentIndex + 1}/${total}</span></div>
        <div class="vp-nav-mini">
          <span class="vp-nav-chip">Answered: <strong id="navAnsweredCount">${answered}</strong>/${total}</span>
          <span class="vp-nav-chip">Review: <strong id="navReviewCount">${reviewed}</strong></span>
        </div>
        <div style="display:grid;gap:10px;margin-top:12px;">
          <div class="vp-nav-progress"><div class="vp-nav-progress-bar" id="navProgressBar" style="width:${progress}%"></div></div>
          <div style="display:flex;justify-content:center;">
            <button class="vp-nav-toggle" type="button" onclick="window.__vpToggleNav()">${isOpen ? '▲' : '▼'}</button>
          </div>
          <div class="vp-nav-panel ${isOpen ? 'open' : ''}" id="navPanel">
            <div class="vp-nav-grid">
              ${state.activeQuestions.map((q, idx) => `<button type="button" class="${navButtonClass(q, idx)}" data-idx="${idx}" onclick="window.gotoQuestion(${idx})">${idx + 1}${state.reviewed[q.id] ? ' ★' : ''}</button>`).join('')}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
              <button class="vp-btn vp-btn-ghost" type="button" onclick="window.prevQ()">Previous</button>
              <button class="vp-btn vp-btn-primary" type="button" onclick="window.nextQ()">Next</button>
              <button class="vp-btn vp-btn-gold" type="button" onclick="window.__vpToggleReview()">${state.reviewed[state.activeQuestions[state.currentIndex]?.id] ? 'Unflag Review' : 'Flag for Review'}</button>
              <button class="vp-btn vp-btn-ghost" type="button" onclick="window.__vpRequestSubmit()">Submit</button>
            </div>
          </div>
        </div>
      </div>`;
  }
  window.__vpToggleNav = function(){
    state.examNavOpen = !state.examNavOpen;
    const panel = document.getElementById('navPanel');
    if(panel) panel.classList.toggle('open', state.examNavOpen);
  };
  function updateNavigatorVisuals(){
    document.querySelectorAll('.vp-nav-btn[data-idx]').forEach(btn => {
      const idx = Number(btn.dataset.idx);
      const q = state.activeQuestions[idx];
      btn.className = navButtonClass(q, idx);
      btn.textContent = `${idx + 1}${state.reviewed[q.id] ? ' ★' : ''}`;
    });
    const navCounter = document.getElementById('navCurrentCount');
    if(navCounter) navCounter.textContent = `${state.currentIndex + 1}/${state.activeQuestions.length}`;
    const answered = state.activeQuestions.filter(questionHasAnswer).length;
    const answerCount = document.getElementById('navAnsweredCount');
    if(answerCount) answerCount.textContent = String(answered);
    const progressBar = document.getElementById('navProgressBar');
    if(progressBar){ const total = state.activeQuestions.length || 1; progressBar.style.width = `${Math.round((answered / total) * 100)}%`; }
    const reviewCount = document.getElementById('navReviewCount');
    if(reviewCount) reviewCount.textContent = String(state.activeQuestions.filter(q => state.reviewed[q.id]).length);
    updateExamHeaderStats();
  }
  function updateExamHeaderStats(){
    const total = state.activeQuestions.length || 0;
    const q = state.activeQuestions[state.currentIndex];
    const answered = state.activeQuestions.filter(questionHasAnswer).length;
    const progress = total ? Math.round((answered / total) * 100) : 0;
    el.examQuestionPill.textContent = `Question ${Math.min(state.currentIndex + 1, total || 1)} of ${total || 1}`;
    el.examMarksPill.textContent = `${q ? questionTotalMarks(q) : 0} marks`;
    el.examProgressLabel.textContent = `${progress}% complete`;
    el.examProgressFill.style.width = `${progress}%`;
  }
  const getDisplayMainQuestion = q => String(q?.mainQuestion || q?.mainQuestionText || '').trim();

  /* ========== 8. ANSWER MATCHING + SECTION B ========== */
  function normalizeComparable(value){
    return normalizeText(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[₹$£€,%]/g,'').replace(/,/g,'').replace(/[^\w.\- ]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function numericComparable(value){
    const text = String(value ?? '').trim().replace(/[₹$£€,%\s,]/g,'');
    if(!text || !/^-?\d+(\.\d+)?$/.test(text)) return null;
    const num = Number(text);
    return Number.isFinite(num) ? num : null;
  }
  function answerMatches(given, expected, alternatives = []){
    const cleanGiven = normalizeComparable(given);
    const accepted = [expected, ...(Array.isArray(alternatives) ? alternatives : [])].map(v => normalizeComparable(v)).filter(Boolean);
    if(!cleanGiven || !accepted.length) return false;
    const givenNum = numericComparable(given);
    if(givenNum !== null){
      return [expected, ...(Array.isArray(alternatives) ? alternatives : [])].some(v => {
        const expectedNum = numericComparable(v);
        return expectedNum !== null && Math.abs(givenNum - expectedNum) <= 0.0001;
      });
    }
    return accepted.includes(cleanGiven);
  }
  function sectionBAnswerFields(root = document){
    const scoped = [...root.querySelectorAll('.vp-sb-custom [data-answer], .vp-sb-custom [data-sb-answer]')];
    return scoped.length ? scoped : [...root.querySelectorAll('[data-answer], [data-sb-answer]')];
  }
  function normalizeFieldValue(field){
    if(!field) return '';
    if(field.tagName === 'SELECT') return String(field.value ?? '').trim();
    if(field.type === 'checkbox') return field.checked ? 'true' : '';
    if(field.type === 'radio') return field.checked ? String(field.value ?? '').trim() : '';
    return String(field.value ?? '').trim();
  }
  const sectionBFieldExpected = field => String(field?.dataset?.answer || field?.dataset?.sbAnswer || '').trim();
  function sectionBFieldAlt(field){
    const raw = String(field?.dataset?.alt || field?.dataset?.sbAlt || '').trim();
    return raw ? raw.split(/[,|]/).map(v => normalizeComparable(v)).filter(Boolean) : [];
  }
  function fillSectionBFields(q, values, root = document){
    const fields = sectionBAnswerFields(root);
    const arr = Array.isArray(values) ? values : [];
    fields.forEach((field, idx) => {
      const value = arr[idx] ?? '';
      if(field.type === 'checkbox') field.checked = String(value) === 'true';
      else if(field.type === 'radio') field.checked = String(field.value) === String(value);
      else if(field.tagName === 'SELECT') field.value = value;
      else { field.value = value; field.setAttribute('value', value); }
    });
  }
  function scoreSectionBHtml(q, values, root = document){
    const temp = document.createElement('div');
    temp.innerHTML = `<div class="vp-sb-custom">${getSectionBHtmlSource(q)}</div>`;
    const fields = sectionBAnswerFields(temp);
    fillSectionBFields(q, values, temp);
    let gained = 0, total = 0;
    fields.forEach(field => {
      const marks = Number(field?.dataset?.marks || field?.dataset?.sbMarks || 1);
      total += marks;
      if(answerMatches(normalizeFieldValue(field), sectionBFieldExpected(field), sectionBFieldAlt(field))) gained += marks;
    });
    return { gained, total };
  }
  function getSectionBHtmlSource(q){
    const raw = String(q?.sectionBHtml || '').trim();
    if(raw){
      if(/<table|<div|<tr|<td|<th/i.test(raw)) return raw;
      const spec = parseSectionBSpec(raw);
      if(spec && spec.rows.length) return generateSectionBHtmlFromRows(spec.rows, spec);
    }
    return generateSectionBHtmlFromRows(Array.isArray(q?.sectionBRows) ? q.sectionBRows : [], { layout: q?.sectionBLayout || '', title: q?.sectionBTitle || '' });
  }
  function generateSectionBHtmlFromRows(rows, options = {}){
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if(!safeRows.length) return '';
    const layout = normalizeText(options.layout || '');
    const title = String(options.title || '').trim();
    const renderInput = (row) => {
      const label = row.label || '';
      const type = String(row.fieldType || 'text').toLowerCase();
      const marks = Number(row.marks || 0);
      const alt = Array.isArray(row.altAnswers) && row.altAnswers.length ? row.altAnswers.join(',') : '';
      const optionList = Array.isArray(row.options) ? row.options : [];
      const answer = String(row.correct ?? '').trim();
      if(['dropdown','mcq','yesno'].includes(type)){
        const opts = optionList.length ? optionList : (type === 'yesno' ? ['Yes','No'] : (answer ? [answer] : ['Option 1','Option 2']));
        return `<tr><td>${esc(label)}</td><td><select data-answer="${esc(answer)}" data-marks="${marks}" data-alt="${esc(alt)}" style="width:100%;margin:0;padding:8px;border:1px solid #e5e7eb;border-radius:8px;font:inherit;"><option value="">Select</option>${opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></td></tr>`;
      }
      if(type === 'number' || ['input','amount','currency'].includes(type))
        return `<tr><td>${esc(label)}</td><td><input type="number" step="any" data-answer="${esc(answer)}" data-marks="${marks}" data-alt="${esc(alt)}" placeholder="Enter answer" style="width:100%;margin:0;padding:8px;border:1px solid #e5e7eb;border-radius:8px;font:inherit;"></td></tr>`;
      return `<tr><td>${esc(label)}</td><td><input type="text" data-answer="${esc(answer)}" data-marks="${marks}" data-alt="${esc(alt)}" placeholder="Enter answer" style="width:100%;margin:0;padding:8px;border:1px solid #e5e7eb;border-radius:8px;font:inherit;"></td></tr>`;
    };
    const bodyRows = safeRows.map((row) => {
      const type = String(row.fieldType || 'text').toLowerCase();
      const label = String(row.label || '').trim();
      const answer = String(row.correct ?? '').trim();
      if(['text','heading','label'].includes(type) && label) return `<tr><td colspan="2" style="background:#f8fafc;font-weight:800;color:#111827;">${esc(label)}</td></tr>`;
      if(['fixed','display'].includes(type)) return `<tr><td>${esc(label)}</td><td style="font-weight:700;text-align:right;">${esc(answer)}</td></tr>`;
      if(type === 'total') return renderInput({ ...row, fieldType:'number' });
      return renderInput(row);
    }).join('');
    const table = layout === 'calctable'
      ? `<table style="width:100%;border-collapse:collapse;"><tbody>${bodyRows}</tbody></table>`
      : `<table style="width:100%;border-collapse:collapse;"><thead><tr><th style="width:46%;padding:8px;border:1px solid #e5e7eb;text-align:left;">Item</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Answer</th></tr></thead><tbody>${bodyRows}</tbody></table>`;
    return `${title ? `<div style="font-weight:900;color:#111827;margin:0 0 10px;font-size:1.05rem;">${esc(title)}</div>` : ''}${table}`;
  }
  function parseSectionBSpec(raw){
    const lines = String(raw || '').split('\n').map(s => s.trim()).filter(Boolean);
    let layout = '', title = '', startIndex = 0;
    const header = lines.length ? parseSectionBHeader(lines[0]) : null;
    if(header && (header.layout || header.title)){ layout = header.layout || ''; title = header.title || ''; startIndex = 1; }
    if(!title && lines[startIndex]){ const t = parseSectionBHeader(lines[startIndex]); if(t && !t.layout && t.title){ title = t.title; startIndex += 1; } }
    const rows = [];
    for(const line of lines.slice(startIndex)){ const r = parseSectionBRowLine(line); if(r) rows.push(r); }
    return { layout, title, rows };
  }
  function parseSectionBHeader(line){
    const cleaned = String(line || '').trim(); if(!cleaned) return null;
    const m = cleaned.match(/^(?:type|layout)\s*=\s*(calc\s*table|statement\s*table|statement|cash\s*flow\s*table|cashflow\s*table)(?:\s*[|]\s*(.*))?$/i);
    if(m){ const rl = normalizeText(m[1]).replace(/\s+/g,''); return { layout: rl.includes('calc') ? 'calcTable' : 'statementTable', title: String(m[2] || '').trim() }; }
    const parts = cleaned.includes('||') ? cleaned.split('||').map(s => s.trim()) : cleaned.split('|').map(s => s.trim());
    const key = normalizeText(parts[0]);
    if(['calctable','calc table','statementtable','statement table','cashflowtable','cash flow table'].includes(key)) return { layout: key.includes('calc') ? 'calcTable' : 'statementTable', title: parts.slice(1).join(' | ').trim() };
    if(['title','heading'].includes(key)) return { title: parts.slice(1).join(' | ').trim() };
    return null;
  }
  function parseSectionBRowLine(line){
    let parts = String(line || '').trim().includes('||') ? String(line).trim().split('||').map(s => s.trim()) : String(line || '').trim().split('|').map(s => s.trim());
    if(!parts.length) return null;
    while(parts.length > 1){
      const p0 = normalizeText(parts[0]), p1 = normalizeText(parts[1]);
      if(p0 && p0 === p1 && ['row','fixed','text','heading','label','total','grandtotal'].includes(p0)){ parts = parts.slice(1); continue; }
      if(p0 === 'row' && ['row','fixed','text','heading','label','total','grandtotal'].includes(p1)){ parts = parts.slice(1); continue; }
      break;
    }
    let label = '', fieldType = 'text', options = [], correct = '', marks = 0, altAnswers = [];
    const prefix = normalizeText(parts[0]);
    const parseAlt = i => parts[i] ? String(parts[i]).split(/[,|]/).map(s => normalizeText(s)).filter(Boolean) : [];
    const parseOptions = i => parts[i] ? String(parts[i]).split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];
    const asInt = v => { const n = Number(String(v ?? '').trim()); return Number.isFinite(n) ? n : NaN; };
    const kind = v => {
      const x = normalizeText(v);
      if(['number','num','input','amount','currency'].includes(x)) return 'number';
      if(['dropdown','select','choice'].includes(x)) return 'dropdown';
      if(['mcq','radio'].includes(x)) return 'mcq';
      if(['yesno','yes/no'].includes(x)) return 'yesno';
      if(['fixed','static','display','label','value'].includes(x)) return 'fixed';
      if(['text','heading','note','instruction','subheading'].includes(x)) return 'text';
      if(['total','sum'].includes(x)) return 'total';
      return x || 'text';
    };
    if(['row','fixed','text','heading','label','total','grandtotal'].includes(prefix)){
      if(prefix === 'row'){
        label = parts[1] || '';
        fieldType = kind(parts[2] || 'number');
        if(['dropdown','mcq','yesno'].includes(fieldType)){ options = parseOptions(3); correct = parts[4] || ''; marks = asInt(parts[5]); altAnswers = parseAlt(6); }
        else if(['fixed','text','heading','label'].includes(fieldType)){ correct = parts[3] || parts[2] || ''; marks = 0; }
        else if(fieldType === 'total'){ fieldType = 'number'; correct = parts[3] || parts[2] || ''; marks = asInt(parts[4]); altAnswers = parseAlt(5); }
        else { correct = parts[2] || ''; marks = asInt(parts[3]); altAnswers = parseAlt(4); }
      } else if(prefix === 'fixed'){ label = parts[1] || ''; fieldType = 'fixed'; correct = parts[2] || ''; marks = 0; }
      else if(prefix === 'total' || prefix === 'grandtotal'){
        fieldType = 'number';
        const second = parts[1] || '', third = parts[2] || '';
        if(!second || second === 'input' || second === 'blank' || second === 'answer'){ label = ''; correct = third || parts[1] || ''; marks = asInt(parts[3]); }
        else if(/^-?\d[\d,]*(\.\d+)?$/.test(second) && (!third || /^-?\d[\d,]*(\.\d+)?$/.test(third))){ label = ''; correct = second; marks = asInt(third); }
        else { label = second; correct = third || second; marks = asInt(parts[3]); }
        altAnswers = parseAlt(4);
      } else { fieldType = 'text'; label = parts.slice(1).join(' | ') || parts[0] || ''; }
    } else {
      label = parts[0] || '';
      fieldType = kind(parts[1] || 'text');
      if(['dropdown','mcq','yesno'].includes(fieldType)){ options = parseOptions(2); correct = parts[3] || ''; marks = asInt(parts[4]); altAnswers = parseAlt(5); }
      else if(['fixed','text','heading','label'].includes(fieldType)){ correct = parts[2] || ''; marks = 0; }
      else if(fieldType === 'total'){ fieldType = 'number'; correct = parts[2] || ''; marks = asInt(parts[3]); altAnswers = parseAlt(4); }
      else { correct = parts[2] || ''; marks = asInt(parts[3]); altAnswers = parseAlt(4); }
    }
    if(Number.isNaN(marks)) marks = 0;
    if(['text','heading','label'].includes(fieldType) && !label) return null;
    if(fieldType === 'fixed' && !label && !String(correct).trim()) return null;
    return { label, fieldType, options, correct, marks, altAnswers };
  }
  function renderSectionBHtmlBlock(q, selected){
    const urls = Array.isArray(q?.imageUrls) && q.imageUrls.length ? q.imageUrls : (q?.imageUrl ? [q.imageUrl] : []);
    const images = urls.filter(Boolean);
    const html = getSectionBHtmlSource(q);
    const exhibitHtml = images.length
      ? `<div style="display:grid;gap:10px;">${images.map((url, idx) => `<div class="vp-qimg"><img src="${esc(url)}" alt="Exhibit ${idx + 1}"></div>`).join('')}</div>`
      : '<div class="vp-empty">No exhibit images.</div>';
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '<div class="vp-empty">No Section B content.</div>';
    fillSectionBFields(q, Array.isArray(selected) ? selected : [], tmp);
    const markingScheme = String(q.sectionBMarkingScheme || '').trim();
    return `<div class="vp-sb-layout">
      <div class="vp-sb-panel"><h4>Exhibit</h4>${exhibitHtml}</div>
      <div class="vp-sb-panel"><h4>Answer Area</h4>
        ${markingScheme ? `<div class="vp-sb-scheme"><strong>Marking scheme:</strong> ${esc(markingScheme)}</div>` : ''}
        <div class="vp-sb-custom">${tmp.innerHTML}</div>
      </div>
    </div>`;
  }
  function questionTotalMarks(q){
    if((q.type || 'mcq') === 'sectionb'){
      const rowsTotal = Array.isArray(q.sectionBRows) ? q.sectionBRows.reduce((s, r) => s + Number(r.marks || 0), 0) : 0;
      return rowsTotal || Number(q.marks || 0);
    }
    return Number(q.marks || 0);
  }

  /* ========== 9. CONSTRUCTED RESPONSE (WORD / EXCEL) ========== */
  const CR_COLS = ['A','B','C','D','E'];
  const CR_ROWS = 10;
  function renderCrScenario(q){
    const mediaUrls = Array.isArray(q.imageUrls) && q.imageUrls.length ? q.imageUrls : (q.imageUrl ? [q.imageUrl] : []);
    const media = mediaUrls.length ? `<div style="display:grid;gap:10px;">${mediaUrls.map((url, idx) => `<div class="vp-qimg"><img src="${esc(url)}" alt="Exhibit ${idx + 1}"></div>`).join('')}</div>` : '';
    return `<div class="vp-cr-scenario"><h4>Scenario</h4><div class="vp-q-text" style="padding:0;">${renderPastedText(q.question || '')}</div>${media}</div>`;
  }
  function renderWordResponse(q, selected){
    return `<div class="vp-sb-layout vp-cr-layout">${renderCrScenario(q)}
      <div class="vp-sb-panel"><h4>Answer Area (Word)</h4>
        <div class="vp-cr-toolbar"><button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="underline"><u>U</u></button><button type="button" data-cmd="insertUnorderedList">• List</button></div>
        <div id="wordAnswer" class="vp-cr-word" contenteditable="true">${String(selected || '')}</div>
        <div class="vp-cr-note">Constructed response — <strong>not auto-marked</strong>. Your answer will be sent to the tutor for manual marking.</div>
      </div></div>`;
  }
  function renderExcelResponse(q, selected){
    const grid = Array.isArray(selected) && selected.length ? selected : Array.from({length: CR_ROWS}, () => Array(CR_COLS.length).fill(''));
    const head = `<tr><th></th>${CR_COLS.map(c => `<th>${c}</th>`).join('')}</tr>`;
    const body = Array.from({length: CR_ROWS}, (_, r) =>
      `<tr><th>${r + 1}</th>${CR_COLS.map((_, c) => {
        const v = grid[r] && grid[r][c] != null ? grid[r][c] : '';
        return `<td class="vp-cr-cell" contenteditable="true" data-r="${r}" data-c="${c}">${esc(v)}</td>`;
      }).join('')}</tr>`).join('');
    return `<div class="vp-sb-layout vp-cr-layout">${renderCrScenario(q)}
      <div class="vp-sb-panel"><h4>Answer Area (Spreadsheet)</h4>
        <div class="vp-cr-grid-wrap"><table class="vp-cr-grid">${head}${body}</table></div>
        <div class="vp-cr-note">Constructed response — <strong>not auto-marked</strong>. Use Scratch Pad / Calculator if needed; your workings will be manually marked.</div>
      </div></div>`;
  }

  function renderFillInline(q, selected){
    const sentence = String(q.sentence || q.question || '');
    const values = Array.isArray(selected) ? selected : [];
    const safeSentence = renderPastedText(sentence);
    const mkInput = idx => `<input type="text" class="vp-fib" data-idx="${idx}" value="${esc(values[idx] ?? '')}">`;
    if(/\{\{\d+\}\}/.test(sentence)) return `<div class="vp-q-text" style="padding:0 0 14px;">${safeSentence.replace(/\{\{(\d+)\}\}/g, (_, n) => mkInput(Number(n) - 1))}</div>`;
    if(/\[blank\]/i.test(sentence)) return `<div class="vp-q-text" style="padding:0 0 14px;">${safeSentence.replace(/\[blank\]/i, mkInput(0))}</div>`;
    if(/_{3,}/.test(sentence)) return `<div class="vp-q-text" style="padding:0 0 14px;">${safeSentence.replace(/_{3,}/, mkInput(0))}</div>`;
    const blankCount = Array.isArray(q.answers) && q.answers.length ? q.answers.length : 1;
    return `<div class="vp-q-text" style="padding:0 0 14px;">${renderPastedText(sentence)}</div><div>${Array.from({length: blankCount}, (_, i) => `<label style="display:block;margin:8px 0;font-size:.85rem;color:#6B7280;">Blank ${i + 1}<br><input type="text" class="vp-fib" data-idx="${i}" value="${esc(values[i] ?? '')}" style="width:100%;margin-top:4px;"></label>`).join('')}</div>`;
  }
  function renderDropdownInline(q, selected){
    const options = Array.isArray(q.options) ? q.options : [];
    const selectHtml = `<select id="dropAnswer" style="margin-top:10px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;font:inherit;"><option value="">Select</option>${options.map((opt, idx) => `<option value="${idx}" ${String(selected) === String(idx) ? 'selected' : ''}>${esc(opt)}</option>`).join('')}</select>`;
    const sentence = String(q.sentence || q.question || '');
    const safe = renderPastedText(sentence);
    if(sentence.includes('[blank]')) return `<div class="vp-q-text" style="padding:0 0 14px;">${safe.replace(/\[blank\]/i, selectHtml)}</div>`;
    if(sentence.includes('{{1}}')) return `<div class="vp-q-text" style="padding:0 0 14px;">${safe.replace(/\{\{1\}\}/, selectHtml)}</div>`;
    return `<div class="vp-q-text" style="padding:0 0 14px;">${safe}</div>${selectHtml}`;
  }

  /* ========== 10. QUESTION RENDER ========== */
  function renderQuestionBody(q){
    const selected = state.selected[q.id];
    const type = q.type || 'mcq';
    const mediaUrls = Array.isArray(q.imageUrls) && q.imageUrls.length ? q.imageUrls : (q.imageUrl ? [q.imageUrl] : []);
    const media = mediaUrls.length ? `<div class="vp-qimg">${mediaUrls.map((url, idx) => `<img src="${esc(url)}" alt="Question image ${idx + 1}" style="${idx > 0 ? 'margin-top:10px;' : ''}">`).join('')}</div>` : '';
    if(type === 'mcq' || type === 'screenshot'){
      const options = Array.isArray(q.options) ? q.options : [];
      return `${media}${options.map((opt, idx) => `<label class="vp-option"><input type="radio" name="answer" value="${idx}" ${String(selected) === String(idx) ? 'checked' : ''}><span>${esc(opt)}</span></label>`).join('')}`;
    }
    if(type === 'multi'){
      const options = Array.isArray(q.options) ? q.options : [];
      const picked = Array.isArray(selected) ? selected : [];
      return `${media}${options.map((opt, idx) => `<label class="vp-option"><input type="checkbox" class="multiBox" value="${idx}" ${picked.includes(idx) ? 'checked' : ''}><span>${esc(opt)}</span></label>`).join('')}`;
    }
    if(type === 'fill') return `${media}${renderFillInline(q, selected)}`;
    if(type === 'sectionb') return renderSectionBHtmlBlock(q, selected);
    if(type === 'dropdown') return `${media}${renderDropdownInline(q, selected)}`;
    if(type === 'word') return renderWordResponse(q, selected);
    if(type === 'excel') return renderExcelResponse(q, selected);
    return `${media}<textarea id="freeAnswer" placeholder="Type your answer here" style="min-height:120px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;width:100%;font:inherit;outline:none;">${esc(selected || '')}</textarea>`;
  }

  function wireQuestionInputs(){
    const q = state.activeQuestions[state.currentIndex];
    if(!q) return;
    const type = q.type || 'mcq';
    if(type === 'mcq' || type === 'screenshot') document.querySelectorAll('input[name="answer"]').forEach(r => r.addEventListener('change', () => { captureAnswer(); updateNavigatorVisuals(); }));
    if(type === 'multi') document.querySelectorAll('.multiBox').forEach(cb => cb.addEventListener('change', () => { captureAnswer(); updateNavigatorVisuals(); }));
    if(type === 'fill') document.querySelectorAll('.vp-fib').forEach(i => i.addEventListener('input', () => { captureAnswer(); updateNavigatorVisuals(); }));
    if(type === 'dropdown'){ const n = document.getElementById('dropAnswer'); if(n) n.addEventListener('change', () => { captureAnswer(); updateNavigatorVisuals(); }); }
    if(type === 'sectionb') document.querySelectorAll('.vp-sb-custom [data-answer], .vp-sb-custom [data-sb-answer]').forEach(f => { f.addEventListener('input', () => { captureAnswer(); updateNavigatorVisuals(); }); f.addEventListener('change', () => { captureAnswer(); updateNavigatorVisuals(); }); });
    if(type === 'word'){
      const ed = document.getElementById('wordAnswer');
      if(ed){
        ed.addEventListener('input', () => { captureAnswer(); updateNavigatorVisuals(); });
        document.querySelectorAll('.vp-cr-toolbar [data-cmd]').forEach(btn => btn.addEventListener('mousedown', e => { e.preventDefault(); document.execCommand(btn.dataset.cmd, false, null); ed.focus(); }));
      }
    }
    if(type === 'excel') document.querySelectorAll('.vp-cr-cell').forEach(cell => cell.addEventListener('input', () => { captureAnswer(); updateNavigatorVisuals(); }));
    const free = document.getElementById('freeAnswer');
    if(free) free.addEventListener('input', () => captureAnswer());
  }

  function renderMockQuestion(){
    if(!state.examActive) return;
    if(state.examLocked){
      el.overlayBody.innerHTML = `<div class="vp-exam-shell"><div class="vp-lock"><h3 style="margin:0 0 8px;">Exam Locked</h3><p>${esc(state.lockReason || 'The exam lost focus.')}</p><p>The attempt is frozen because the browser tab or window changed.</p><div style="margin-top:14px;"><button class="vp-btn vp-btn-gold" onclick="window.__vpRequestSubmit()">Submit Now</button></div></div></div>`;
      return;
    }
    const q = state.activeQuestions[state.currentIndex];
    if(!q){ el.overlayBody.innerHTML = '<div class="vp-exam-shell"><div class="vp-empty">No question found.</div></div>'; return; }
    const crType = (q.type === 'word' || q.type === 'excel');
    const nav = renderNavigator();
    const body = renderQuestionBody(q);
    const reviewed = !!state.reviewed[q.id];
    const mainQuestion = getDisplayMainQuestion(q);
    const normalQuestion = crType ? '' : String(q.question || '').trim();
    updateExamHeaderStats();
    el.overlayBody.innerHTML = `
      <div class="vp-exam-shell">
        ${nav}
        <div class="vp-q-card">
          <div class="vp-q-head">
            <div style="font-weight:800;color:#111;font-size:.9rem;">Section ${esc(q.section || '-')}</div>
            <div style="color:#6B7280;font-size:.9rem;">Question ${state.currentIndex + 1} of ${state.activeQuestions.length}</div>
          </div>
          ${normalQuestion ? `<div class="vp-q-text">${renderPastedText(normalQuestion)}</div>` : ''}
          ${mainQuestion ? `<div class="vp-q-main">${renderPastedText(mainQuestion)}</div>` : ''}
          <div class="vp-q-body">
            <div class="vp-q-shell">
              <div class="vp-watermark">Vinayak ProEdu</div>
              ${body}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
              <button class="vp-btn vp-btn-ghost" onclick="window.prevQ()">Previous</button>
              <button class="vp-btn vp-btn-primary" onclick="window.nextQ()">Next</button>
              <button class="vp-btn vp-btn-gold" onclick="window.__vpToggleReview()">${reviewed ? 'Unflag Review' : 'Flag for Review'}</button>
              <button class="vp-btn vp-btn-ghost" onclick="window.__vpRequestSubmit()">Submit Paper</button>
            </div>
          </div>
        </div>
      </div>`;
    wireQuestionInputs();
    updateNavigatorVisuals();
  }

  function captureAnswer(){
    const q = state.activeQuestions[state.currentIndex];
    if(!q) return;
    const type = q.type || 'mcq';
    let answer = null;
    if(type === 'mcq' || type === 'screenshot'){ const c = document.querySelector('input[name="answer"]:checked'); answer = c ? Number(c.value) : null; }
    else if(type === 'multi'){ answer = [...document.querySelectorAll('.multiBox:checked')].map(c => Number(c.value)); }
    else if(type === 'fill'){ const inputs = [...document.querySelectorAll('.vp-fib')]; if(!inputs.length) return; answer = inputs.map(i => i.value.trim()); }
    else if(type === 'sectionb'){ const fields = sectionBAnswerFields(document); if(!fields.length) return; answer = fields.map(f => normalizeFieldValue(f)); }
    else if(type === 'dropdown'){ const n = document.getElementById('dropAnswer'); if(!n) return; answer = n.value !== '' ? Number(n.value) : null; }
    else if(type === 'word'){ const n = document.getElementById('wordAnswer'); if(!n) return; answer = n.innerHTML.trim(); }
    else if(type === 'excel'){ const cells = [...document.querySelectorAll('.vp-cr-cell')]; if(!cells.length) return; const grid = []; cells.forEach(c => { const r = Number(c.dataset.r), col = Number(c.dataset.c); if(!grid[r]) grid[r] = []; grid[r][col] = c.textContent.trim(); }); answer = grid.map(row => row || []); }
    else { const n = document.getElementById('freeAnswer'); if(!n) return; answer = n.value.trim(); }
    state.selected[q.id] = answer;
  }

  window.gotoQuestion = function(idx){ if(idx < 0 || idx >= state.activeQuestions.length) return; captureAnswer(); state.currentIndex = idx; renderMockQuestion(); };
  window.nextQ = function(){ captureAnswer(); if(state.currentIndex < state.activeQuestions.length - 1){ state.currentIndex++; renderMockQuestion(); } };
  window.prevQ = function(){ captureAnswer(); if(state.currentIndex > 0){ state.currentIndex--; renderMockQuestion(); } };
  window.__vpToggleReview = function(){ const q = state.activeQuestions[state.currentIndex]; if(!q) return; state.reviewed[q.id] = !state.reviewed[q.id]; renderMockQuestion(); };

  /* ========== 11. ACCA TOOLBAR ACTIONS ========== */
  window.__vpToggleScratchpad = function(){ document.getElementById('vpScratchpad')?.classList.toggle('show'); };
  window.__vpInsertSymbol = function(){
    const sym = window.__vpPrompt(() => prompt('Enter symbol to insert (e.g. $, €, £, %)', '$'));
    if(!sym) return;
    const ae = document.activeElement;
    if(ae && ae.isContentEditable){ document.execCommand('insertText', false, sym); return; }
    if(ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')){
      const s = ae.selectionStart ?? ae.value.length, e = ae.selectionEnd ?? s;
      ae.value = ae.value.slice(0, s) + sym + ae.value.slice(e);
      ae.dispatchEvent(new Event('input', {bubbles: true}));
      return;
    }
    const ed = document.getElementById('wordAnswer');
    if(ed){ ed.focus(); document.execCommand('insertText', false, sym); ed.dispatchEvent(new Event('input', {bubbles: true})); return; }
    const cell = document.querySelector('.vp-cr-cell');
    if(cell){ cell.focus(); document.execCommand('insertText', false, sym); cell.dispatchEvent(new Event('input', {bubbles: true})); return; }
    window.__vpPrompt(() => alert('Open a Word/Spreadsheet answer or the Scratch Pad, place the cursor, then insert the symbol.'));
  };
  window.__vpFormat = function(cmd, val){
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed){ window.__vpPrompt(() => alert('Select some text in the scenario or answer first, then apply.')); return; }
    try{
      if(cmd === 'strikeThrough' || cmd === 'hiliteColor'){
        const span = document.createElement('span');
        if(cmd === 'strikeThrough') span.style.textDecoration = 'line-through';
        else span.style.background = val || 'yellow';
        sel.getRangeAt(0).surroundContents(span);
        sel.removeAllRanges();
      } else document.execCommand(cmd, false, val || null);
    }catch(e){ try{ document.execCommand(cmd, false, val || null); }catch(_){} }
    const ae = document.activeElement; if(ae) ae.dispatchEvent(new Event('input', {bubbles: true}));
  };
  window.__vpToggleCalc = function(){
    const pop = document.getElementById('vpCalc'); if(!pop) return;
    pop.classList.toggle('show');
    if(!pop.dataset.built){
      pop.dataset.built = '1';
      const box = document.getElementById('vpCalcKeys');
      ['C','(',')','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','⌫'].forEach(k => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = k;
        if('/*-+'.includes(k) || k === '=') b.classList.add('op');
        b.onclick = () => window.__vpCalcKey(k);
        box.appendChild(b);
      });
    }
  };
  window.__vpCalcKey = function(k){
    const d = document.getElementById('vpCalcDisplay'); if(!d) return;
    if(k === 'C'){ d.value = '0'; return; }
    if(k === '⌫'){ d.value = d.value.length > 1 ? d.value.slice(0, -1) : '0'; return; }
    if(k === '='){ try{ const r = Function('"use strict";return(' + d.value + ')')(); d.value = String(r); }catch(e){ d.value = 'Error'; } return; }
    d.value = (d.value === '0' || d.value === 'Error') ? k : d.value + k;
  };
  window.__vpPrompt = function(fn){ state.uiPromptOpen = true; try{ return fn(); }finally{ setTimeout(() => { state.uiPromptOpen = false; }, 400); } };

  /* ========== 12. EXAM LIFECYCLE ========== */
  function lockExam(reason){ if(!state.examActive || state.examLocked || !state.examProtectionArmed || state.uiPromptOpen) return; state.examLocked = true; state.lockReason = reason || 'Focus changed'; renderMockQuestion(); }
  function enterFullscreen(){ const root = document.documentElement; const req = root.requestFullscreen || root.webkitRequestFullscreen; if(!req) return; try{ const r = req.call(root); if(r && typeof r.catch === 'function') r.catch(() => {}); }catch(err){} }
  function exitFullscreen(){ const ex = document.exitFullscreen || document.webkitExitFullscreen; if(!document.fullscreenElement || !ex) return; try{ const r = ex.call(document); if(r && typeof r.catch === 'function') r.catch(() => {}); }catch(err){} }

  window.startMock = async function(paperId){
    const paper = state.papers.find(p => p.id === paperId);
    const questions = getQuestionsForPaper(paperId);
    if(!paper){ alert('Paper not found'); return; }
    if(paper.locked){ alert('This test is locked by the admin.'); return; }
    if(!questions.length){ alert('No questions uploaded for this paper yet'); return; }
    const usedAttempts = state.attempts.filter(a => String(a.paperId) === String(paperId) && String(a.userId) === String(state.user?.uid || '')).length;
    const maxAttempts = Math.max(1, Number(paper.attemptLimit || 1));
    if(usedAttempts >= maxAttempts){ alert(`You have already used all ${maxAttempts} allowed attempt(s) for this paper.`); return; }
    confirmStartMock(paperId);
  };

  async function beginMock(paperId){
    const paper = state.papers.find(p => p.id === paperId);
    const questions = getQuestionsForPaper(paperId);
    if(!paper || !questions.length) return;
    state.activePaper = paper;
    state.activeQuestions = questions;
    state.currentIndex = 0;
    state.selected = {};
    state.reviewed = {};
    state.examActive = true;
    state.examLocked = false;
    state.examProtectionArmed = false;
    state.lockReason = '';
    state.resultData = null;
    state.remaining = Number(paper.timeLimit || 90) * 60;
    state.startTime = Date.now();
    state.submitting = false;
    state.examNavOpen = false;
    el.overlayTitle.textContent = `${paper.code} - ${paper.title}`;
    el.overlayMetricLabel.textContent = 'Time';
    el.mockOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    enterFullscreen();
    setTimeout(() => { if(state.examActive && !state.examLocked) state.examProtectionArmed = true; }, 3000);
    renderMockQuestion();
    startTimer();
  }

  window.closeMock = function closeMock(){
    closeCenterModal();
    el.mockOverlay.classList.remove('active');
    document.body.style.overflow = '';
    clearInterval(state.timer);
    state.examActive = false;
    state.examLocked = false;
    state.examProtectionArmed = false;
    state.lockReason = '';
    state.resultData = null;
    state.submitting = false;
    state.examNavOpen = false;
    if(el.timerWarning) el.timerWarning.style.display = 'none';
    el.overlayTimer.classList.remove('warning', 'critical');
    exitFullscreen();
  };

  async function submitMock(){
    if(state.submitting) return;
    state.submitting = true;
    captureAnswer();
    clearInterval(state.timer);
    let score = 0, total = 0, hasPendingManual = false;
    for(let i = 0; i < state.activeQuestions.length; i++){
      const q = state.activeQuestions[i];
      const marks = questionTotalMarks(q);
      total += marks;
      const ans = state.selected[q.id];
      const type = q.type || 'mcq';
      let correct = false, gained = 0;
      if(type === 'mcq' || type === 'screenshot'){ correct = String(ans) !== '' && String(ans) === String(q.correct); gained = correct ? marks : 0; }
      else if(type === 'dropdown'){ const ci = Number(q.correctIndex ?? q.correct); correct = String(ans) !== '' && String(ans) === String(ci); gained = correct ? marks : 0; }
      else if(type === 'multi'){ const sArr = JSON.stringify((Array.isArray(ans) ? ans : []).map(v => String(v)).sort()); const cArr = JSON.stringify((Array.isArray(q.correct) ? q.correct : []).map(v => String(v)).sort()); correct = sArr === cArr; gained = correct ? marks : 0; }
      else if(type === 'fill'){
        const given = Array.isArray(ans) ? ans : [ans];
        const corrects = Array.isArray(q.answers) && q.answers.length ? q.answers : (q.answer ? [q.answer] : []);
        const altRaw = Array.isArray(q.altAnswers) ? q.altAnswers : [];
        const altLists = corrects.map((_, idx) => { const item = altRaw[idx]; if(Array.isArray(item)) return item; if(typeof item === 'string') return item.split(/[,|]/).map(v => v.trim()).filter(Boolean); return []; });
        const matched = corrects.filter((c, idx) => answerMatches(given[idx] || '', c, altLists[idx])).length;
        gained = corrects.length ? Math.round((marks * matched / corrects.length) * 100) / 100 : 0;
      }
      else if(type === 'sectionb'){ const sc = scoreSectionBHtml(q, Array.isArray(ans) ? ans : []); gained = sc.gained; correct = sc.total > 0 && sc.gained === sc.total; }
      else if(type === 'word' || type === 'excel'){ correct = false; gained = 0; hasPendingManual = true; }
      else { correct = answerMatches(ans || '', q.correct || q.answer || '', Array.isArray(q.altAnswers) ? q.altAnswers : []); gained = correct ? marks : 0; }
      score += gained;
    }
    const paperTotal = Number(state.activePaper?.totalMarks || 0);
    const totalForResult = paperTotal > 0 ? paperTotal : total;
    const percentage = totalForResult ? Math.round((score / totalForResult) * 100) : 0;
    const answered = state.activeQuestions.filter(questionHasAnswer).length;
    const reviewed = Object.keys(state.reviewed || {}).filter(k => state.reviewed[k]).length;
    const timeTakenSec = Math.max(0, Math.round((Date.now() - (state.startTime || Date.now())) / 1000));
    const studentName = (state.studentName || state.user?.displayName || state.user?.email || 'Student').trim();
    try{
      await db().collection('mockAttempts').add({
        userId: state.user ? state.user.uid : '',
        userEmail: state.user ? state.user.email || '' : '',
        studentName,
        paperId: state.activePaper.id,
        paperCode: state.activePaper.code || '',
        paperTitle: state.activePaper.title || '',
        score, total: totalForResult, percentage, answered, reviewedCount: reviewed, timeTakenSec,
        status: hasPendingManual ? 'pending_marking' : 'auto_marked',
        autoScore: score, autoTotal: totalForResult, pendingManualMarking: hasPendingManual,
        answers: state.selected, reviewed: state.reviewed,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }catch(err){
      console.error('Failed to save attempt:', err);
      alert('Could not save your attempt. Please check your connection and try again.');
      state.submitting = false;
      return;
    }
    state.examActive = false;
    state.submitting = false;
    state.resultData = { paperCode: state.activePaper.code || '', paperTitle: state.activePaper.title || '', studentName, score, total: totalForResult, percentage, answered, reviewed, timeTakenSec, pending: hasPendingManual };
    state.activeQuestions = [];
    state.currentIndex = 0;
    el.mockOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    exitFullscreen();
    renderResultPage();
    await loadData();
  }

  function renderResultPage(){
    const rd = state.resultData;
    if(!rd) return;
    el.overlayTitle.textContent = 'Exam Results';
    el.overlayMetricLabel.textContent = 'Score';
    el.overlayTimer.textContent = `${rd.score}/${rd.total}`;
    el.overlayBody.innerHTML = `
      <div style="display:grid;gap:16px;width:min(1180px,100%);margin:0 auto;padding:22px;">
        <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 20px rgba(13,27,64,0.08);">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h2 style="margin:0 0 6px;font-size:1.2rem;font-family:'Playfair Display',serif;color:#0D1B40;">${esc(rd.paperTitle || 'Exam Results')}</h2>
              <p style="margin:0;color:#6B7280;font-size:.92rem;">${esc(rd.paperCode || '')} · ${esc(rd.studentName || 'Student')} · Completed attempt</p>
            </div>
            <button class="vp-btn vp-btn-ghost" onclick="window.closeMock()">Back to Dashboard</button>
          </div>
          <div class="vp-result-grid">
            <div class="vp-result-card vp-result-ok"><h3 style="margin:0 0 6px;">Score</h3><div style="font-size:2rem;font-weight:900;">${rd.score}/${rd.total}</div></div>
            <div class="vp-result-card"><h3 style="margin:0 0 6px;">Percentage</h3><div style="font-size:2rem;font-weight:900;">${rd.percentage}%</div></div>
            <div class="vp-result-card"><h3 style="margin:0 0 6px;">Answered</h3><div style="font-size:2rem;font-weight:900;">${rd.answered}</div></div>
            <div class="vp-result-card"><h3 style="margin:0 0 6px;">Time Taken</h3><div style="font-size:2rem;font-weight:900;">${fmtTime(rd.timeTakenSec || 0)}</div></div>
            ${rd.pending ? `<div class="vp-result-card vp-result-warn" style="grid-column:1/-1;"><h3 style="margin:0 0 6px;">⏳ Manual Marking Pending</h3><div style="font-weight:700;font-size:.95rem;">Constructed-response (Word / Spreadsheet) answers are not auto-marked in ACCA Skills & Professional papers. Your objective-test score is shown above; the final score will be updated after the tutor manually marks your constructed responses.</div></div>` : ''}
          </div>
        </div>
      </div>`;
  }

  /* ========== 13. PROTECTION + EVENTS ========== */
  window.addEventListener('blur', () => { if(state.examActive) lockExam('Browser focus changed.'); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && state.examActive) lockExam('Tab switch detected.'); });
  window.addEventListener('beforeunload', e => { if(state.examActive){ e.preventDefault(); e.returnValue = ''; } });

  el.submitMockBtn.addEventListener('click', requestSubmitMock);
  el.centerModalCancelBtn.addEventListener('click', closeCenterModal);
  el.centerModalConfirmBtn.addEventListener('click', () => { if(typeof state.centerModalAction === 'function'){ const ok = state.centerModalAction(); if(ok === false) return; } closeCenterModal(); });
  el.centerModalInput.addEventListener('keydown', e => { if(e.key === 'Enter') el.centerModalConfirmBtn.click(); });

  auth().onAuthStateChanged(async user => {
    state.user = user || null;
    if(user) await loadData();
  });

})();
