/* ============================================================
   Vinayak ProEdu — Student ACCA CBE engine (v3, ACCA-style UI)
   Depends on: cbe-core.js (window.CBE) + Firebase compat SDK.
   UI mirrors the real ACCA CBE platform:
   toolbar (Scratch Pad / $ Symbol / Highlight / Strikethrough /
   Calculator / Help | Close All / Flag for Review), list Navigator
   with Unseen/Incomplete/Complete statuses, Unseen Content warning,
   Review screen + End Exam confirmation, TI-style calculator.
   ============================================================ */
(function () {
  'use strict';
  const C = window.CBE;
  if(!C) return console.error('cbe-core.js must load first');
  C.injectCss();

  /* ---------------- engine CSS ---------------- */
  if(!document.getElementById('cbe-student-css')){
    const st = document.createElement('style');
    st.id = 'cbe-student-css';
    st.textContent = `
    .cbe-ov{position:fixed;inset:0;background:#fff;z-index:20000;display:none;flex-direction:column;overflow:hidden;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#1f2937;}
    .cbe-ov.open{display:flex;}
    .cbe-header{background:#fff;border-bottom:1px solid #d8dee9;display:flex;justify-content:space-between;align-items:center;padding:8px 16px;gap:12px;flex-wrap:wrap;}
    .cbe-examname{font-weight:800;color:#111;display:flex;align-items:center;gap:8px;font-size:.95rem;}
    .cbe-greendot{width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;}
    .cbe-headright{display:flex;align-items:center;gap:14px;font-size:.88rem;}
    .cbe-timer{font-weight:800;color:#0D1B40;background:#f1f3f6;border:1px solid #d8dee9;padding:3px 10px;border-radius:6px;}
    .cbe-timer.warn{background:#fff7ed;color:#c2410c;border-color:#fdba74;}
    .cbe-timer.crit{background:#fecaca;color:#7f1d1d;border-color:#f87171;}
    .cbe-timer-warn{display:none;color:#92400e;background:#fef3c7;border:1px solid #f3d18b;padding:3px 8px;border-radius:6px;font-size:.78rem;font-weight:700;}
    .cbe-toolbar{background:#f1f3f6;border-bottom:1px solid #d8dee9;display:flex;justify-content:space-between;align-items:center;padding:0 10px;min-height:40px;flex-wrap:wrap;gap:4px;}
    .cbe-tb-left,.cbe-tb-right{display:flex;align-items:center;gap:2px;flex-wrap:wrap;}
    .cbe-tb-btn{border:none;background:transparent;padding:8px 10px;cursor:pointer;font:inherit;font-weight:700;color:#1f2937;display:inline-flex;align-items:center;gap:5px;border-radius:4px;}
    .cbe-tb-btn:hover{background:#e3e9f2;}
    .cbe-tb-sep{width:1px;height:20px;background:#c9d2e0;margin:0 4px;}
    .cbe-swatch{width:16px;height:16px;border:1px solid #9ca3af;display:inline-block;vertical-align:middle;}
    .cbe-hl-wrap{position:relative;}
    .cbe-menu{position:absolute;top:100%;left:0;background:#fff;border:1px solid #c9d2e0;box-shadow:0 10px 30px rgba(15,23,42,.18);z-index:50;display:none;padding:8px;min-width:190px;border-radius:6px;}
    .cbe-menu.open{display:block;}
    .cbe-menu .row{display:flex;gap:6px;margin-bottom:8px;}
    .cbe-menu .row .cbe-swatch{width:26px;height:26px;cursor:pointer;}
    .cbe-menu button{display:block;width:100%;text-align:left;border:none;background:#fff;padding:6px 8px;cursor:pointer;font:inherit;font-weight:600;border-radius:4px;}
    .cbe-menu button:hover{background:#f1f3f6;}
    .cbe-main{flex:1;display:flex;min-height:0;}
    .cbe-scen{width:44%;border-right:1px solid #d8dee9;overflow:auto;padding:16px 18px;background:#fff;}
    .cbe-ans{flex:1;overflow:auto;padding:16px 18px;background:#fff;min-width:0;}
    .cbe-secband{font-weight:800;color:#111;font-size:.95rem;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:12px;display:flex;justify-content:space-between;}
    .cbe-footer{background:#fff;border-top:1px solid #d8dee9;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:8px 14px;}
    .cbe-fbtn{border:1px solid #9aa7b8;background:#fff;padding:8px 16px;cursor:pointer;font:inherit;font-weight:700;color:#1f2937;border-radius:3px;}
    .cbe-fbtn:hover{background:#f1f3f6;}
    .cbe-fbtn-primary{background:#0D1B40;color:#fff;border-color:#0D1B40;}
    .cbe-fbtn-primary:hover{background:#1a2e5e;}
    .cbe-pop{position:absolute;top:52px;left:14px;background:#fff;border:1px solid #9aa7b8;box-shadow:0 14px 40px rgba(15,23,42,.25);z-index:60;display:none;flex-direction:column;border-radius:4px;overflow:hidden;}
    .cbe-pop.open{display:flex;}
    .cbe-pop-head{background:#f1f3f6;border-bottom:1px solid #d8dee9;display:flex;justify-content:space-between;align-items:center;padding:7px 12px;font-weight:800;cursor:move;user-select:none;}
    .cbe-pop-head button{border:none;background:transparent;font-size:1rem;cursor:pointer;padding:2px 6px;}
    .cbe-pop-body{padding:10px 12px;overflow:auto;}
    .cbe-pop button.act{border:1px solid #c9d2e0;background:#fff;padding:5px 10px;cursor:pointer;font:inherit;font-weight:700;border-radius:3px;margin:0 3px 6px 0;}
    #cbeScratch textarea{width:340px;height:190px;border:1px solid #d8dee9;font:inherit;padding:8px;resize:both;}
    #cbeCalc{width:250px;}
    #cbeCalc .disp{width:100%;border:1px solid #374151;background:#1f2937;color:#fff;text-align:right;font-weight:800;padding:8px;font-size:1.05rem;margin-bottom:6px;border-radius:3px;}
    #cbeCalc .keys{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;}
    #cbeCalc .keys button{padding:8px 0;border:1px solid #9aa7b8;background:#fff;cursor:pointer;font:inherit;font-weight:700;border-radius:3px;}
    #cbeCalc .keys button:hover{background:#eef2f8;}
    #cbeHelp{width:min(680px,92vw);}
    #cbeHelp .tabs{display:flex;border-bottom:1px solid #d8dee9;margin-bottom:10px;}
    #cbeHelp .tabs button{border:none;background:transparent;padding:8px 14px;cursor:pointer;font:inherit;font-weight:800;color:#6B7280;border-bottom:3px solid transparent;}
    #cbeHelp .tabs button.on{color:#0D1B40;border-bottom-color:#C9922A;}
    #cbeHelp .helpbody{max-height:55vh;overflow:auto;line-height:1.65;font-size:.92rem;}
    #cbeNavPop{left:auto;right:14px;width:min(430px,92vw);}
    .cbe-navlist{max-height:56vh;overflow:auto;}
    .cbe-nav-sec{font-weight:800;background:#eef2f8;padding:6px 10px;color:#0D1B40;position:sticky;top:0;}
    .cbe-nav-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f3f6;}
    .cbe-nav-item:hover{background:#f8fafc;}
    .cbe-nav-item.cur{background:#dbeafe;}
    .cbe-st{font-weight:800;font-size:.78rem;}
    .cbe-st-unseen{color:#dc2626;}
    .cbe-st-incomplete{color:#d97706;}
    .cbe-st-complete{color:#16a34a;}
    .cbe-st-flag{color:#b91c1c;}
    .cbe-modal-mask{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:30000;display:none;align-items:center;justify-content:center;}
    .cbe-modal-mask.show{display:flex;}
    .cbe-modal{background:#fff;border:1px solid #9aa7b8;box-shadow:0 24px 70px rgba(15,23,42,.35);width:min(430px,92vw);border-radius:4px;overflow:hidden;}
    .cbe-modal-head{background:#0D1B40;color:#fff;padding:10px 16px;font-weight:800;display:flex;justify-content:space-between;align-items:center;}
    .cbe-modal-body{padding:16px;line-height:1.6;}
    .cbe-modal-foot{padding:0 16px 14px;display:flex;justify-content:flex-end;gap:10px;}
    .cbe-review{background:#fff;flex:1;overflow:auto;padding:20px 26px;}
    .cbe-review h2{font-family:'Playfair Display',serif;color:#0D1B40;margin:0 0 4px;}
    .cbe-rtable{width:100%;border-collapse:collapse;margin-top:12px;}
    .cbe-rtable th,.cbe-rtable td{border:1px solid #d8dee9;padding:7px 12px;text-align:left;}
    .cbe-rtable th{background:#f1f3f6;font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;color:#475569;}
    .cbe-rtable .sec td{background:#eef2f8;font-weight:800;color:#0D1B40;}
    .cbe-rbtns{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;flex-wrap:wrap;}
    .cbe-res-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
    .cbe-res-card{padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;}
    .cbe-res-ok{background:#ecfdf5 !important;border-color:#86efac !important;}
    .cbe-res-warn{background:#fef3c7 !important;border-color:#f3d18b !important;}
    .cbe-review-item{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-top:10px;background:#fff;}
    .vp-mock-card{display:block;border:1.5px solid #e5e7eb;border-radius:16px;padding:18px;background:#fff;margin-bottom:12px;}
    .vp-tag{display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:#0D1B40;font-size:.72rem;font-weight:800;margin:0 6px 6px 0;}
    @media(max-width:900px){.cbe-scen{width:100%;border-right:none;border-bottom:1px solid #d8dee9;max-height:42%;}.cbe-main{flex-direction:column;}}
    `;
    document.head.appendChild(st);
  }

  /* ---------------- overlay DOM ---------------- */
  if(!document.getElementById('cbeOverlay')){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div id="cbeOverlay" class="cbe-ov">
      <div class="cbe-header">
        <div class="cbe-examname"><span class="cbe-greendot"></span><span id="cbeTitle">Paper</span></div>
        <div class="cbe-headright">
          <span class="cbe-timer-warn" id="cbeTimerWarn">15 minutes left</span>
          <span class="cbe-timer" id="cbeTimer">00:00</span>
          <span id="cbeQof" style="font-weight:800;">Question 1 of 1</span>
        </div>
      </div>
      <div class="cbe-toolbar">
        <div class="cbe-tb-left">
          <button class="cbe-tb-btn" data-pop="scratch">🗒 Scratch Pad</button>
          <button class="cbe-tb-btn" data-pop="symbol">$ Symbol</button>
          <span class="cbe-hl-wrap">
            <button class="cbe-tb-btn" id="cbeHlBtn"><span class="cbe-swatch" id="cbeHlSwatch" style="background:yellow;"></span>Highlight ▾</button>
            <div class="cbe-menu" id="cbeHlMenu">
              <div class="row">
                <span class="cbe-swatch" data-hl="yellow" style="background:yellow;"></span>
                <span class="cbe-swatch" data-hl="lime" style="background:#7ee787;"></span>
                <span class="cbe-swatch" data-hl="pink" style="background:#f9a8d4;"></span>
                <span class="cbe-swatch" data-hl="cyan" style="background:#7dd3fc;"></span>
              </div>
              <button data-hl="remove">✕ Remove Highlight</button>
            </div>
          </span>
          <button class="cbe-tb-btn" data-pop="strike">🚫 Strikethrough</button>
          <button class="cbe-tb-btn" data-pop="calc">🧮 Calculator</button>
          <button class="cbe-tb-btn" data-pop="help">❓ Help</button>
        </div>
        <div class="cbe-tb-right">
          <button class="cbe-tb-btn" data-pop="close">🗙 Close All</button>
          <button class="cbe-tb-btn" data-pop="flag">🚩 Flag for Review</button>
        </div>
      </div>
      <div class="cbe-main" id="cbeMain"></div>
      <div class="cbe-footer" id="cbeFooter">
        <button class="cbe-fbtn" onclick="window.cbePrev()">← Previous</button>
        <button class="cbe-fbtn" onclick="window.cbeToggleNav()">▦ Navigator</button>
        <button class="cbe-fbtn cbe-fbtn-primary" onclick="window.cbeNext()">Next →</button>
      </div>

      <div class="cbe-pop" id="cbeScratch">
        <div class="cbe-pop-head"><span>Scratch Pad</span><button onclick="window.cbePop('scratch')">✕</button></div>
        <div class="cbe-pop-body">
          <div>
            <button class="act" data-sp="cut">✂ Cut</button><button class="act" data-sp="copy">📄 Copy</button><button class="act" data-sp="paste">📋 Paste</button><button class="act" data-sp="undo">↶ Undo</button><button class="act" data-sp="redo">↷ Redo</button><button class="act" data-sp="clear">🗑 Clear</button>
          </div>
          <textarea id="cbeScratchTa"></textarea>
        </div>
      </div>

      <div class="cbe-pop" id="cbeCalc">
        <div class="cbe-pop-head"><span>Calculator</span><button onclick="window.cbePop('calc')">✕</button></div>
        <div class="cbe-pop-body">
          <div class="disp"><input id="cbeCalcDisp" value="0" readonly style="width:100%;border:none;background:transparent;color:#fff;text-align:right;font:inherit;font-size:1.1rem;"></div>
          <div class="keys" id="cbeCalcKeys"></div>
        </div>
      </div>

      <div class="cbe-pop" id="cbeHelp">
        <div class="cbe-pop-head"><span>Help</span><button onclick="window.cbePop('help')">✕</button></div>
        <div class="cbe-pop-body">
          <div class="tabs">
            <button class="on" data-htab="inst">Exam Instructions</button>
            <button data-htab="cr">CR Question Help</button>
          </div>
          <div class="helpbody" id="cbeHelpBody"></div>
        </div>
      </div>

      <div class="cbe-pop" id="cbeNavPop">
        <div class="cbe-pop-head"><span>Navigator</span><button onclick="window.cbePop('nav')">✕</button></div>
        <div class="cbe-navlist" id="cbeNavList"></div>
      </div>
    </div>

    <div class="cbe-modal-mask" id="cbeMask">
      <div class="cbe-modal">
        <div class="cbe-modal-head"><span id="cbeModalTitle">Confirm</span><button onclick="window.cbeMask(0)" style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:1rem;">✕</button></div>
        <div class="cbe-modal-body" id="cbeModalBody"></div>
        <div class="cbe-modal-foot" id="cbeModalFoot"></div>
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
    answers: {}, review: {}, seen: {}, active: false, locked: false, armed: false,
    remaining: 0, endAt: 0, timer: null, startTime: 0, submitting: false,
    studentName: '', pendingPaper: '', navOpen: false, uiPrompt: false,
    hlColor: 'yellow', reviewMode: false, popOpen: null
  };
  const $ = id => document.getElementById(id);
  const listBox = () => $('mockListX') || $('paperList') || document.querySelector('.mocks-list');
  const getQs = pid => S.questions.filter(q => String(q.paperId) === String(pid)).sort((a, b) => (a.order || 0) - (b.order || 0));
  const curQ = () => S.qs[S.idx];

  /* ---------------- data / cards ---------------- */
  async function loadData(){
    const [pSnap, qSnap, aSnap] = await Promise.all([
      db().collection('mockPapers').orderBy('createdAt','desc').get().catch(() => ({docs: []})),
      db().collection('mockQuestions').orderBy('createdAt','asc').get().catch(() => ({docs: []})),
      S.user ? db().collection('mockAttempts').where('userId','==',S.user.uid).get().catch(() => ({docs: []})) : Promise.resolve({docs: []})
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
        ? `<button onclick="window.startMock('${p.id}')" style="border:none;border-radius:10px;padding:10px 18px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;">Start Mock</button>`
        : `<button disabled style="border:none;border-radius:10px;padding:10px 18px;font-weight:800;font:inherit;background:#eff6ff;color:#94a3b8;">${!qs.length ? 'No Questions Yet' : 'Attempts Exhausted'}</button>`}
    </div>`;
  }
  window.__loadMocksForCourse = function(subject){ S.activeSubject = subject || ''; S.papers.length ? renderCards() : loadData(); };

  /* ---------------- modal ---------------- */
  let modalOk = null;
  function ask({title, body, okText = 'OK', cancel = null, altText = null, onAlt = null, onOk}){
    $('cbeModalTitle').textContent = title;
    $('cbeModalBody').innerHTML = body;
    const foot = $('cbeModalFoot');
    foot.innerHTML = '';
    if(cancel){
      const c = document.createElement('button');
      c.className = 'cbe-fbtn'; c.textContent = cancel;
      c.onclick = () => window.cbeMask(0);
      foot.appendChild(c);
    }
    if(altText){
      const a = document.createElement('button');
      a.className = 'cbe-fbtn'; a.textContent = altText;
      a.onclick = () => { window.cbeMask(0); if(onAlt) onAlt(); };
      foot.appendChild(a);
    }
    const o = document.createElement('button');
    o.className = 'cbe-fbtn cbe-fbtn-primary'; o.textContent = okText;
    o.onclick = () => { window.cbeMask(0); if(onOk) onOk(); };
    foot.appendChild(o);
    modalOk = onOk;
    $('cbeMask').classList.add('show');
  }
  window.cbeMask = function(){ $('cbeMask').classList.remove('show'); };

  /* ---------------- lifecycle ---------------- */
  window.startMock = function(paperId){
    const p = S.papers.find(x => x.id === paperId);
    if(!p) return alert('Paper not found.');
    if(!getQs(paperId).length) return alert('No questions uploaded for this paper yet.');
    const used = S.attempts.filter(a => String(a.paperId) === String(paperId)).length;
    const max = Math.max(1, Number(p.attemptLimit || 1));
    if(used >= max) return alert(`You have already used all ${max} attempt(s) for this paper.`);
    S.pendingPaper = paperId;
    checkResume(paperId);
  };

  /* ---------------- resume / autosave ---------------- */
  const progressRef = paperId => db().collection('mockProgress').doc(`${S.user.uid}_${paperId}`);
  let persistTimer = null;
  function persist(){
    if(!S.active || S.submitting || !S.paper || !S.user) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      progressRef(S.paper.id).set({
        userId: S.user.uid, paperId: S.paper.id,
        answers: S.answers, review: S.review, seen: S.seen,
        idx: S.idx, remaining: S.remaining, studentName: S.studentName,
        savedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }, 1200);
  }
  async function checkResume(paperId){
    let snap = null;
    try{ snap = await progressRef(paperId).get(); }catch(e){}
    if(snap && snap.exists && Number(snap.data().remaining) > 0){
      const d = snap.data();
      ask({
        title: 'Resume Test?',
        body: `<p>You have an <strong>unfinished attempt</strong> on this paper.</p>
               <p style="color:#6B7280;">Time remaining: <strong style="color:#0D1B40;">${C.fmtTime(Number(d.remaining) || 0)}</strong> · Question ${(Number(d.idx) || 0) + 1} of ${getQs(paperId).length}</p>
               <p>Resume where you left off, or start a new attempt (your saved progress will be cleared)?</p>`,
        okText: 'Resume', altText: 'Start New',
        onOk: () => begin(paperId, d),
        onAlt: async () => { await progressRef(paperId).delete().catch(() => {}); askStartName(paperId); }
      });
      return;
    }
    askStartName(paperId);
  }
  function askStartName(paperId){
    ask({
      title: 'Start Test',
      body: `<label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Student Name</label>
             <input id="cbeNameInput" type="text" value="${esc(S.studentName || (S.user?.displayName || ''))}" placeholder="Enter your name" style="width:100%;padding:11px 13px;border:1px solid #d8dee9;border-radius:8px;font:inherit;">`,
      okText: 'Start Test',
      onOk: () => {
        const name = ($('cbeNameInput')?.value || '').trim();
        if(!name){ alert('Please enter your name.'); return; }
        S.studentName = name;
        begin(paperId, null);
      }
    });
    setTimeout(() => $('cbeNameInput')?.focus(), 50);
  }

  function begin(paperId, saved){
    const p = S.papers.find(x => x.id === paperId);
    S.paper = p;
    S.qs = getQs(paperId);
    if(saved){
      S.answers = saved.answers || {}; S.review = saved.review || {}; S.seen = saved.seen || {};
      S.idx = Math.max(0, Math.min(Number(saved.idx) || 0, S.qs.length - 1));
      S.remaining = Math.max(1, Number(saved.remaining) || 0);
      S.studentName = saved.studentName || S.studentName || '';
    }else{
      S.idx = 0; S.answers = {}; S.review = {}; S.seen = {};
      S.remaining = Number(p.timeLimit || 90) * 60;
    }
    S.active = true; S.reviewMode = false;
    S.startTime = Date.now(); S.submitting = false;
    $('cbeTitle').textContent = `${p.code || ''} - ${p.title || ''}`;
    $('cbeOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderQ();
    startTimer();
    persist();
  }

  window.closeMock = function(){
    ['cbeMask'].forEach(id => $(id).classList.remove('show'));
    closePops();
    $('cbeOverlay').classList.remove('open');
    document.body.style.overflow = '';
    clearInterval(S.timer);
    Object.assign(S, {active: false, submitting: false, qs: [], idx: 0, reviewMode: false});
    $('cbeTimerWarn').style.display = 'none';
    $('cbeTimer').classList.remove('warn', 'crit');
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
    if(left <= 900 && left > 300){ warn.style.display = 'inline-flex'; warn.textContent = '15 minutes left'; }
    else if(left <= 300 && left > 0){ warn.style.display = 'inline-flex'; warn.textContent = '5 minutes left'; }
    else warn.style.display = 'none';
    if(left % 10 === 0) persist();
    if(left <= 0){ clearInterval(S.timer); endExamConfirm(true); }
  }

  /* ---------------- statuses ---------------- */
  const hasAns = q => {
    const a = S.answers[q.id];
    if(C.isCR(q)) return q.type === 'word' ? String(a || '').replace(/<[^>]*>/g, '').trim() !== '' : Array.isArray(a) && a.some(r => Array.isArray(r) && r.some(v => String(v ?? '').trim() !== ''));
    if(a === null || a === undefined) return false;
    if(Array.isArray(a)) return a.length > 0 && a.some(v => String(v ?? '').trim() !== '');
    if(typeof a === 'object') return Object.keys(a).length > 0;
    return String(a) !== '';
  };
  function statusOf(q){
    if(S.review[q.id]) return ['Flagged', 'cbe-st-flag', '🚩'];
    if(!S.seen[q.id]) return ['Unseen', 'cbe-st-unseen', ''];
    if(hasAns(q)) return ['Complete', 'cbe-st-complete', ''];
    return ['Incomplete', 'cbe-st-incomplete', ''];
  }

  /* ---------------- main render ---------------- */
  let seenTimer = null;
  function renderQ(){
    if(!S.active) return;
    if(S.locked){
      $('cbeMain').innerHTML = `<div style="flex:1;display:flex;align-items:center;justify-content:center;"><div style="max-width:420px;border:1px solid #fecaca;background:#fff5f5;border-radius:14px;padding:26px;text-align:center;"><h3 style="margin:0 0 8px;color:#7f1d1d;">Exam Locked</h3><p>${esc(S.lockReason || 'Focus changed.')}</p><p>The attempt is frozen because the tab or window changed.</p><button class="cbe-fbtn cbe-fbtn-primary" data-pop="close">Submit Now</button></div></div>`;
      bindTb();
      return;
    }
    if(S.reviewMode){ renderReview(); return; }
    const q = curQ();
    if(!q){ $('cbeMain').innerHTML = '<div style="padding:20px;">No question found.</div>'; return; }
    const body = C.render(q, S.answers[q.id], {});
    $('cbeQof').textContent = `Question ${S.idx + 1} of ${S.qs.length}`;
    $('cbeMain').innerHTML = `
      <div class="cbe-scen">
        <div class="cbe-secband"><span>Section ${esc(q.section || '-')}</span><span>${C.marksOf(q)} marks</span></div>
        ${q.heading ? `<div style="font-weight:800;margin-bottom:10px;white-space:pre-wrap;">${esc(q.heading)}</div>` : ''}
        ${C.scenarioHtml(q)}
      </div>
      <div class="cbe-ans">
        <div class="cbe-secband"><span>Answer</span><span></span></div>
        <div data-cbe-answer="${q.id}">${C.answerHtml(q, S.answers[q.id], {})}</div>
      </div>`;
    C.wire($('cbeMain'), q, () => {
      S.answers[q.id] = C.capture(q, $('cbeMain'));
      S.seen[q.id] = true;
      persist();
      if(S.popOpen === 'nav') renderNavList();
    });
    bindTb();
    clearTimeout(seenTimer);
    if(!S.seen[q.id]) seenTimer = setTimeout(() => { S.seen[q.id] = true; if(S.popOpen === 'nav') renderNavList(); }, 1500);
  }
  function saveAns(){ const q = curQ(); if(q) S.answers[q.id] = C.capture(q, $('cbeMain')); persist(); }

  function guardNav(fn){
    const q = curQ();
    if(q && !S.seen[q.id]){
      ask({
        title: 'Unseen Content',
        body: `<p>⚠️ <strong>You have not yet viewed any on-screen exhibits before trying again.</strong></p><p>Please review the question content, then try again.</p>`,
        okText: 'OK',
        onOk: () => { S.seen[q.id] = true; fn(); }
      });
      return;
    }
    fn();
  }
  window.cbeGoto = i => { if(i < 0 || i >= S.qs.length) return; guardNav(() => { saveAns(); S.idx = i; S.reviewMode = false; closePops(); renderQ(); }); };
  window.cbeNext = () => { if(S.idx < S.qs.length - 1) guardNav(() => { saveAns(); S.idx++; renderQ(); }); };
  window.cbePrev = () => { if(S.idx > 0) guardNav(() => { saveAns(); S.idx--; renderQ(); }); };

  /* ---------------- toolbar ---------------- */
  function bindTb(){
    document.querySelectorAll('[data-pop]').forEach(b => { b.onclick = () => tbAction(b.dataset.pop); });
  }
  function closePops(){
    ['cbeScratch','cbeCalc','cbeHelp','cbeNavPop'].forEach(id => $(id).classList.remove('open'));
    $('cbeHlMenu').classList.remove('open');
    S.popOpen = null;
  }
  window.cbePop = function(name){
    const map = {scratch: 'cbeScratch', calc: 'cbeCalc', help: 'cbeHelp', nav: 'cbeNavPop'};
    const id = map[name];
    if(!id) return;
    const el = $(id);
    const wasOpen = el.classList.contains('open');
    closePops();
    if(!wasOpen){ el.classList.add('open'); S.popOpen = name; if(name === 'nav') renderNavList(); if(name === 'help') renderHelp('inst'); }
  };
  function tbAction(a){
    if(a === 'scratch' || a === 'calc' || a === 'help' || a === 'nav') return window.cbePop(a);
    if(a === 'symbol') return insertSymbol();
    if(a === 'strike') return applyFmt('strikeThrough');
    if(a === 'flag'){
      const q = curQ();
      if(q && !S.reviewMode){ S.review[q.id] = !S.review[q.id]; renderQ(); }
      return;
    }
    if(a === 'close') return endExamConfirm(false);
  }
  $('cbeHlBtn').addEventListener('click', e => { e.stopPropagation(); $('cbeHlMenu').classList.toggle('open'); });
  document.addEventListener('click', e => { if(!e.target.closest('.cbe-hl-wrap')) $('cbeHlMenu')?.classList.remove('open'); });
  $('cbeHlMenu').addEventListener('click', e => {
    const t = e.target.closest('[data-hl]');
    if(!t) return;
    if(t.dataset.hl === 'remove'){ applyFmt('removeHighlight'); }
    else { S.hlColor = t.dataset.hl; $('cbeHlSwatch').style.background = t.dataset.hl; applyFmt('hiliteColor', t.dataset.hl); }
    $('cbeHlMenu').classList.remove('open');
  });

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
    if(!sel || !sel.rangeCount || sel.isCollapsed){
      if(cmd === 'removeFormat' || cmd === 'hiliteColor'){
        const ae = document.activeElement;
        if(ae && ae.isContentEditable){ ae.focus(); if(cmd === 'removeFormat') document.execCommand('removeFormat'); else document.execCommand('hiliteColor', false, v || S.hlColor); return; }
      }
      ui(() => alert('Select some text first, then apply.'));
      return;
    }
    try{
      if(cmd === 'strikeThrough' || cmd === 'hiliteColor'){
        const span = document.createElement('span');
        if(cmd === 'strikeThrough') span.style.textDecoration = 'line-through';
        else span.style.background = v || S.hlColor;
        sel.getRangeAt(0).surroundContents(span);
        sel.removeAllRanges();
      } else document.execCommand(cmd, false, v || null);
    }catch(e){ try{ document.execCommand(cmd, false, v || null); }catch(_){} }
    const q = curQ();
    if(q) S.answers[q.id] = C.capture(q, $('cbeMain'));
  }

  /* scratch pad */
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
    const ta = $('cbeScratchTa');
    ta.focus();
    const act = b.dataset.sp;
    if(act === 'clear'){ ta.value = ''; return; }
    if(act === 'paste'){ navigator.clipboard?.readText?.().then(t => { ta.value += t; }).catch(() => alert('Use Ctrl+V to paste.')); return; }
    try{ document.execCommand(act); }catch(e){ if(act === 'copy'){ ta.select(); navigator.clipboard?.writeText(ta.value); } }
  });

  /* calculator */
  (function buildCalc(){
    const keys = ['C','⌫','(',')','^','sin','cos','tan','log','√','7','8','9','÷','π','4','5','6','×','x²','1','2','3','−','1/x','0','.','%','+','='];
    const box = $('cbeCalcKeys');
    keys.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = k;
      b.onclick = () => calcKey(k);
      box.appendChild(b);
    });
  })();
  function calcKey(k){
    const d = $('cbeCalcDisp');
    if(k === 'C'){ d.value = '0'; return; }
    if(k === '⌫'){ d.value = d.value.length > 1 ? d.value.slice(0, -1) : '0'; return; }
    if(k === '='){
      try{
        let expr = d.value.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**').replace(/π/g,'Math.PI');
        expr = expr.replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(').replace(/log\(/g,'Math.log10(');
        expr = expr.replace(/√\(/g,'Math.sqrt(');
        d.value = String(Function('"use strict";return(' + expr + ')')());
      }catch(e){ d.value = 'Error'; }
      return;
    }
    if(k === 'x²'){ d.value += '**2'; return; }
    if(k === '1/x'){ d.value = '1/(' + d.value + ')'; return; }
    d.value = (d.value === '0' || d.value === 'Error') ? k : d.value + k;
  }
  /* drag popups by header */
  document.querySelectorAll('.cbe-pop-head').forEach(head => {
    head.addEventListener('mousedown', e => {
      if(e.target.tagName === 'BUTTON') return;
      const pop = head.parentNode;
      const ox = e.clientX - pop.offsetLeft, oy = e.clientY - pop.offsetTop;
      const mv = ev => { pop.style.left = Math.max(0, ev.clientX - ox) + 'px'; pop.style.top = Math.max(44, ev.clientY - oy) + 'px'; pop.style.right = 'auto'; };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    });
  });

  /* help */
  const DEFAULT_INST = `
    <h3 style="color:#0D1B40;margin-bottom:8px;">Introduction</h3>
    <p>This exam reflects the style, difficulty and range of questions that could be asked in the live exam.</p>
    <ul style="margin:8px 0 8px 18px;">
      <li>You should use this exam to become familiar with the question types and the features and functionality contained within the live exam.</li>
      <li>There is no time limit in this mock — the live exam is timed.</li>
      <li>Navigate using the <strong>Next</strong> / <strong>Previous</strong> buttons or the <strong>Navigator</strong>.</li>
      <li>A warning message displays if you attempt to navigate from each question before viewing the on-screen exhibits.</li>
      <li>Some questions have a scenario/answer split. You can move the split to see more or less of the scenario.</li>
      <li>Click the <strong>Help</strong> button to access help and guidance.</li>
      <li>Important: you can revisit questions and change your answers during the exam.</li>
      <li>Formulae sheets/tax tables are available from your tutor if your exam requires them.</li>
    </ul>
    <h3 style="color:#0D1B40;margin:14px 0 8px;">Calculator</h3>
    <p>An on-screen calculator is available via the <strong>Calculator</strong> button. You may also use a physical calculator.</p>`;
  const CR_HELP = `
    <h3 style="color:#0D1B40;margin-bottom:8px;">Constructed Response (Word)</h3>
    <ul style="margin:8px 0 8px 18px;">
      <li>You are required to enter your answer into a word processing area.</li>
      <li>A numbered word processing tool bar is available for formatting your answer — headings, bold, italic, underline, tables, lists.</li>
      <li>The scenario relates to one or more requirement(s). Read all parts before answering.</li>
      <li>Constructed response questions are <strong>not auto-marked</strong> — they are sent to your tutor for marking against the marking guide, exactly like the live ACCA exam.</li>
    </ul>
    <h3 style="color:#0D1B40;margin:14px 0 8px;">Constructed Response (Spreadsheet)</h3>
    <ul style="margin:8px 0 8px 18px;">
      <li>Enter values and formulae in the grid provided (columns A–E).</li>
      <li>Use the Scratch Pad and Calculator for workings.</li>
      <li>Your workings are manually marked — show them clearly.</li>
    </ul>
    <h3 style="color:#0D1B40;margin:14px 0 8px;">Marking</h3>
    <p>At the end of this exam, objective test questions (OTs) and OT Cases are auto-marked and you can review correct answers with explanations. Constructed response questions are marked by your tutor and your final score is updated afterwards.</p>`;
  function renderHelp(tab){
    document.querySelectorAll('[data-htab]').forEach(b => b.classList.toggle('on', b.dataset.htab === tab));
    $('cbeHelpBody').innerHTML = tab === 'inst' ? (String(S.paper?.instructions || '').trim() || DEFAULT_INST) : CR_HELP;
  }
  document.querySelectorAll('[data-htab]').forEach(b => b.onclick = () => renderHelp(b.dataset.htab));

  /* navigator list */
  window.cbeToggleNav = () => window.cbePop('nav');
  function renderNavList(){
    const box = $('cbeNavList');
    let html = '', lastSec = null;
    S.qs.forEach((q, i) => {
      if(String(q.section) !== String(lastSec)){ lastSec = q.section; html += `<div class="cbe-nav-sec">Section ${esc(q.section || '-')}</div>`; }
      const [label, cls, icon] = statusOf(q);
      html += `<div class="cbe-nav-item ${i === S.idx ? 'cur' : ''}" data-goto="${i}"><span>Question ${i + 1}</span><span class="cbe-st ${cls}">${icon ? icon + ' ' : ''}${label}</span></div>`;
    });
    box.innerHTML = html;
    box.querySelectorAll('[data-goto]').forEach(el => el.onclick = () => window.cbeGoto(Number(el.dataset.goto)));
  }

  /* ---------------- review screen ---------------- */
  function endExamConfirm(auto){
    if(!S.active || S.submitting) return;
    saveAns();
    const unseen = S.qs.filter(q => !S.seen[q.id]).length;
    const incomplete = S.qs.filter(q => S.seen[q.id] && !hasAns(q)).length;
    if(auto){ return doSubmit(); }
    ask({
      title: 'End Exam',
      body: `<p>Are you sure you want to end the exam?</p>
             <p style="color:#6B7280;">${unseen} unseen · ${incomplete} incomplete · ${S.qs.filter(q => S.review[q.id]).length} flagged</p>
             <p style="color:#6B7280;">You will see the review screen before final submission.</p>`,
      okText: 'Yes',
      cancel: 'No',
      onOk: () => { S.reviewMode = true; renderReview(); }
    });
  }
  function renderReview(){
    closePops();
    $('cbeQof').textContent = 'Review';
    let rows = '', lastSec = null;
    S.qs.forEach((q, i) => {
      if(String(q.section) !== String(lastSec)){ lastSec = q.section; rows += `<tr class="sec"><td colspan="2">Section ${esc(q.section || '-')}</td></tr>`; }
      const [label, cls, icon] = statusOf(q);
      rows += `<tr><td style="cursor:pointer;" data-rgoto="${i}">Question ${i + 1}</td><td class="cbe-st ${cls}">${icon ? icon + ' ' : ''}${label}</td></tr>`;
    });
    $('cbeMain').innerHTML = `
    <div class="cbe-review">
      <h2>Item Review</h2>
      <p style="color:#6B7280;">Select a question to review it. You can change answers or the flag status of questions during review.</p>
      <table class="cbe-rtable"><thead><tr><th>Question</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="cbe-rbtns">
        <button class="cbe-fbtn" data-rv="flagged">🚩 Review Flagged</button>
        <button class="cbe-fbtn" data-rv="incomplete">Review Incomplete</button>
        <button class="cbe-fbtn" data-rv="all">Review All</button>
        <button class="cbe-fbtn cbe-fbtn-primary" data-rv="end">End Exam</button>
      </div>
    </div>`;
    $('cbeMain').querySelectorAll('[data-rgoto]').forEach(el => el.onclick = () => window.cbeGoto(Number(el.dataset.rgoto)));
    $('cbeMain').querySelectorAll('[data-rv]').forEach(el => el.onclick = () => {
      const v = el.dataset.rv;
      if(v === 'end'){
        ask({
          title: 'End Exam Confirmation',
          body: '<p>⚠️ Are you sure you want to end the exam?</p><p>Once ended you cannot revisit any questions.</p>',
          okText: 'Yes', cancel: 'No',
          onOk: doSubmit
        });
      } else if(v === 'all'){ S.reviewMode = false; S.idx = 0; renderQ(); }
      else {
        const find = v === 'flagged' ? S.qs.findIndex(q => S.review[q.id]) : S.qs.findIndex(q => S.seen[q.id] && !hasAns(q));
        if(find === -1){ alert(v === 'flagged' ? 'No flagged questions.' : 'No incomplete questions. 🎉'); return; }
        S.reviewMode = false; S.idx = find; renderQ();
      }
    });
  }

  /* ---------------- submit ---------------- */
  async function doSubmit(){
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
    try{
      await db().collection('mockAttempts').add({
        userId: S.user ? S.user.uid : '', userEmail: S.user ? S.user.email || '' : '', studentName: name,
        paperId: S.paper.id, paperCode: S.paper.code || '', paperTitle: S.paper.title || '',
        score, total, percentage: pct, answered, reviewedCount: Object.values(S.review).filter(Boolean).length,
        timeTakenSec, status: hasManual ? 'pending_marking' : 'auto_marked',
        autoScore: score, autoTotal: total, pendingManualMarking: hasManual,
        answers: S.answers, review: S.review,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }catch(err){
      console.error('Save failed:', err);
      alert('Could not save your attempt. Check your connection and press End Exam again.');
      S.submitting = false;
      return;
    }
    progressRef(S.paper.id).delete().catch(() => {});
    S.active = false;
    S.submitting = false;
    renderResult({ name, score, total, pct, answered, timeTakenSec, hasManual, detail });
    await loadData();
  }

  function renderResult(r){
    $('cbeQof').textContent = 'Results';
    closePops();
    const reviewRows = r.detail.map(({q, i, res}) => `
      <div class="cbe-review-item">
        <div style="font-weight:800;color:#0D1B40;margin-bottom:6px;">Q${i + 1} · ${C.marksOf(q)} marks ${res.manual ? '<span class="vp-tag" style="background:#fef3c7;">manual marking</span>' : `<span class="vp-tag" style="background:${res.fullyCorrect ? '#d1fae5' : '#fee2e2'};">${res.gained}/${res.marks} marks</span>`}</div>
        ${q.heading ? `<div style="white-space:pre-wrap;font-size:.95rem;margin-bottom:6px;">${esc(q.heading)}</div>` : ''}
        ${C.isCR(q)
          ? `<div style="font-size:.9rem;color:#6B7280;">Your constructed response was submitted and will be marked by the tutor against the marking guide. Solution material will be shared after marking.</div>`
          : `<div style="font-size:.9rem;line-height:1.6;"><div><strong>Your answer:</strong> ${esc(C.answerText(q, S.answers[q.id]))}</div>
             <div><strong>Correct answer:</strong> ${esc(C.correctText(q))}</div>
             ${q.explanation ? `<div style="margin-top:6px;padding:10px;background:#f8fafc;border-radius:8px;"><strong>Explanation:</strong> ${esc(q.explanation)}</div>` : ''}</div>`}
      </div>`).join('');
    $('cbeMain').innerHTML = `
    <div style="flex:1;overflow:auto;background:#f5f7fb;">
      <div style="width:min(1000px,100%);margin:0 auto;padding:22px;">
        <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 20px rgba(13,27,64,.08);">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h2 style="margin:0 0 6px;font-size:1.25rem;font-family:'Playfair Display',serif;color:#0D1B40;">${esc(S.paper.title || 'Exam Results')}</h2>
              <p style="margin:0;color:#6B7280;font-size:.92rem;">${esc(S.paper.code || '')} · ${esc(r.name)} · Completed attempt</p>
            </div>
            <button class="cbe-fbtn" onclick="window.closeMock()">Back to Dashboard</button>
          </div>
          <div class="cbe-res-grid">
            <div class="cbe-res-card cbe-res-ok"><h3 style="margin:0 0 6px;">Score (OT)</h3><div style="font-size:1.8rem;font-weight:900;">${r.score}/${r.total}</div></div>
            <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Percentage</h3><div style="font-size:1.8rem;font-weight:900;">${r.pct}%</div></div>
            <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Answered</h3><div style="font-size:1.8rem;font-weight:900;">${r.answered}/${S.qs.length}</div></div>
            <div class="cbe-res-card"><h3 style="margin:0 0 6px;">Time Taken</h3><div style="font-size:1.8rem;font-weight:900;">${C.fmtTime(r.timeTakenSec)}</div></div>
            ${r.hasManual ? `<div class="cbe-res-card cbe-res-warn" style="grid-column:1/-1;"><h3 style="margin:0 0 6px;">⏳ Manual Marking Pending</h3><div style="font-weight:600;font-size:.93rem;">Constructed-response answers are not auto-marked, exactly like the live ACCA exam. Your objective-test score is shown above; the tutor will add the constructed-response marks and your final score will update.</div></div>` : ''}
          </div>
        </div>
        <h3 style="font-family:'Playfair Display',serif;color:#0D1B40;margin:18px 0 4px;">Question Review</h3>
        ${reviewRows}
      </div>
    </div>`;
  }

  /* ---------------- autosave note: no lock — students can leave and resume ---------------- */

  firebase.auth().onAuthStateChanged(async user => { S.user = user || null; if(user) await loadData(); });
})();
