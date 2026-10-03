(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const db = () => firebase.firestore();
  const currentUser = () => firebase.auth().currentUser;
  const esc = v => String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const overlay = $('testOverlay');
  const els = {
    title: $('overlayTitle'),
    progress: $('overlayProgress'),
    bar: $('progressBar'),
    area: $('questionArea'),
    feedback: $('questionFeedback'),
    timer: $('testTimer'),
    prev: $('prevBtn'),
    next: $('nextBtn'),
    submit: $('submitBtn'),
    close: $('closeTestOverlayBtn')
  };

  let S = {
    test: null,
    questions: [],
    index: 0,
    score: 0,
    responses: [],
    startTime: null,
    timeTaken: 0,
    timerId: null,
    choice: null,
    multi: [],
    dropdown: '',
    fill: '',
    manual: '',
    hotspotText: '',
    hotspotClick: null,
    dragMap: {},
    submitted: false,
    finished: false
  };

  function resetAnswers(){
    S.choice = null;
    S.multi = [];
    S.dropdown = '';
    S.fill = '';
    S.manual = '';
    S.hotspotText = '';
    S.hotspotClick = null;
    S.dragMap = {};
    S.submitted = false;
  }

  function currentQ(){ return S.questions[S.index] || null; }

  function compareSingle(q, idx){
    if(typeof q.correct === 'number') return Number(idx) === Number(q.correct);
    const opt = q.options?.[idx];
    return String(opt||'').trim().toLowerCase() === String(q.correct||'').trim().toLowerCase();
  }

  function normMulti(c){
    if(Array.isArray(c)) return c.map(Number).filter(v=>!isNaN(v)).sort((a,b)=>a-b);
    if(typeof c === 'string') return c.split(',').map(v=>Number(v.trim())).filter(v=>!isNaN(v)).sort((a,b)=>a-b);
    return [];
  }

  function correctLabels(q){
    const o = q.options || [];
    if(Array.isArray(q.correct)) return q.correct.map(i=>o[i]).filter(Boolean);
    if(typeof q.correct === 'number') return [o[q.correct]].filter(Boolean);
    if(typeof q.correct === 'string') return [q.correct];
    return [];
  }

  function setProgress(){
    const total = S.questions.length || 1;
    const cur = Math.min(S.index + 1, total);
    if(els.progress) els.progress.textContent = `Q ${cur} / ${total}`;
    if(els.bar) els.bar.style.width = `${(cur/total)*100}%`;
  }

  function clearFeedback(){
    if(!els.feedback) return;
    els.feedback.classList.add('hidden');
    els.feedback.className = 'feedback hidden';
    els.feedback.innerHTML = '';
  }

  function setFeedback(html, kind){
    if(!els.feedback) return;
    els.feedback.classList.remove('hidden');
    els.feedback.innerHTML = html;
    els.feedback.className = 'feedback ' + (kind==='correct' ? 'correct' : kind==='wrong' ? 'wrong' : '');
  }

  function setActionState(){
    if(!els.prev || !els.next || !els.submit) return;
    if(S.finished){
      els.prev.style.display = 'none';
      els.next.textContent = 'Close';
      els.next.style.display = 'inline-flex';
      els.submit.style.display = 'none';
      return;
    }
    els.prev.style.display = S.index <= 0 ? 'none' : 'inline-flex';
    if(S.submitted){
      const last = S.index >= S.questions.length - 1;
      els.next.textContent = last ? 'Finish' : 'Next →';
      els.next.style.display = 'inline-flex';
      els.submit.style.display = 'none';
    } else {
      els.next.style.display = 'none';
      els.submit.style.display = 'inline-flex';
    }
  }

  function toggleInteract(enable){
    const card = $('questionCard');
    if(!card) return;
    card.querySelectorAll('input, select, textarea, button.option-btn').forEach(n => {
      if(['prevBtn','nextBtn','submitBtn','closeTestOverlayBtn'].includes(n.id)) return;
      n.disabled = !enable;
    });
  }

  function startTimer(){
    clearInterval(S.timerId);
    S.startTime = Date.now();
    S.timerId = setInterval(() => {
      if(!els.timer) return;
      const diff = Math.floor((Date.now() - S.startTime) / 1000);
      const m = Math.floor(diff / 60), s = diff % 60;
      els.timer.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
    }, 1000);
  }

  /* ===================== RENDER QUESTION ===================== */
  function renderQuestion(){
    const q = currentQ();
    if(!q){ if(els.area) els.area.innerHTML = ''; return; }

    S.submitted = false;
    clearFeedback();
    setActionState();
    toggleInteract(true);
    setProgress();

    const type = String(q.type || 'mcq').toLowerCase();
    let html = `<div class="question-card" id="questionCard">
      <div class="question-meta">
        <div>
          <h3 class="question-title">Question ${S.index + 1}</h3>
          <div class="question-sub">${esc(S.test.title || '')}${S.test.subject ? ' · ' + esc(S.test.subject) : ''}</div>
        </div>
        <div class="question-sub">${esc(type)} · ${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''}</div>
      </div>
      <p style="font-size:1.05rem;line-height:1.7;margin-bottom:16px;">${esc(q.question || q.q || '')}</p>`;

    if(type === 'mcq'){
      html += `<div>${(q.options || []).map((opt, i) =>
        `<button type="button" class="option-btn ${S.choice === i ? 'selected' : ''}" onclick="window.__pickSingle(${i})">${esc(opt)}</button>`
      ).join('')}</div>`;
    }
    else if(type === 'dropdown'){
      html += `<select class="dropdown-select" onchange="window.__setDropdown(this.value)">
        <option value="">— Choose an option —</option>
        ${(q.options || []).map((opt, i) =>
          `<option value="${i}" ${String(S.dropdown) === String(i) ? 'selected' : ''}>${esc(opt)}</option>`
        ).join('')}
      </select>`;
    }
    else if(type === 'multi'){
      html += `<div>${(q.options || []).map((opt, i) =>
        `<label style="display:block;margin:10px 0;padding:12px 14px;border-radius:10px;border:1.5px solid #e5e7eb;cursor:pointer;">
          <input type="checkbox" class="multi-check" value="${i}" ${S.multi.includes(i) ? 'checked' : ''} onchange="window.__syncMulti()" style="margin-right:10px;">${esc(opt)}
        </label>`
      ).join('')}</div>`;
    }
    else if(type === 'fill'){
      html += `<input type="text" class="fill-input" placeholder="Type your answer" value="${esc(S.fill)}" oninput="window.__stateFill(this.value)">`;
    }
    else if(type === 'drag'){
      const pairs = Array.isArray(q.pairs) ? q.pairs : [];
      html += `<div class="drag-wrap">
        <div class="drag-box">
          <strong style="color:#0D1B40;display:block;margin-bottom:8px;">Drag items</strong>
          <div>${pairs.map(p => `<div class="drag-item" draggable="true" data-drag="${esc(p.drag)}">${esc(p.drag)}</div>`).join('')}</div>
        </div>
        <div class="drop-box">
          <strong style="color:#0D1B40;display:block;margin-bottom:8px;">Drop targets</strong>
          <div>${pairs.map(p => `<div class="drop-slot" data-drop="${esc(p.drop)}">Drop here for: <strong>${esc(p.drop)}</strong></div>`).join('')}</div>
        </div>
      </div>
      <p style="margin-top:10px;color:#6b7280;font-size:.9rem;">Drag each item to the matching target, then submit.</p>`;
    }
    else if(type === 'hotspot' || type === 'hotarea'){
      html += `${q.imageUrl ? `<img src="${q.imageUrl}" class="hotspot-image" id="hotspotImg" alt="Hot spot">` : `<div class="empty-box">No image attached.</div>`}
      <p style="margin-top:10px;color:#6b7280;font-size:.9rem;">Click on the image or type coordinates below.</p>
      <input type="text" class="fill-input" placeholder="Optional: x,y or area name" style="margin-top:10px;" value="${esc(S.hotspotText)}" oninput="window.__stateHotspotText(this.value)">
      ${S.hotspotClick ? `<p style="margin-top:8px;color:#1e3c72;font-weight:600;">Marked: ${S.hotspotClick.x}, ${S.hotspotClick.y}</p>` : ''}`;
    }
    else if(type === 'otcase'){
      html += `<div style="background:#f8fbff;padding:16px;border-radius:12px;border:1.5px solid #dbe8ff;margin-bottom:16px;">
        <strong style="color:#0D1B40;">Case Scenario</strong>
        <p style="margin-top:8px;line-height:1.7;white-space:pre-wrap;">${esc(q.caseScenario || q.scenario || '')}</p>
      </div>
      <textarea class="manual-textarea" placeholder="Write your answer here">${esc(S.manual)}</textarea>`;
    }
    else {
      html += `${q.templateUrl ? `<a href="${q.templateUrl}" target="blank" rel="noopener" style="display:inline-block;margin-bottom:12px;color:#1e3c72;font-weight:700;">📎 Open Template</a>` : ''}
      <textarea class="manual-textarea" placeholder="Write your answer here">${esc(S.manual)}</textarea>`;
    }

    html += `</div>`;
    if(els.area) els.area.innerHTML = html;

    if(type === 'drag') initDrag();
    if((type === 'hotspot' || type === 'hotarea') && $('hotspotImg')){
      $('hotspotImg').addEventListener('click', captureHotspot);
    }
  }

  /* ===================== STATE HANDLERS ===================== */
  window.__pickSingle = function(i){ if(S.submitted || S.finished) return; S.choice = i; renderQuestion(); };
  window.__syncMulti = function(){ S.multi = Array.from(document.querySelectorAll('.multi-check')).filter(x => x.checked).map(x => Number(x.value)); };
  window.__setDropdown = function(v){ S.dropdown = v; };
  window.__stateFill = function(v){ S.fill = v; };
  window.__stateHotspotText = function(v){ S.hotspotText = v; };

  function initDrag(){
    document.querySelectorAll('.drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', item.dataset.drag || '');
      });
    });
    document.querySelectorAll('.drop-slot').forEach(slot => {
      slot.addEventListener('dragover', e => e.preventDefault());
      slot.addEventListener('drop', e => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData('text/plain');
        if(!dragged) return;
        slot.innerHTML = `<strong>${esc(slot.dataset.drop)}</strong>: ${esc(dragged)}`;
        S.dragMap[slot.dataset.drop] = dragged;
      });
    });
  }

  function captureHotspot(e){
    const rect = e.currentTarget.getBoundingClientRect();
    S.hotspotClick = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
    S.hotspotText = `${S.hotspotClick.x}, ${S.hotspotClick.y}`;
    renderQuestion();
  }

  /* ===================== SUBMIT ===================== */
  function submitAnswer(){
    if(S.submitted || S.finished) return;
    const q = currentQ();
    if(!q) return;
    const type = String(q.type || 'mcq').toLowerCase();
    let isCorrect = null, userText = '', feedback = '';

    if(type === 'mcq'){
      if(S.choice == null){ alert('Choose an option first.'); return; }
      isCorrect = compareSingle(q, S.choice);
      if(isCorrect) S.score += (q.marks || 1);
      userText = q.options?.[S.choice] ?? '';
      feedback = isCorrect
        ? `✅ Correct${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Wrong<br><strong>Correct:</strong> ${esc(correctLabels(q).join(', '))}${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else if(type === 'dropdown'){
      if(S.dropdown === ''){ alert('Choose an option first.'); return; }
      const idx = Number(S.dropdown);
      isCorrect = compareSingle(q, idx);
      if(isCorrect) S.score += (q.marks || 1);
      userText = q.options?.[idx] ?? '';
      feedback = isCorrect
        ? `✅ Correct${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Wrong<br><strong>Correct:</strong> ${esc(correctLabels(q).join(', '))}${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else if(type === 'multi'){
      const sel = [...S.multi].sort((a,b) => a-b);
      const cor = normMulti(q.correct);
      isCorrect = sel.length === cor.length && sel.every((v,i) => v === cor[i]);
      if(isCorrect) S.score += (q.marks || 1);
      userText = sel.map(i => q.options?.[i]).filter(Boolean).join(', ');
      feedback = isCorrect
        ? `✅ Correct${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Wrong<br><strong>Correct answers:</strong> ${esc(cor.map(i => q.options?.[i]).filter(Boolean).join(', '))}${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else if(type === 'fill'){
      const ans = S.fill.trim(), exp = String(q.answer || '').trim();
      if(!ans){ alert('Type your answer first.'); return; }
      isCorrect = ans.toLowerCase() === exp.toLowerCase();
      if(isCorrect) S.score += (q.marks || 1);
      userText = ans;
      feedback = isCorrect
        ? `✅ Correct${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Wrong<br><strong>Correct:</strong> ${esc(exp)}${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else if(type === 'drag'){
      const pairs = Array.isArray(q.pairs) ? q.pairs : [];
      isCorrect = true;
      pairs.forEach(p => {
        if(String(S.dragMap[String(p.drop)] || '') !== String(p.drag)) isCorrect = false;
      });
      if(isCorrect) S.score += (q.marks || 1);
      userText = JSON.stringify(S.dragMap);
      feedback = isCorrect
        ? `✅ Correct${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Wrong${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else if(type === 'hotspot' || type === 'hotarea'){
      const typed = S.hotspotText.trim(), exp = String(q.coords || '').trim();
      if(!typed && !S.hotspotClick){ alert('Mark or type an answer first.'); return; }
      let same = false;
      if(S.hotspotClick && exp){
        const coords = exp.toLowerCase().replace(/\s+/g, '');
        const m = coords.match(/x:?(-?\d+(\.\d+)?),?y:?(-?\d+(\.\d+)?)/);
        if(m){
          const ex = {x: Number(m[1]), y: Number(m[3])};
          same = Math.abs(S.hotspotClick.x - ex.x) <= 25 && Math.abs(S.hotspotClick.y - ex.y) <= 25;
        }
      } else if(typed){
        same = typed.toLowerCase() === exp.toLowerCase();
      }
      isCorrect = same;
      if(same) S.score += (q.marks || 1);
      userText = typed || `${S.hotspotClick?.x}, ${S.hotspotClick?.y}`;
      feedback = same
        ? `✅ Submitted${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`
        : `❌ Not matched${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }
    else {
      const ans = (document.querySelector('.manual-textarea')?.value || '').trim();
      if(!ans){ alert('Write an answer first.'); return; }
      userText = ans;
      isCorrect = null;
      feedback = `✅ Submitted for review<br><strong>Reference:</strong> ${esc(q.caseAnswer || q.templateAnswer || q.answer || 'Submitted for review')}${q.explanation ? '<br><br><strong>Explanation:</strong> ' + esc(q.explanation) : ''}`;
    }

    S.submitted = true;
    S.responses.push({index: S.index, isCorrect, userText, explanation: q.explanation || ''});
    toggleInteract(false);
    setFeedback(feedback, isCorrect === true ? 'correct' : isCorrect === false ? 'wrong' : 'info');
    setActionState();

    if(S.index >= S.questions.length - 1){
      setTimeout(() => { if(!S.finished) finishTest(); }, 120);
    }
  }

  function nextQ(){
    if(S.finished){ closeOverlay(); return; }
    if(!S.submitted){ submitAnswer(); return; }
    S.index++;
    if(S.index < S.questions.length){
      resetAnswers();
      clearFeedback();
      renderQuestion();
    } else {
      finishTest();
    }
  }

  function prevQ(){
    if(S.finished) return;
    if(S.index > 0){
      S.index--;
      resetAnswers();
      clearFeedback();
      renderQuestion();
    }
  }

  async function saveAttempt(){
    const user = currentUser();
    if(!user) throw new Error('Not logged in');
    const total = S.questions.length;
    const score = S.score;
    await db().collection('attempts').add({
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || user.email || 'Student',
      testId: S.test.id,
      testTitle: S.test.title || 'Test',
      subject: S.test.subject || 'General',
      chapter: S.test.chapter || 'General',
      score: Number(score || 0),
      total: Number(total || 0),
      percentage: Number(total ? Math.round((score / total) * 100) : 0),
      timeTaken: S.timeTaken,
      responses: S.responses,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function finishTest(){
    if(S.finished) return;
    S.finished = true;
    clearInterval(S.timerId);
    S.timeTaken = Math.floor((Date.now() - S.startTime) / 1000);

    try { await saveAttempt(); } catch(e) { console.error('Save attempt failed:', e); }

    const total = S.questions.length, score = S.score, pct = total ? Math.round((score / total) * 100) : 0;

    // Determine rank message
    let rankMsg = '';
    if(pct >= 90) rankMsg = '🏆 Outstanding! You are a top performer!';
    else if(pct >= 70) rankMsg = '🌟 Great job! Keep pushing higher!';
    else if(pct >= 50) rankMsg = '👍 Good effort! Practice more to improve.';
    else rankMsg = '💪 Keep practicing! You will get better.';

    if(els.area) els.area.innerHTML = `
      <div class="question-card" style="text-align:center;padding:40px 20px;">
        <div style="font-size:4rem;margin-bottom:16px;">${pct >= 70 ? '🎉' : pct >= 50 ? '👏' : '💪'}</div>
        <h2 style="font-family:'Playfair Display',serif;color:#0D1B40;font-size:2rem;margin-bottom:8px;">Test Completed</h2>
        <p style="font-size:1.1rem;color:#6b7280;margin-bottom:4px;">${esc(rankMsg)}</p>
        <div style="display:flex;justify-content:center;gap:24px;margin:24px 0;flex-wrap:wrap;">
          <div style="background:linear-gradient(135deg,#0D1B40,#1e3c72);color:#fff;padding:20px 28px;border-radius:16px;min-width:120px;">
            <div style="font-size:2.2rem;font-weight:800;font-family:'Playfair Display',serif;">${score}/${total}</div>
            <div style="font-size:.75rem;opacity:.7;text-transform:uppercase;letter-spacing:1px;">Score</div>
          </div>
          <div style="background:linear-gradient(135deg,#C9922A,#E8AA48);color:#0D1B40;padding:20px 28px;border-radius:16px;min-width:120px;">
            <div style="font-size:2.2rem;font-weight:800;font-family:'Playfair Display',serif;">${pct}%</div>
            <div style="font-size:.75rem;opacity:.7;text-transform:uppercase;letter-spacing:1px;">Percentage</div>
          </div>
          <div style="background:#f8fafc;border:2px solid #e5e7eb;padding:20px 28px;border-radius:16px;min-width:120px;">
            <div style="font-size:2.2rem;font-weight:800;font-family:'Playfair Display',serif;color:#0D1B40;">${Math.floor(S.timeTaken/60)}m ${S.timeTaken%60}s</div>
            <div style="font-size:.75rem;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Time Taken</div>
          </div>
        </div>
        <div style="display:grid;gap:12px;margin-top:14px;text-align:left;max-width:700px;margin-left:auto;margin-right:auto;">
          ${S.responses.map(r => `
            <div class="mini-item" style="padding:18px;border:1.5px solid ${r.isCorrect===true?'#10b981':r.isCorrect===false?'#ef4444':'#e5e7eb'};border-radius:12px;">
              <strong style="font-size:1.1rem;">Q${r.index+1}</strong>
              <span style="font-weight:700;color:${r.isCorrect===true?'#1f9d55':r.isCorrect===false?'#c54b4b':'#6b7280'};margin-left:8px;">
                ${r.isCorrect===null?'⏳ Submitted for review':r.isCorrect?'✅ Correct':'❌ Wrong'}
              </span>
              ${r.explanation ? `<div style="margin-top:10px;padding:12px;background:#f8fafc;border-radius:8px;line-height:1.7;"><strong>Explanation:</strong><br>${esc(r.explanation)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;

    clearFeedback();
    if(els.prev) els.prev.style.display = 'none';
    if(els.submit) els.submit.style.display = 'none';
    if(els.next){
      els.next.textContent = 'Close';
      els.next.style.display = 'inline-flex';
    }
    if(els.progress) els.progress.textContent = 'Done';
    if(els.bar) els.bar.style.width = '100%';

    // Refresh the mock list in the background so attempt counts update
    if(window.__loadStudentTests) window.__loadStudentTests();
  }

  function closeOverlay(){
    if(overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
    clearInterval(S.timerId);

    S = {
      test: null, questions: [], index: 0, score: 0, responses: [],
      startTime: null, timeTaken: 0, timerId: null,
      choice: null, multi: [], dropdown: '', fill: '', manual: '',
      hotspotText: '', hotspotClick: null, dragMap: {},
      submitted: false, finished: false
    };

    if(els.area) els.area.innerHTML = '';
    clearFeedback();
    if(els.next) els.next.textContent = 'Next →';
  }

  /* ===================== PUBLIC START API ===================== */
  window.__startTest = async function(testId){
    try {
      S.finished = false;
      const [testDoc, qSnap] = await Promise.all([
        db().collection('tests').doc(testId).get(),
        db().collection('questions').where('testId', '==', testId).get()
      ]);

      const questions = qSnap.docs.map(d => ({id: d.id, ...d.data()}))
        .sort((a, b) => (a.order ?? a.createdAt?.seconds ?? 0) - (b.order ?? b.createdAt?.seconds ?? 0));

      if(!testDoc.exists && !questions.length){ alert('Test not found'); return; }
      if(!questions.length){ alert('No questions found for this test'); return; }

      const firstQ = questions[0] || {};
      S.test = {
        ...(testDoc.exists ? testDoc.data() : {}),
        id: testId,
        title: (testDoc.exists && testDoc.data().title) || firstQ.testTitle || firstQ.title || 'Practice Test',
        subject: (testDoc.exists && testDoc.data().subject) || firstQ.subject || 'General',
        chapter: (testDoc.exists && testDoc.data().chapter) || firstQ.chapter || 'General'
      };
      S.questions = questions;
      S.index = 0;
      S.score = 0;
      S.responses = [];
      resetAnswers();

      if(els.title) els.title.textContent = S.test.title || 'Practice Test';
      if(overlay){
        overlay.classList.add('show');
        overlay.style.display = 'block';
      }
      document.body.style.overflow = 'hidden';
      renderQuestion();
      startTimer();
    } catch(err){
      console.error(err);
      alert('Error loading test: ' + err.message);
    }
  };

  /* ===================== EVENT BINDINGS ===================== */
  if(els.submit) els.submit.addEventListener('click', submitAnswer);
  if(els.next) els.next.addEventListener('click', nextQ);
  if(els.prev) els.prev.addEventListener('click', prevQ);
  if(els.close) els.close.addEventListener('click', closeOverlay);
  if(overlay) overlay.addEventListener('click', e => { if(e.target === overlay) closeOverlay(); });

})();
