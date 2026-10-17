/* ============================================================
   Vinayak ProEdu — Admin console (v2)
   Depends on: cbe-core.js (window.CBE) + Firebase compat SDK.
   Renders into host divs you place in tests.html:
     #hostPapers   (paper CRUD + paper list)
     #hostAdmin    (question builder + question list)
     #hostAttempts (attempts + manual marking)
   ============================================================ */
(function () {
  'use strict';
  const C = window.CBE;
  if(!C) return console.error('cbe-core.js must load first');
  C.injectCss();
  const db = () => firebase.firestore();
  const esc = C.esc;
  const val = id => (document.getElementById(id)?.value || '').trim();
  const $ = id => document.getElementById(id);
  const lines = C.lines;

  const S = { user: null, isAdmin: false, papers: [], questions: [], attempts: [], editQId: null, editPId: null, hotspotTargets: [] };

  /* ---------------- auth gate ---------------- */
  firebase.auth().onAuthStateChanged(async user => {
    S.user = user || null;
    S.isAdmin = !!user && String(user.email || '').toLowerCase() === 'vinayakproedu@gmail.com';
    if(!S.isAdmin) return; // students don't use this console
    await refresh();
  });

  async function refresh(){
    const [p, q, a] = await Promise.all([
      db().collection('mockPapers').orderBy('createdAt', 'desc').get().catch(() => ({docs: []})),
      db().collection('mockQuestions').orderBy('createdAt', 'asc').get().catch(() => ({docs: []})),
      db().collection('mockAttempts').orderBy('createdAt', 'desc').get().catch(() => ({docs: []}))
    ]);
    S.papers = p.docs.map(d => ({id: d.id, ...d.data()}));
    S.questions = q.docs.map(d => ({id: d.id, ...d.data()}));
    S.attempts = a.docs.map(d => ({id: d.id, ...d.data()})).sort((x, y) => Number(y.createdAt?.seconds || 0) - Number(x.createdAt?.seconds || 0));
    renderPaperHost();
    renderAdminHost();
    renderAttemptsHost();
    const pc = $('paperCount'), qc = $('questionCount'), ac = $('attemptCount');
    if(pc) pc.textContent = S.papers.length;
    if(qc) qc.textContent = S.questions.length;
    if(ac) ac.textContent = S.attempts.length;
  }

  /* ============================================================
     1. PAPERS
     ============================================================ */
  const LEVELS = ['Applied Knowledge', 'Applied Skills', 'Strategic Professional'];
  const DEFAULT_SECTIONS = {
    'Applied Knowledge': ['Section A - Objective Test'],
    'Applied Skills': ['Section A - Objective Test', 'Section B - Objective Test Case', 'Section C - Constructed Response'],
    'Strategic Professional': ['Section A - Constructed Response', 'Section B - Constructed Response']
  };

  function renderPaperHost(){
    const host = $('hostPapers');
    if(!host) return;
    host.innerHTML = `
    <div class="panel" style="padding:18px;background:#fff;border:1px solid var(--border,#e5e7eb);border-radius:16px;margin-bottom:16px;">
      <h2 style="margin:0 0 4px;font-family:'Playfair Display',serif;color:#0D1B40;">Create / Edit Paper</h2>
      <p style="margin:0 0 14px;color:#6B7280;font-size:.9rem;">Papers follow the ACCA structure — pick the level and the section layout fills in automatically.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Paper Code</label>
          <input id="apCode" placeholder="FR, SBL, PM, AA…" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Paper Title</label>
          <input id="apTitle" placeholder="Financial Reporting" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Level</label>
          <select id="apLevel" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;">${LEVELS.map(l => `<option>${l}</option>`).join('')}</select></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Section Layout (auto from level)</label>
          <textarea id="apSections" rows="3" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;" placeholder="Leave blank for ACCA defaults"></textarea></div>
        <div style="grid-column:1 / -1;"><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Exam Instructions (shown to the student in Help → Exam Instructions)</label>
          <textarea id="apInstructions" rows="3" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;" placeholder="Leave blank for default ACCA-style instructions"></textarea></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Time Limit (minutes)</label>
          <input id="apTime" type="number" value="90" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Total Marks</label>
          <input id="apMarks" type="number" value="100" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Allowed Attempts</label>
          <input id="apAttempts" type="number" min="1" value="1" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
        <div style="display:flex;align-items:end;padding-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;font-weight:700;color:#0D1B40;font-size:.92rem;cursor:pointer;">
            <input id="apLocked" type="checkbox" style="width:auto;"> Lock paper for students
          </label>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;">
        <button class="btn btn-primary" id="apSave" style="border:none;border-radius:12px;padding:11px 18px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;">Save Paper</button>
        <button class="btn btn-ghost" id="apClear" style="border:none;border-radius:12px;padding:11px 18px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">Clear</button>
        <span id="apStatus" style="font-size:.85rem;color:#0f7a2a;font-weight:700;align-self:center;"></span>
      </div>
      <div id="apList" style="margin-top:16px;display:grid;gap:10px;"></div>
    </div>`;

    $('apSave').onclick = savePaper;
    $('apClear').onclick = clearPaper;
    $('apList').innerHTML = S.papers.map(p => {
      const n = S.questions.filter(q => String(q.paperId) === String(p.id)).length;
      const qm = S.questions.filter(q => String(q.paperId) === String(p.id)).reduce((a, q) => a + (Number(q.marks) || (q.type === 'sectionb' || q.type === 'case' ? 0 : 0)), 0);
      return `
      <div style="padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
          <div>
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:#0D1B40;font-size:.72rem;font-weight:800;">${esc(p.code || '')}${p.locked ? ' · Locked' : ''}</span>
            <strong style="color:#0D1B40;margin-left:6px;">${esc(p.title || '')}</strong>
            <div style="font-size:.83rem;color:#6B7280;margin-top:4px;">${esc(p.level || '')} · ${Number(p.timeLimit || 0)} min · ${Number(p.totalMarks || 0)} marks · ${n} question(s) · ${Math.max(1, Number(p.attemptLimit || 1))} attempt(s)</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" data-editp="${p.id}" style="border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">Edit</button>
            <button class="btn btn-danger" data-delp="${p.id}" style="border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-weight:800;font:inherit;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('') || '<div style="padding:14px;border:1px dashed #d9e2ef;border-radius:12px;color:#5d6e83;">No papers yet.</div>';

    host.querySelectorAll('[data-editp]').forEach(b => b.onclick = () => editPaper(b.dataset.editp));
    host.querySelectorAll('[data-delp]').forEach(b => b.onclick = () => delPaper(b.dataset.delp));
  }

  async function savePaper(){
    const code = val('apCode').toUpperCase(), title = val('apTitle'), level = val('apLevel');
    if(!code || !title) return $('apStatus').textContent = 'Paper code and title are required.';
    const sectionsTxt = val('apSections');
    const sections = sectionsTxt ? lines(sectionsTxt) : (DEFAULT_SECTIONS[level] || []);
    const payload = {
      code, title, level, sections,
      timeLimit: Number(val('apTime')) || 90,
      totalMarks: Number(val('apMarks')) || 100,
      attemptLimit: Math.max(1, Number(val('apAttempts')) || 1),
      locked: !!$('apLocked').checked,
      instructions: val('apInstructions'),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if(S.editPId){
      await db().collection('mockPapers').doc(S.editPId).set(payload, {merge: true});
      $('apStatus').textContent = 'Paper updated ✓';
    }else{
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db().collection('mockPapers').add(payload);
      $('apStatus').textContent = 'Paper saved ✓';
    }
    clearPaper();
    await refresh();
  }
  function clearPaper(){
    ['apCode','apTitle','apSections','apInstructions'].forEach(id => $(id).value = '');
    $('apTime').value = 90; $('apMarks').value = 100; $('apAttempts').value = 1; $('apLocked').checked = false;
    $('apLevel').value = 'Applied Skills';
    S.editPId = null;
    $('apSave').textContent = 'Save Paper';
    $('apStatus').textContent = '';
  }
  function editPaper(id){
    const p = S.papers.find(x => x.id === id);
    if(!p) return;
    S.editPId = id;
    $('apCode').value = p.code || ''; $('apTitle').value = p.title || ''; $('apLevel').value = p.level || 'Applied Skills';
    $('apTime').value = p.timeLimit || 90; $('apMarks').value = p.totalMarks || 100;
    $('apAttempts').value = p.attemptLimit || 1; $('apLocked').checked = !!p.locked;
    $('apSections').value = Array.isArray(p.sections) ? p.sections.join('\n') : '';
    $('apInstructions').value = p.instructions || '';
    $('apSave').textContent = 'Update Paper';
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  async function delPaper(id){
    if(!confirm('Delete this paper and ALL its questions?')) return;
    const snap = await db().collection('mockQuestions').where('paperId', '==', id).get();
    const batch = db().batch();
    snap.forEach(d => batch.delete(d.ref));
    batch.delete(db().collection('mockPapers').doc(id));
    await batch.commit();
    await refresh();
  }

  /* ============================================================
     2. QUESTION BUILDER
     ============================================================ */
  const typeOptions = () => {
    const groups = {};
    Object.entries(C.TYPES).forEach(([k, t]) => { (groups[t.group] = groups[t.group] || []).push([k, t]); });
    return Object.entries(groups).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`).join('')}</optgroup>`).join('');
  };
  const fld = (id, label, ph = '', type = 'text', valN = '') =>
    `<div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">${label}</label>
     <input id="${id}" type="${type}" value="${valN}" placeholder="${esc(ph)}" style="width:100%;padding:11px 13px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>`;
  const area = (id, label, ph = '', rows = 3) =>
    `<div style="margin-top:10px;"><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">${label}</label>
     <textarea id="${id}" rows="${rows}" placeholder="${esc(ph)}" style="width:100%;padding:11px 13px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></textarea></div>`;

  function renderAdminHost(){
    const host = $('hostAdmin');
    if(!host) return;
    host.innerHTML = `
    <div class="panel" style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;margin-bottom:16px;">
      <h2 style="margin:0 0 4px;font-family:'Playfair Display',serif;color:#0D1B40;">Add / Edit Question</h2>
      <p style="margin:0 0 14px;color:#6B7280;font-size:.9rem;">The form adapts to the ACCA question type you pick. Everything is validated before saving.</p>
      <div style="display:grid;grid-template-columns:1.4fr 1fr 90px;gap:12px;">
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Paper</label>
          <select id="qbPaper" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;">
            <option value="">Select paper…</option>${S.papers.map(p => `<option value="${p.id}">${esc(p.code || '')} - ${esc(p.title || '')}</option>`).join('')}
          </select></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Question Type</label>
          <select id="qbType" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;">${typeOptions()}</select></div>
        <div><label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Order</label>
          <input id="qbOrder" type="number" min="1" value="1" style="width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;"></div>
      </div>
      ${area('qbHeading', 'Requirement / Main Question (shown bold at the top, e.g. "(a) Explain… (4 marks)")')}
      ${area('qbScenario', 'Scenario / Question Text (line breaks preserved)')}
      ${area('qbExhibits', 'Exhibit Image URLs (one per line — tables, screenshots, exhibits)', 'https://…')}
      <div id="qbDynamic"></div>
      <div id="qbMarksWrap" style="margin-top:10px;max-width:160px;">${fld('qbMarks', 'Marks', 'e.g. 2', 'number', 2)}</div>
      ${area('qbExplanation', 'Explanation / Feedback (shown to the student after submission)')}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button id="qbSave" style="border:none;border-radius:12px;padding:11px 20px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;">Save Question</button>
        <button id="qbCancel" style="display:none;border:none;border-radius:12px;padding:11px 16px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">Cancel Edit</button>
        <button id="qbPreview" style="border:none;border-radius:12px;padding:11px 16px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">👁 Preview (student view)</button>
        <span id="qbStatus" style="font-size:.85rem;font-weight:700;align-self:center;"></span>
      </div>
      <div id="qbPreviewBox" style="display:none;margin-top:16px;"></div>
    </div>
    <div class="panel" style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;">
      <h2 style="margin:0 0 10px;font-family:'Playfair Display',serif;color:#0D1B40;">Existing Questions</h2>
      <div id="qbList" style="display:grid;gap:10px;"></div>
    </div>`;

    $('qbType').onchange = buildDynamic;
    $('qbPaper').onchange = buildDynamic;
    $('qbSave').onclick = saveQuestion;
    $('qbCancel').onclick = () => clearBuilder();
    $('qbPreview').onclick = previewQuestion;
    buildDynamic();
    renderQuestionList();
  }

  /* per-type dynamic fields */
  function buildDynamic(){
    const t = val('qbType');
    const d = $('qbDynamic');
    S.hotspotTargets = [];
    const needsOptions = ['mcq', 'multi', 'dropdown'].includes(t);
    let html = '';
    if(needsOptions){
      html += area('qbOptions', 'Options (one per line)', 'Option 1\nOption 2\nOption 3\nOption 4');
      if(t === 'mcq') html += fld('qbCorrect', 'Correct Option Index (0 = first line)', '1', 'number', '');
      if(t === 'multi') html += fld('qbCorrect', 'Correct Option Indices, comma separated', '0,2', 'text', '');
      if(t === 'dropdown') html += area('qbSentence', 'Sentence With Blank (use [blank] where the dropdown goes)', 'Revenue is recognised when [blank].', 2);
    }
    if(t === 'number'){
      html += fld('qbCorrect', 'Correct Answer', '660000');
      html += fld('qbAlts', 'Acceptable Alternatives (comma separated)', '660,000 | 660000.00');
    }
    if(t === 'fill'){
      html += area('qbSentence', 'Sentence With Blanks', 'Use {{1}}, {{2}} … or [blank] or ____', 2);
      html += area('qbAnswers', 'Answers (one per line, blank 1 first)', 'Paris\nEuro');
      html += area('qbAlts', 'Alternatives (one line per blank, comma separated — optional)', 'PARIS, France\nEUR', 2);
    }
    if(t === 'hotspot'){
      html += fld('qbHotspotImg', 'Hotspot Image URL', 'https://…');
      html += `<div id="qbHotspotPrev" style="margin-top:10px;"></div>`;
      html += `<div class="cbe-note">Paste the image URL, then click the preview to add target point(s). Students must click within ~25px of a target to score.</div>`;
    }
    if(t === 'dragmatch'){
      html += area('qbPairs', 'Pairs (one "item = match" per line)', 'Depreciation = Income statement\nClosing inventory = Statement of financial position');
    }
    if(t === 'case'){
      html += area('qbCaseIntro', 'Case Introduction (shared scenario for all sub-questions)');
      html += `<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <strong style="color:#0D1B40;">Sub-questions</strong>
        <button id="qbAddSub" style="border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">+ Add sub-question</button>
      </div>
      <div id="qbSubs" style="display:grid;gap:12px;margin-top:10px;"></div>
      <div class="cbe-note">Marks are the sum of sub-question marks (like real ACCA Section B: 3 × 2 marks).</div>`;
    }
    if(C.CR_TYPES.includes(t)){
      html += area('qbRubric', 'Marking Guide / Rubric (visible to the tutor while marking — REQUIRED for constructed response)', '1 mark for each valid point, max 4…', 3);
      html += area('qbModel', 'Model Answer / Solution (visible to the tutor while marking — optional)', 'The ideal answer or key points…', 3);
      html += `<div class="cbe-note" style="background:#fffbe6;border:1px solid #e5d9a0;border-radius:10px;padding:10px;">Constructed-response questions are <strong>never auto-marked</strong> — the student's whole attempt is sent to you for manual marking, exactly like the real ACCA CBE.</div>`;
    }
    d.innerHTML = html;
    $('qbMarksWrap').style.display = (t === 'case') ? 'none' : '';
    if(t === 'case') addSub();
    if(t === 'hotspot'){
      $('qbHotspotImg').addEventListener('input', drawHotspotPrev);
      drawHotspotPrev();
    }
    if(t === 'case') $('qbAddSub').onclick = addSub;
  }

  function addSub(data){
    const box = $('qbSubs');
    const i = box.children.length;
    const div = document.createElement('div');
    div.className = 'cbe-sub';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
        <strong style="color:#0D1B40;font-size:.9rem;">Sub-question ${i + 1}</strong>
        <button type="button" class="qb-del-sub" style="border:none;background:#fef2f2;color:#b91c1c;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:800;font:inherit;">Remove</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 130px 80px;gap:10px;">
        <select class="qb-sub-type" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;">
          ${C.SUB_TYPES.map(s => `<option value="${s}">${C.TYPES[s].label}</option>`).join('')}
        </select>
        <input class="qb-sub-marks" type="number" min="1" value="${data?.marks || 2}" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;" title="Marks">
        <span style="align-self:center;font-size:.8rem;color:#6B7280;">marks</span>
      </div>
      <textarea class="qb-sub-q" rows="2" placeholder="Sub-question text…" style="width:100%;margin-top:8px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;">${esc(data?.question || '')}</textarea>
      <textarea class="qb-sub-options" rows="3" placeholder="Options (one per line) — for MCQ / Multiple Response / Dropdown" style="width:100%;margin-top:6px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;display:none;">${esc((data?.options || []).join('\n'))}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px;">
        <input class="qb-sub-correct" placeholder="Correct: option index (or comma indices, or the number)" value="${esc(data ? String(Array.isArray(data.correct) ? data.correct.join(',') : data.correct) : '')}" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;">
        <input class="qb-sub-alts" placeholder="Alternatives (comma separated) — number/fill only" value="${esc((data?.alts || []).join(', '))}" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;">
      </div>`;
    box.appendChild(div);
    const typeSel = div.querySelector('.qb-sub-type');
    const optsTa = div.querySelector('.qb-sub-options');
    const sync = () => { optsTa.style.display = ['mcq', 'multi', 'dropdown'].includes(typeSel.value) ? '' : 'none'; };
    typeSel.onchange = sync;
    if(data?.type) typeSel.value = data.type;
    sync();
    div.querySelector('.qb-del-sub').onclick = () => {
      div.remove();
      [...box.children].forEach((c, j) => c.querySelector('strong').textContent = 'Sub-question ' + (j + 1));
    };
  }

  function drawHotspotPrev(){
    const url = val('qbHotspotImg');
    const box = $('qbHotspotPrev');
    if(!url){ box.innerHTML = ''; return; }
    box.innerHTML = `<div class="cbe-hotspot-wrap" id="qbHotspotWrap"><img src="${esc(url)}" alt="Preview">${S.hotspotTargets.map(t => `<span class="cbe-dot" data-x="${t.x}" data-y="${t.y}" style="left:${t.x}px;top:${t.y}px;"></span>`).join('')}</div>`;
    const wrap = $('qbHotspotWrap'), img = wrap.querySelector('img');
    wrap.addEventListener('click', e => {
      const r = img.getBoundingClientRect();
      const x = Math.round(e.clientX - r.left), y = Math.round(e.clientY - r.top);
      const dots = [...wrap.querySelectorAll('.cbe-dot')];
      const hit = dots.find(d => Math.abs(Number(d.dataset.x) - x) <= 12 && Math.abs(Number(d.dataset.y) - y) <= 12);
      if(hit){
        S.hotspotTargets = S.hotspotTargets.filter(t => !(Math.abs(t.x - Number(hit.dataset.x)) <= 1 && Math.abs(t.y - Number(hit.dataset.y)) <= 1));
        hit.remove();
      }else{
        S.hotspotTargets.push({x, y, r: 25});
        wrap.insertAdjacentHTML('beforeend', `<span class="cbe-dot" data-x="${x}" data-y="${y}" style="left:${x}px;top:${y}px;"></span>`);
      }
    });
  }

  /* collect builder → canonical question */
  function collect(){
    const t = val('qbType');
    const q = {
      type: t,
      section: C.TYPES[t].sec,
      order: Number(val('qbOrder')) || 1,
      heading: val('qbHeading'),
      scenario: val('qbScenario'),
      exhibits: lines(val('qbExhibits')),
      marks: t === 'case' ? 0 : (Number(val('qbMarks')) || 0),
      explanation: val('qbExplanation')
    };
    if(['mcq', 'multi', 'dropdown'].includes(t)){
      q.options = lines(val('qbOptions'));
      if(t === 'multi') q.correct = val('qbCorrect').split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      else q.correct = Number(val('qbCorrect'));
      if(t === 'dropdown') q.sentence = val('qbSentence');
    }
    if(t === 'number'){ q.correct = val('qbCorrect'); q.alts = val('qbAlts').split(/[,|]/).map(s => s.trim()).filter(Boolean); }
    if(t === 'fill'){
      q.sentence = val('qbSentence');
      const answers = lines(val('qbAnswers'));
      const altLines = String($('qbAlts')?.value || '').split('\n').map(s => s.trim());
      q.blanks = answers.map((a, i) => ({ answer: a, alts: (altLines[i] || '').split(/[,|]/).map(s => s.trim()).filter(Boolean) }));
    }
    if(t === 'hotspot'){ q.hotspotImage = val('qbHotspotImg'); q.targets = S.hotspotTargets.map(t2 => ({...t2})); }
    if(t === 'dragmatch'){ q.pairs = lines(val('qbPairs')).map(l => { const [drag, drop] = l.split('=').map(s => (s || '').trim()); return {drag, drop}; }); }
    if(t === 'case'){
      q.caseIntro = val('qbCaseIntro');
      q.subqs = [...$('qbSubs').children].map((div, i) => {
        const type = div.querySelector('.qb-sub-type').value;
        const sub = { id: 'sub' + i, type, question: div.querySelector('.qb-sub-q').value.trim(), marks: Number(div.querySelector('.qb-sub-marks').value) || 1 };
        const opts = lines(div.querySelector('.qb-sub-options').value);
        const corrRaw = div.querySelector('.qb-sub-correct').value.trim();
        const alts = div.querySelector('.qb-sub-alts').value.split(/[,|]/).map(s => s.trim()).filter(Boolean);
        if(type === 'mcq' || type === 'dropdown'){ sub.options = opts; sub.correct = Number(corrRaw); }
        if(type === 'multi'){ sub.options = opts; sub.correct = corrRaw.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)); }
        if(type === 'number'){ sub.correct = corrRaw; sub.alts = alts; }
        if(type === 'fill'){ sub.blanks = [{ answer: corrRaw, alts }]; }
        return sub;
      });
    }
    if(C.CR_TYPES.includes(t)){ q.rubric = val('qbRubric'); q.modelAnswer = val('qbModel'); }
    return q;
  }

  function validateBuilder(q){
    if(!val('qbPaper')) return 'Select a paper.';
    const norm = C.normalize(q);
    const err = C.validate(norm);
    if(err) return err;
    if(!C.isCR(norm) && norm.type !== 'case' && C.marksOf(norm) <= 0) return 'Enter the marks for this question.';
    return '';
  }

  async function saveQuestion(){
    const q = collect();
    const err = validateBuilder(q);
    const status = $('qbStatus');
    if(err){ status.style.color = '#b42318'; status.textContent = err; return; }
    const paper = S.papers.find(p => p.id === val('qbPaper'));
    const payload = { ...q, paperId: paper.id, paperCode: paper.code || '', paperTitle: paper.title || '', updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    // keep back-compat fields the old engine relied on
    payload.mainQuestion = q.heading;
    payload.question = q.scenario || q.sentence || q.caseIntro || '';
    if(q.exhibits.length) payload.imageUrl = q.exhibits[0];
    if(S.editQId){
      await db().collection('mockQuestions').doc(S.editQId).set(payload, {merge: true});
      status.style.color = '#0f7a2a'; status.textContent = 'Question updated ✓';
    }else{
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db().collection('mockQuestions').add(payload);
      status.style.color = '#0f7a2a'; status.textContent = 'Question saved ✓';
    }
    clearBuilder();
    await refresh();
  }

  function clearBuilder(){
    S.editQId = null;
    ['qbHeading','qbScenario','qbExhibits','qbExplanation','qbOptions','qbCorrect','qbAlts','qbSentence','qbAnswers','qbPairs','qbCaseIntro','qbRubric','qbModel','qbHotspotImg'].forEach(id => { if($(id)) $(id).value = ''; });
    $('qbOrder').value = 1; $('qbMarks').value = 2;
    $('qbSave').textContent = 'Save Question';
    $('qbCancel').style.display = 'none';
    $('qbPreviewBox').style.display = 'none';
    $('qbStatus').textContent = '';
    S.hotspotTargets = [];
    buildDynamic();
  }

  function previewQuestion(){
    const q = collect();
    const err = validateBuilder(q);
    const box = $('qbPreviewBox');
    box.style.display = 'block';
    if(err){ box.innerHTML = `<div style="padding:14px;border:1px solid #fecaca;background:#fff5f5;border-radius:12px;color:#b42318;font-weight:700;">⚠ ${esc(err)}</div>`; return; }
    const norm = C.normalize(q);
    box.innerHTML = `<div style="padding:12px;border:1px solid #dbe4f0;border-radius:14px;background:#f8fafc;"><div style="font-size:.78rem;font-weight:800;color:#0D1B40;margin-bottom:8px;">PREVIEW — this is exactly what the student sees</div>${C.render(norm, undefined, {showRubric: true})}</div>`;
    C.wire(box, norm, () => {});
    box.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  function renderQuestionList(){
    const host = $('qbList');
    if(!host) return;
    if(!S.questions.length){ host.innerHTML = '<div style="padding:14px;border:1px dashed #d9e2ef;border-radius:12px;color:#5d6e83;">No questions yet.</div>'; return; }
    const groups = {};
    S.questions.forEach(q => { const k = `${q.paperCode || '??'} — ${q.paperTitle || 'Paper'}`; (groups[k] = groups[k] || []).push(q); });
    host.innerHTML = Object.entries(groups).map(([name, qs]) => {
      const total = qs.reduce((a, q) => {
        if(q.type === 'case' && Array.isArray(q.subqs)) return a + q.subqs.reduce((x, s) => x + Number(s.marks || 0), 0);
        if(q.type === 'sectionb') return a + Number(q.marks || 0);
        return a + Number(q.marks || 0);
      }, 0);
      return `
      <details open style="border:1px solid #e5e7eb;border-radius:14px;background:#fff;overflow:hidden;">
        <summary style="cursor:pointer;padding:13px 16px;font-weight:900;color:#0D1B40;display:flex;justify-content:space-between;gap:10px;background:linear-gradient(180deg,#fff,#f8fbff);">🏷 ${esc(name)} <span style="font-weight:600;color:#6B7280;font-size:.83rem;">${qs.length} question(s)</span></summary>
        <div style="padding:12px;display:grid;gap:8px;">
          ${qs.map((q, i) => `
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fbfdff;position:relative;">
            <span style="display:inline-block;padding:3px 9px;border-radius:999px;background:#eef4ff;color:#0D1B40;font-size:.7rem;font-weight:800;">#${i + 1} · Sec ${esc(q.section || '-')}</span>
            <span style="display:inline-block;padding:3px 9px;border-radius:999px;background:#f1f5f9;color:#334155;font-size:.7rem;font-weight:800;">${esc(q.type)}</span>
            <div style="font-size:.92rem;margin-top:6px;color:#111827;">${esc(q.mainQuestion || q.question || q.heading || '(no text)')}</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button data-editq="${q.id}" style="border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:800;font:inherit;background:#eff6ff;color:#0D1B40;border:1px solid #dbe4f0;">Edit</button>
              <button data-delq="${q.id}" style="border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:800;font:inherit;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;">Delete</button>
            </div>
          </div>`).join('')}
        </div>
      </details>`;
    }).join('');
    host.querySelectorAll('[data-editq]').forEach(b => b.onclick = () => editQuestion(b.dataset.editq));
    host.querySelectorAll('[data-delq]').forEach(b => b.onclick = async () => {
      if(!confirm('Delete this question?')) return;
      await db().collection('mockQuestions').doc(b.dataset.delq).delete();
      if(S.editQId === b.dataset.delq) clearBuilder();
      await refresh();
    });
  }

  function editQuestion(id){
    const raw = S.questions.find(x => x.id === id);
    if(!raw) return;
    const q = C.normalize({...raw});
    S.editQId = id;
    $('qbPaper').value = q.paperIdString || raw.paperId || '';
    $('qbType').value = q.type;
    $('qbOrder').value = q.order || 1;
    $('qbHeading').value = q.heading;
    $('qbScenario').value = q.type === 'fill' || q.type === 'dropdown' ? '' : q.scenario;
    $('qbExhibits').value = q.exhibits.join('\n');
    $('qbMarks').value = q.marks || 2;
    $('qbExplanation').value = q.explanation;
    buildDynamic();
    if(['mcq', 'multi', 'dropdown'].includes(q.type)){
      $('qbOptions').value = q.options.join('\n');
      $('qbCorrect').value = Array.isArray(q.correct) ? q.correct.join(',') : String(q.correct ?? '');
      if(q.type === 'dropdown') $('qbSentence').value = q.sentence;
    }
    if(q.type === 'number'){ $('qbCorrect').value = q.correct; $('qbAlts').value = q.alts.join(', '); }
    if(q.type === 'fill'){
      $('qbSentence').value = q.sentence;
      $('qbAnswers').value = q.blanks.map(b => b.answer).join('\n');
      $('qbAlts').value = q.blanks.map(b => b.alts.join(', ')).join('\n');
    }
    if(q.type === 'hotspot'){ S.hotspotTargets = q.targets.map(t => ({...t})); $('qbHotspotImg').value = q.hotspotImage; drawHotspotPrev(); }
    if(q.type === 'dragmatch'){ $('qbPairs').value = q.pairs.map(p => `${p.drag} = ${p.drop}`).join('\n'); }
    if(q.type === 'case'){
      $('qbCaseIntro').value = q.caseIntro;
      $('qbSubs').innerHTML = '';
      q.subqs.forEach(s => addSub(s));
      if(!q.subqs.length) addSub();
    }
    if(C.CR_TYPES.includes(q.type)){ $('qbRubric').value = q.rubric; if($('qbModel')) $('qbModel').value = q.modelAnswer || ''; }
    $('qbSave').textContent = 'Update Question';
    $('qbCancel').style.display = '';
    $('qbStatus').textContent = '';
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  /* ============================================================
     3. ATTEMPTS + MANUAL MARKING
     ============================================================ */
  function renderAttemptsHost(){
    const host = $('hostAttempts');
    if(!host) return;
    host.innerHTML = `<div id="atList" style="display:grid;gap:10px;"></div><div id="atMarkModal" style="display:none;position:fixed;inset:0;z-index:30000;background:rgba(15,23,42,.62);backdrop-filter:blur(5px);overflow:auto;padding:24px;"><div style="max-width:860px;margin:0 auto;background:#f5f7fb;border-radius:18px;border:1px solid #e5e7eb;"><div id="atMarkBody"></div></div></div>`;
    const list = $('atList');
    if(!S.attempts.length){ list.innerHTML = '<div style="padding:14px;border:1px dashed #d9e2ef;border-radius:12px;color:#5d6e83;">No attempts yet.</div>'; return; }
    list.innerHTML = S.attempts.map(a => {
      const status = a.status === 'pending_marking' ? '<span style="background:#fef3c7;color:#92400e;">⏳ awaiting manual marking</span>'
        : a.status === 'marked' ? '<span style="background:#d1fae5;color:#166534;">✓ manually marked</span>'
        : '<span style="background:#eef4ff;color:#0D1B40;">auto-marked</span>';
      const when = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : '';
      return `
      <div style="padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
          <div>
            <strong style="color:#0D1B40;">${esc(a.studentName || a.userEmail || 'Student')}</strong>
            <div style="font-size:.85rem;color:#6B7280;margin-top:2px;">${esc(a.paperCode || '')} ${esc(a.paperTitle || '')} · ${when}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span style="padding:6px 10px;border-radius:999px;font-size:.75rem;font-weight:800;">Score ${Number(a.score || 0)}/${Number(a.total || 0)} · ${Number(a.percentage || 0)}%</span>
            <span style="padding:6px 10px;border-radius:999px;font-size:.75rem;font-weight:800;">${status}</span>
            ${a.status === 'pending_marking' ? `<button data-mark="${a.id}" style="border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;">✍️ Mark Constructed Responses</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-mark]').forEach(b => b.onclick = () => openMarking(b.dataset.mark));
  }

  let markingId = null;
  function openMarking(id){
    const a = S.attempts.find(x => x.id === id);
    if(!a) return;
    markingId = id;
    const qs = S.questions.filter(q => String(q.paperId) === String(a.paperId)).map(d => C.normalize({id: d.id, ...d})).filter(C.isCR);
    const body = $('atMarkBody');
    const head = `
    <div style="background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:18px 18px 0 0;position:sticky;top:0;">
      <div><div style="font-size:.7rem;letter-spacing:1.4px;text-transform:uppercase;opacity:.75;">Manual Marking</div>
      <strong>${esc(a.paperCode || '')} ${esc(a.paperTitle || '')} — ${esc(a.studentName || '')}</strong></div>
      <button onclick="document.getElementById('atMarkModal').style.display='none'" style="border:none;border-radius:10px;padding:9px 16px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;">Close</button>
    </div>`;
    if(!qs.length){
      body.innerHTML = head + `<div style="padding:20px;"><div style="padding:14px;border:1px dashed #d9e2ef;border-radius:12px;color:#5d6e83;">No constructed-response questions in this paper.</div></div>`;
      $('atMarkModal').style.display = 'block';
      return;
    }
    body.innerHTML = head + `
    <div style="padding:16px 20px;display:grid;gap:14px;">
      <div style="padding:12px;border-radius:12px;background:#fffbe6;border:1px solid #e5d9a0;font-size:.9rem;">Auto-marked objective-test score so far: <strong>${Number(a.autoScore ?? a.score ?? 0)}</strong>. Award marks for each constructed response below, then Save & Finalise.</div>
      ${qs.map((q, i) => {
        const given = a.answers ? (C.decAnswers ? C.decAnswers(a.answers)[q.id] : a.answers[q.id]) : null;
        const pre = a.manualScores && a.manualScores[q.id] != null ? a.manualScores[q.id] : '';
        return `
        <div style="padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
          <div style="font-weight:900;color:#0D1B40;margin-bottom:8px;">Q${i + 1} · ${q.type === 'sheet' ? 'Spreadsheet' : 'Word'} · max ${Number(q.marks || 0)} marks</div>
          ${q.heading ? `<div style="white-space:pre-wrap;font-size:.95rem;margin-bottom:8px;"><strong>Requirement:</strong> ${esc(q.heading)}</div>` : ''}
          ${q.rubric ? `<div style="padding:10px;border-radius:10px;background:#fffbe6;border:1px solid #e5d9a0;font-size:.9rem;margin-bottom:10px;"><strong>Marking guide:</strong> ${esc(q.rubric)}</div>` : ''}
          ${q.modelAnswer ? `<div style="padding:10px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:.9rem;margin-bottom:10px;white-space:pre-wrap;"><strong>Model answer:</strong> ${esc(q.modelAnswer)}</div>` : ''}
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f8fafc;max-height:320px;overflow:auto;margin-bottom:10px;">${C.render(q, given, {readonly: true})}</div>
          <label style="display:block;font-size:.76rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">Awarded marks (max ${Number(q.marks || 0)})</label>
          <input data-marks-for="${q.id}" type="number" min="0" max="${Number(q.marks || 0)}" step="0.5" value="${pre}" style="width:140px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;font:inherit;">
        </div>`;
      }).join('')}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <span id="atMarkStatus" style="font-size:.85rem;color:#6B7280;"></span>
        <button id="atMarkSave" style="border:none;border-radius:12px;padding:11px 20px;cursor:pointer;font-weight:800;font:inherit;background:linear-gradient(135deg,#C9922A,#E8AA48);color:#111;">💾 Save Marks & Finalise</button>
      </div>
    </div>`;
    $('atMarkModal').style.display = 'block';
    $('atMarkSave').onclick = () => saveMarking(a, qs);
  }

  async function saveMarking(a, qs){
    const manualScores = {};
    let manualSum = 0;
    document.querySelectorAll('[data-marks-for]').forEach(inp => {
      const q = qs.find(x => x.id === inp.dataset.marksFor);
      if(!q) return;
      let v = Number(inp.value);
      if(Number.isNaN(v) || v < 0) v = 0;
      if(v > Number(q.marks || 0)) v = Number(q.marks || 0);
      manualScores[q.id] = v;
      manualSum += v;
    });
    const auto = Number(a.autoScore ?? a.score ?? 0);
    const total = Number(a.total || 0);
    const finalScore = Math.round((auto + manualSum) * 100) / 100;
    const pct = total ? Math.round(finalScore / total * 100) : 0;
    await db().collection('mockAttempts').doc(markingId).update({
      manualScores, manualScore: manualSum,
      score: finalScore, percentage: pct,
      status: 'marked', markedAt: firebase.firestore.FieldValue.serverTimestamp(),
      markedBy: S.user ? S.user.email : 'admin'
    });
    $('atMarkModal').style.display = 'none';
    await refresh();
    alert(`Finalised: ${finalScore}/${total} (${pct}%).`);
  }
})();
