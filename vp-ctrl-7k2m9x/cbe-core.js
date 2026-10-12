/* ============================================================
   Vinayak ProEdu — ACCA CBE core (shared by admin AND student)
   One question model → one renderer → one scorer.
   Question types mirror the real ACCA CBE platform.
   ============================================================ */
window.CBE = (function () {
  'use strict';

  /* ---------------- type registry ---------------- */
  const TYPES = {
    mcq:       { label: 'Multiple Choice',            group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    multi:     { label: 'Multiple Response',          group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    number:    { label: 'Number Entry',               group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    fill:      { label: 'Fill in the Blank(s)',       group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    dropdown:  { label: 'Dropdown in Sentence',       group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    hotspot:   { label: 'Hotspot (click the image)',  group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    dragmatch: { label: 'Drag & Match',               group: 'Objective Test (Section A)',       auto: true,  sec: 'A' },
    case:      { label: 'OT Case (linked OTQs)',      group: 'Objective Test Case (Section B)',  auto: true,  sec: 'B' },
    word:      { label: 'Constructed Response — Word',       group: 'Constructed Response (Section C)', auto: false, sec: 'C' },
    sheet:     { label: 'Constructed Response — Spreadsheet', group: 'Constructed Response (Section C)', auto: false, sec: 'C' }
  };
  const SUB_TYPES = ['mcq', 'multi', 'number', 'fill', 'dropdown'];
  const CR_TYPES = ['word', 'sheet'];

  /* ---------------- utils ---------------- */
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const normalizeText = v => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
  const pad2 = n => String(n).padStart(2, '0');
  const fmtTime = s => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const r2 = n => Math.round(n * 100) / 100;
  const byId = id => document.getElementById(id);
  const val = id => (byId(id)?.value || '').trim();
  const normalizeComparable = v => normalizeText(v).normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[₹$£€,%]/g,'').replace(/,/g,'').replace(/[^\w.\- ]+/g,' ').replace(/\s+/g,' ').trim();
  function numericValue(v){
    const t = String(v ?? '').trim().replace(/[₹$£€,%\s,]/g,'');
    if(!/^-?\d+(\.\d+)?$/.test(t)) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  function answerMatches(given, expected, alternatives = []){
    const pool = [expected, ...(Array.isArray(alternatives) ? alternatives : [])].map(String);
    const g = normalizeComparable(given);
    const accepted = pool.map(normalizeComparable).filter(Boolean);
    if(!g || !accepted.length) return false;
    const gn = numericValue(given);
    if(gn !== null) return pool.some(v => { const en = numericValue(v); return en !== null && Math.abs(gn - en) <= 0.0001; });
    return accepted.includes(g);
  }

  /* ---------------- legacy migration (your old data keeps working) ---------------- */
  function legacySectionBToCase(raw){
    // Old "sectionb" row spec:  row|Label|type|options|correct|marks|alts  / fixed|label|value / text|heading
    const spec = String(raw.sectionBHtml || '').trim();
    const introLines = [], subs = [];
    if(spec){
      const ls = lines(spec);
      const start = /^(calcTable|statementTable|cashflowtable|type\s*=)/i.test(ls[0] || '') ? 1 : 0;
      ls.slice(start).forEach(ln => {
        const parts = ln.includes('||') ? ln.split('||').map(s => s.trim()) : ln.split('|').map(s => s.trim());
        const p0 = (parts[0] || '').toLowerCase();
        if(['text','heading','label'].includes(p0)){ introLines.push(parts.slice(1).join(' | ')); return; }
        if(p0 === 'fixed'){ introLines.push((parts[1] || '') + (parts[2] ? ': ' + parts[2] : '')); return; }
        const idx = p0 === 'row' ? 1 : 0;
        const label = parts[idx] || '';
        const kind = (parts[idx + 1] || 'number').toLowerCase();
        const options = String(parts[idx + 2] || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
        const correct = parts[idx + 3] ?? '';
        const marks = Number(parts[idx + 4]) || 1;
        const alts = String(parts[idx + 5] || '').split(/[,|]/).map(s => s.trim()).filter(Boolean);
        if(['dropdown','mcq','yesno'].includes(kind)){
          subs.push({ type:'dropdown', question:label, options: kind === 'yesno' ? ['Yes','No'] : options, correct:Number(correct)||0, marks });
        } else {
          subs.push({ type:'number', question:label, correct:String(correct), alts, marks });
        }
      });
    }
    return {
      type:'case',
      section: raw.section || 'B',
      heading: raw.mainQuestion || raw.sectionBTitle || '',
      caseIntro: [raw.question, raw.sectionBMarkingScheme, ...introLines].filter(Boolean).join('\n\n'),
      exhibits: Array.isArray(raw.imageUrls) ? raw.imageUrls : (raw.imageUrl ? [raw.imageUrl] : []),
      subqs: subs
    };
  }
  function legacyBlanks(raw){
    const answers = Array.isArray(raw.answers) ? raw.answers : (raw.answer ? [raw.answer] : []);
    const alts = Array.isArray(raw.altAnswers) ? raw.altAnswers : [];
    return answers.map((a, i) => {
      const item = alts[i];
      return { answer: String(a ?? '').trim(), alts: Array.isArray(item) ? item.map(String) : String(item || '').split(/[,|]/).map(s=>s.trim()).filter(Boolean) };
    });
  }

  /* ---------------- model ---------------- */
  function normalize(raw = {}){
    if(raw.type === 'sectionb') return normalize(legacySectionBToCase(raw));
    if(raw.type === 'otcase') raw = { ...raw, type:'case', caseIntro: raw.caseScenario || raw.scenario || raw.question, subqs: raw.subqs || [] };
    if(raw.type === 'screenshot') raw = { ...raw, type:'mcq' };
    if(raw.type === 'excel') raw = { ...raw, type:'sheet' };
    const type = TYPES[raw.type] ? raw.type : 'mcq';
    const q = {
      id: raw.id || uid(),
      type,
      section: raw.section || TYPES[type].sec,
      order: Number(raw.order) || 0,
      heading: String(raw.heading || raw.mainQuestion || '').trim(),
      scenario: String(raw.scenario || ((type === 'fill' || type === 'dropdown') ? '' : raw.question) || '').trim(),
      exhibits: Array.isArray(raw.exhibits) ? raw.exhibits.filter(Boolean)
              : (Array.isArray(raw.imageUrls) && raw.imageUrls.length ? raw.imageUrls.filter(Boolean)
              : (raw.imageUrl ? [raw.imageUrl] : [])),
      imageAlt: raw.imageAlt || '',
      marks: Number(raw.marks) || 0,
      explanation: String(raw.explanation || '')
    };
    switch(type){
      case 'mcq':
        q.options = (Array.isArray(raw.options) ? raw.options : []).map(String);
        q.correct = Number(raw.correct);
        break;
      case 'dropdown':
        q.options = (Array.isArray(raw.options) ? raw.options : []).map(String);
        q.correct = Number(raw.correctIndex ?? raw.correct);
        q.sentence = String(raw.sentence || '').trim();
        break;
      case 'multi':
        q.options = (Array.isArray(raw.options) ? raw.options : []).map(String);
        q.correct = (Array.isArray(raw.correct) ? raw.correct : String(raw.correct ?? '').split(',')).map(Number).filter(v => !Number.isNaN(v));
        break;
      case 'number':
        q.correct = String(raw.correct ?? '');
        q.alts = (Array.isArray(raw.alts) ? raw.alts : String(raw.altAnswers || raw.alt || '').split(/[,|]/)).map(String).map(s => s.trim()).filter(Boolean);
        break;
      case 'fill':
        q.sentence = String(raw.sentence || raw.question || '').trim();
        q.blanks = (Array.isArray(raw.blanks) && raw.blanks.length) ? raw.blanks.map(b => ({ answer: String(b.answer ?? '').trim(), alts: (Array.isArray(b.alts) ? b.alts : String(b.altsRaw || '').split(/[,|]/)).map(String).map(s=>s.trim()).filter(Boolean) })) : legacyBlanks(raw);
        break;
      case 'hotspot':
        q.hotspotImage = raw.hotspotImage || q.exhibits[0] || '';
        q.targets = (Array.isArray(raw.targets) ? raw.targets : []).map(t => ({ x: Number(t.x) || 0, y: Number(t.y) || 0, r: Number(t.r) || 25 }));
        break;
      case 'dragmatch':
        q.pairs = (Array.isArray(raw.pairs) ? raw.pairs : []).map(p => ({ drag: String(p.drag || '').trim(), drop: String(p.drop || '').trim() })).filter(p => p.drag && p.drop);
        break;
      case 'case':
        q.caseIntro = String(raw.caseIntro || '').trim();
        q.scenario = q.caseIntro || q.scenario;
        q.subqs = (Array.isArray(raw.subqs) ? raw.subqs : []).map((s, i) => normalizeSub(s, i));
        q.marks = r2(q.subqs.reduce((a, s) => a + s.marks, 0)) || q.marks;
        break;
      case 'word': case 'sheet':
        q.rubric = String(raw.rubric || '').trim();
        break;
    }
    return q;
  }
  function normalizeSub(raw = {}, i = 0){
    const type = SUB_TYPES.includes(raw.type) ? raw.type : 'mcq';
    const sub = { id: raw.id || ('sub' + i), type, question: String(raw.question || '').trim(), marks: Number(raw.marks) || 1 };
    if(type === 'mcq' || type === 'dropdown'){ sub.options = (raw.options || []).map(String); sub.correct = Number(raw.correct); }
    if(type === 'multi'){ sub.options = (raw.options || []).map(String); sub.correct = (Array.isArray(raw.correct) ? raw.correct : []).map(Number); }
    if(type === 'number'){ sub.correct = String(raw.correct ?? ''); sub.alts = (raw.alts || []).map(String); }
    if(type === 'fill'){ sub.blanks = Array.isArray(raw.blanks) && raw.blanks.length ? raw.blanks : [{ answer: String(raw.correct ?? ''), alts: [] }]; }
    return sub;
  }
  function marksOf(q){ return q.type === 'case' ? r2(q.subqs.reduce((a, s) => a + s.marks, 0)) : Number(q.marks) || 0; }
  function isCR(q){ return CR_TYPES.includes(q.type); }

  /* ---------------- validation (admin builder) ---------------- */
  function validate(q){
    if(!q.heading && !q.scenario && q.type !== 'fill' && q.type !== 'dropdown') return 'Add a requirement (heading) or scenario text.';
    if(marksOf(q) <= 0 && q.type !== 'case') return 'Enter the marks for this question.';
    switch(q.type){
      case 'mcq':
        if(q.options.length < 2) return 'Need at least 2 options.';
        if(!(q.correct >= 0 && q.correct < q.options.length)) return 'Correct option index out of range.';
        break;
      case 'dropdown':
        if(!q.sentence) return 'Enter the sentence containing [blank].';
        if(q.options.length < 2) return 'Need at least 2 options.';
        if(!(q.correct >= 0 && q.correct < q.options.length)) return 'Correct option index out of range.';
        break;
      case 'multi':
        if(q.options.length < 2) return 'Need at least 2 options.';
        if(!q.correct.length) return 'Enter correct option indices (comma separated).';
        break;
      case 'number':
        if(!String(q.correct).trim()) return 'Enter the correct number.';
        break;
      case 'fill':
        if(!q.sentence) return 'Enter the sentence with blanks.';
        if(!q.blanks.length) return 'Enter at least one answer line.';
        break;
      case 'hotspot':
        if(!q.hotspotImage) return 'Add the hotspot image URL (or an exhibit image).';
        if(!q.targets.length) return 'Click the image preview to add at least one target point.';
        break;
      case 'dragmatch':
        if(q.pairs.length < 2) return 'Add at least 2 pairs (one "item = match" per line).';
        break;
      case 'case':
        if(!q.subqs.length) return 'Add at least one sub-question.';
        for(const s of q.subqs){ const err = validateSub(s); if(err) return 'Sub-question (' + (s.question || '').slice(0, 40) + '…): ' + err; }
        break;
      case 'word': case 'sheet':
        if(!q.rubric) return 'Add a marking guide (rubric) so the tutor can award marks consistently.';
        break;
    }
    return '';
  }
  function validateSub(s){
    if(!s.question) return 'question text is required.';
    if((s.type === 'mcq' || s.type === 'dropdown') && (s.options || []).length < 2) return 'needs at least 2 options.';
    if((s.type === 'mcq' || s.type === 'dropdown') && !(s.correct >= 0)) return 'needs a correct option index.';
    if(s.type === 'multi' && !(s.options || []).length) return 'needs options.';
    if(s.type === 'number' && !String(s.correct ?? '').trim()) return 'needs the correct number.';
    if(s.type === 'fill' && !(s.blanks || []).length) return 'needs at least one blank answer.';
    return '';
  }

  /* ---------------- CSS (single source for both sides) ---------------- */
  const CSS = `
  .cbe-req{font-weight:800;font-size:1.08rem;color:#111827;line-height:1.55;white-space:pre-wrap;margin:0 0 12px;}
  .cbe-split{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;}
  @media(max-width:900px){.cbe-split{grid-template-columns:1fr;}}
  .cbe-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;min-width:0;}
  .cbe-panel h4{margin:0 0 10px;font-size:.92rem;font-weight:900;color:#0D1B40;letter-spacing:.4px;text-transform:uppercase;}
  .cbe-scenario-text{white-space:pre-wrap;font-size:1rem;line-height:1.65;color:#111827;margin-bottom:12px;}
  .cbe-exhibit{margin:10px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;}
  .cbe-exhibit img{width:100%;display:block;}
  .cbe-option{display:flex;gap:10px;align-items:flex-start;padding:13px 14px;border:1.5px solid #dbe2ee;border-radius:12px;margin:8px 0;background:#fff;cursor:pointer;transition:border-color .15s, background .15s;}
  .cbe-option:hover{background:#f8fafc;border-color:#b8c7ea;}
  .cbe-option input{width:auto;margin:3px 0 0;accent-color:#1e3c72;}
  .cbe-opt-txt{font-size:1rem;line-height:1.55;color:#111827;}
  .cbe-input,.cbe-select{width:100%;padding:11px 12px;border:1.5px solid #dbe2ee;border-radius:10px;font:inherit;background:#fff;color:#111827;}
  .cbe-input:focus,.cbe-select:focus{outline:none;border-color:#1e3c72;box-shadow:0 0 0 3px rgba(30,60,114,.12);}
  .cbe-fib{display:inline-block;min-width:110px;max-width:180px;padding:8px 10px;margin:0 4px;border:1.5px solid #dbe2ee;border-radius:8px;font:inherit;}
  .cbe-sub{border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:12px 0;background:#fbfdff;}
  .cbe-sub-q{font-weight:700;color:#111827;margin-bottom:10px;white-space:pre-wrap;line-height:1.5;}
  .cbe-tag{display:inline-block;padding:2px 9px;border-radius:999px;background:#eef4ff;color:#0D1B40;font-size:.7rem;font-weight:800;letter-spacing:.5px;margin-left:6px;vertical-align:middle;}
  .cbe-hotspot-wrap{position:relative;display:inline-block;max-width:100%;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;line-height:0;}
  .cbe-hotspot-wrap img{display:block;width:100%;cursor:crosshair;}
  .cbe-dot{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(201,146,42,.9);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);pointer-events:none;}
  .cbe-chip{display:inline-block;padding:9px 14px;margin:4px;border-radius:999px;background:#eef4ff;border:1.5px solid #b8c7ea;font-weight:700;cursor:grab;user-select:none;}
  .cbe-drop{min-height:44px;padding:10px 12px;margin:8px 0;border:1.5px dashed #b8c7ea;border-radius:10px;background:#fbfdff;line-height:1.5;}
  .cbe-drop.filled{border-style:solid;background:#ecfdf5;}
  .cbe-word{min-height:220px;border:1.5px solid #dbe2ee;border-radius:12px;padding:14px;background:#fff;outline:none;font-size:.97rem;line-height:1.6;}
  .cbe-word:focus{border-color:#1e3c72;}
  .cbe-toolbar{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;}
  .cbe-toolbar button{border:1px solid #dbe2ee;background:#f8fafc;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:700;font-family:inherit;}
  .cbe-grid-wrap{overflow:auto;border:1px solid #dbe2ee;border-radius:12px;}
  .cbe-grid{border-collapse:collapse;width:100%;min-width:520px;}
  .cbe-grid th{background:#eef2f8;border:1px solid #dbe2ee;font-size:.75rem;padding:4px 6px;color:#0D1B40;width:96px;}
  .cbe-grid td{border:1px solid #e2e8f0;min-width:96px;height:28px;padding:3px 6px;font-size:.88rem;outline:none;white-space:pre-wrap;}
  .cbe-grid td:focus{background:#f8fbff;box-shadow:inset 0 0 0 2px rgba(30,60,114,.25);}
  .cbe-note{margin-top:10px;font-size:.85rem;color:#6B7280;line-height:1.55;}
  `;
  function injectCss(){ if(byId('cbe-css')) return; const st = document.createElement('style'); st.id = 'cbe-css'; st.textContent = CSS; document.head.appendChild(st); }

  /* ---------------- rendering ---------------- */
  function scenarioHtml(q, opts = {}){
    const imgs = q.exhibits.map((u, i) => `<figure class="cbe-exhibit"><img src="${esc(u)}" alt="${esc(q.imageAlt || 'Exhibit ' + (i + 1))}"></figure>`).join('');
    let rubric = '';
    if(opts.showRubric && q.rubric) rubric = `<div class="cbe-note" style="background:#fffbe6;border:1px solid #e5d9a0;border-radius:10px;padding:10px;"><strong>Marking guide:</strong> ${esc(q.rubric)}</div>`;
    return `${q.scenario ? `<div class="cbe-scenario-text">${esc(q.scenario)}</div>` : ''}${imgs}${rubric}`;
  }

  function widgetHtml(sub, selected, name){
    const t = sub.type;
    if(t === 'mcq') return (sub.options || []).map((o, i) => `<label class="cbe-option"><input type="radio" name="${name}" data-cbe-input value="${i}" ${String(selected) === String(i) ? 'checked' : ''}><span class="cbe-opt-txt">${esc(o)}</span></label>`).join('');
    if(t === 'multi'){ const sel = Array.isArray(selected) ? selected : []; return (sub.options || []).map((o, i) => `<label class="cbe-option"><input type="checkbox" data-cbe-input data-group="${name}" value="${i}" ${sel.includes(i) ? 'checked' : ''}><span class="cbe-opt-txt">${esc(o)}</span></label>`).join(''); }
    if(t === 'number') return `<input type="text" inputmode="decimal" class="cbe-input" data-cbe-input value="${esc(selected ?? '')}" placeholder="Enter the number">`;
    if(t === 'dropdown') return `<select class="cbe-select" data-cbe-input><option value="">Select</option>${(sub.options || []).map((o, i) => `<option value="${i}" ${String(selected) === String(i) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    if(t === 'fill'){ const vals = Array.isArray(selected) ? selected : []; return `<div style="display:grid;gap:8px;">${(sub.blanks || []).map((b, i) => `<input type="text" class="cbe-input" data-cbe-input data-idx="${i}" value="${esc(vals[i] ?? '')}" placeholder="Blank ${i + 1}">`).join('')}</div>`; }
    return '';
  }

  function fillHtml(q, selected){
    const values = Array.isArray(selected) ? selected : [];
    const input = i => `<input type="text" class="cbe-fib" data-cbe-input data-idx="${i}" value="${esc(values[i] ?? '')}">`;
    const safe = esc(q.sentence);
    if(/\{\{\d+\}\}/.test(q.sentence)) return `<div class="cbe-scenario-text">${safe.replace(/\{\{(\d+)\}\}/g, (_, n) => input(Number(n) - 1))}</div>`;
    if(/\[blank\]/i.test(q.sentence)) return `<div class="cbe-scenario-text">${safe.replace(/\[blank\]/i, input(0))}</div>`;
    if(/_{3,}/.test(q.sentence)) return `<div class="cbe-scenario-text">${safe.replace(/_{3,}/, input(0))}</div>`;
    return `<div class="cbe-scenario-text">${safe}</div><div style="display:grid;gap:8px;">${q.blanks.map((_, i) => `<label class="small" style="font-weight:700;color:#374151;">Blank ${i + 1}<input type="text" class="cbe-input" data-cbe-input data-idx="${i}" value="${esc(values[i] ?? '')}" style="margin-top:4px;"></label>`).join('')}</div>`;
  }

  const SHEET_COLS = ['A','B','C','D','E'];
  const SHEET_ROWS = 10;
  function sheetHtml(q, selected){
    const grid = Array.isArray(selected) && selected.length ? selected : [];
    const head = `<tr><th></th>${SHEET_COLS.map(c => `<th>${c}</th>`).join('')}</tr>`;
    const body = Array.from({length: SHEET_ROWS}, (_, r) => `<tr><th>${r + 1}</th>${SHEET_COLS.map((_, c) => { const v = grid[r] && grid[r][c] != null ? grid[r][c] : ''; return `<td data-cbe-cell data-r="${r}" data-c="${c}" ${q.readonly ? '' : 'contenteditable="true"'}>${esc(v)}</td>`; }).join('')}</tr>`).join('');
    return `<div class="cbe-grid-wrap"><table class="cbe-grid">${head}${body}</table></div>`;
  }

  function answerHtml(q, selected, opts = {}){
    switch(q.type){
      case 'mcq': case 'multi': case 'number': case 'dropdown':
        return widgetHtml(q, selected, 'cbe-' + q.id);
      case 'fill':
        return fillHtml(q, selected);
      case 'hotspot': {
        const clicks = Array.isArray(selected) ? selected : [];
        return `<div class="cbe-hotspot-wrap" data-cbe-hotspot><img src="${esc(q.hotspotImage)}" alt="Hotspot image">${clicks.map(c => `<span class="cbe-dot" data-x="${c.x}" data-y="${c.y}" style="left:${c.x}px;top:${c.y}px;"></span>`).join('')}</div><div class="cbe-note">Click on the image to place your answer marker(s).</div>`;
      }
      case 'dragmatch': {
        const map = selected || {};
        const chips = q.pairs.map(p => `<span class="cbe-chip" draggable="true" data-drag="${esc(p.drag)}">${esc(p.drag)}</span>`).join('');
        const slots = q.pairs.map(p => {
          const v = map[p.drop] || '';
          return `<div class="cbe-drop ${v ? 'filled' : ''}" data-drop="${esc(p.drop)}" data-value="${esc(v)}"><strong>${esc(p.drop)}</strong>${v ? ': ' + esc(v) : ' — drag the matching item here (click to clear)'}</div>`;
        }).join('');
        return `<div>${chips}</div><div style="margin-top:10px;">${slots}</div><div class="cbe-note">Drag each item onto its match, or click a filled box to clear it.</div>`;
      }
      case 'case':
        return q.subqs.map((s, i) => `<div class="cbe-sub" data-sub="${i}"><div class="cbe-sub-q">${i + 1}. ${esc(s.question)}<span class="cbe-tag">${s.marks} mark${s.marks > 1 ? 's' : ''}</span></div>${widgetHtml(s, Array.isArray(selected) ? selected[i] : undefined, 'cbe-' + q.id + '-' + i)}</div>`).join('');
      case 'word':
        return `<div class="cbe-toolbar"><button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="underline"><u>U</u></button><button type="button" data-cmd="insertUnorderedList">• List</button></div><div class="cbe-word" data-cbe-word ${opts.readonly ? '' : 'contenteditable="true"'}>${String(selected || '')}</div><div class="cbe-note">Constructed response — <strong>not auto-marked</strong>. Your answer goes to the tutor for manual marking.</div>`;
      case 'sheet':
        return sheetHtml({ ...q, readonly: opts.readonly }, selected) + `<div class="cbe-note">Constructed response — <strong>not auto-marked</strong>. Use the on-screen calculator / scratch pad for workings.</div>`;
    }
    return '';
  }

  /* Full question card body. Split-screen like the real CBE: scenario left, answer right. */
  function render(q, selected, opts = {}){
    const split = isCR(q) || q.type === 'case' || q.type === 'hotspot' || q.type === 'dragmatch' || q.exhibits.length > 0 || q.scenario;
    const answer = `<div class="cbe-panel"><h4>${opts.answerTitle || 'Answer'}</h4><div data-cbe-answer="${q.id}">${answerHtml(q, selected, opts)}</div></div>`;
    if(!split) return `${q.heading ? `<div class="cbe-req">${esc(q.heading)}</div>` : ''}${answer}`;
    const scen = `<div class="cbe-panel"><h4>${opts.scenarioTitle || 'Question'}</h4>${scenarioHtml(q, opts)}</div>`;
    return `${q.heading ? `<div class="cbe-req">${esc(q.heading)}</div>` : ''}<div class="cbe-split">${scen}${answer}</div>`;
  }

  /* Wire interactive behaviour inside root. onChange() called after every edit. */
  function wire(root, q, onChange){
    const box = root.querySelector(`[data-cbe-answer="${q.id}"]`) || root;
    const fire = () => { if(onChange) onChange(); };
    box.querySelectorAll('[data-cbe-input]').forEach(el => {
      el.addEventListener(el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', fire);
    });
    if(q.type === 'hotspot'){
      const wrap = box.querySelector('[data-cbe-hotspot]');
      const img = wrap && wrap.querySelector('img');
      if(wrap && img){
        wrap.addEventListener('click', e => {
          const rect = img.getBoundingClientRect();
          const x = Math.round(e.clientX - rect.left), y = Math.round(e.clientY - rect.top);
          const dots = [...wrap.querySelectorAll('.cbe-dot')];
          const hit = dots.find(d => Math.abs(Number(d.dataset.x) - x) <= 12 && Math.abs(Number(d.dataset.y) - y) <= 12);
          if(hit) hit.remove();
          else wrap.insertAdjacentHTML('beforeend', `<span class="cbe-dot" data-x="${x}" data-y="${y}" style="left:${x}px;top:${y}px;"></span>`);
          fire();
        });
      }
    }
    if(q.type === 'dragmatch'){
      box.querySelectorAll('.cbe-chip').forEach(chip => {
        chip.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', chip.dataset.drag));
      });
      box.querySelectorAll('.cbe-drop').forEach(slot => {
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
          e.preventDefault();
          const v = e.dataTransfer.getData('text/plain');
          if(!v) return;
          slot.dataset.value = v;
          slot.classList.add('filled');
          slot.innerHTML = `<strong>${esc(slot.dataset.drop)}</strong>: ${esc(v)}`;
          fire();
        });
        slot.addEventListener('click', () => {
          if(!slot.dataset.value) return;
          slot.dataset.value = '';
          slot.classList.remove('filled');
          slot.innerHTML = `<strong>${esc(slot.dataset.drop)}</strong> — drag the matching item here (click to clear)`;
          fire();
        });
      });
    }
    if(q.type === 'word'){
      const ed = box.querySelector('[data-cbe-word]');
      if(ed) ed.addEventListener('input', fire);
      box.querySelectorAll('.cbe-toolbar [data-cmd]').forEach(btn => btn.addEventListener('mousedown', e => {
        e.preventDefault();
        if(ed){ ed.focus(); document.execCommand(btn.dataset.cmd, false, null); fire(); }
      }));
    }
    if(q.type === 'sheet'){
      box.querySelectorAll('[data-cbe-cell]').forEach(cell => cell.addEventListener('input', fire));
    }
  }

  function setReadonly(root, q){
    const box = root.querySelector(`[data-cbe-answer="${q.id}"]`) || root;
    box.querySelectorAll('input, select, textarea').forEach(n => { n.disabled = true; });
    box.querySelectorAll('[contenteditable]').forEach(n => n.setAttribute('contenteditable', 'false'));
  }

  /* ---------------- capture (read the answer from the DOM) ---------------- */
  function capture(q, root){
    const r = root || document;
    const box = r.querySelector(`[data-cbe-answer="${q.id}"]`) || r;
    switch(q.type){
      case 'mcq': case 'dropdown': { const c = box.querySelector('input[type="radio"]:checked, select[data-cbe-input]'); if(!c) return null; const v = c.value; return v === '' ? null : Number(v); }
      case 'multi': return [...box.querySelectorAll('input[type="checkbox"]:checked')].map(c => Number(c.value));
      case 'number': return (box.querySelector('[data-cbe-input]')?.value || '').trim();
      case 'fill': return [...box.querySelectorAll('[data-cbe-input]')].map(i => i.value.trim());
      case 'hotspot': return [...box.querySelectorAll('.cbe-dot')].map(d => ({ x: Number(d.dataset.x), y: Number(d.dataset.y) }));
      case 'dragmatch': { const m = {}; box.querySelectorAll('.cbe-drop.filled').forEach(s => { m[s.dataset.drop] = s.dataset.value; }); return m; }
      case 'case': return q.subqs.map((s, i) => { const subBox = box.querySelector(`[data-sub="${i}"]`); return captureSub(s, subBox); });
      case 'word': return box.querySelector('[data-cbe-word]')?.innerHTML.trim() || '';
      case 'sheet': { const g = []; box.querySelectorAll('[data-cbe-cell]').forEach(c => { const rI = Number(c.dataset.r), cI = Number(c.dataset.c); if(!g[rI]) g[rI] = []; g[rI][cI] = c.textContent.trim(); }); return g.map(row => row || []); }
    }
    return null;
  }
  function captureSub(sub, subBox){
    if(!subBox) return null;
    switch(sub.type){
      case 'mcq': case 'dropdown': { const c = subBox.querySelector('input[type="radio"]:checked, select[data-cbe-input]'); if(!c) return null; const v = c.value; return v === '' ? null : Number(v); }
      case 'multi': return [...subBox.querySelectorAll('input[type="checkbox"]:checked')].map(c => Number(c.value));
      case 'number': return (subBox.querySelector('[data-cbe-input]')?.value || '').trim();
      case 'fill': return [...subBox.querySelectorAll('[data-cbe-input]')].map(i => i.value.trim());
    }
    return null;
  }

  /* ---------------- scoring ---------------- */
  function score(q, ans){
    if(isCR(q)) return { gained: 0, marks: marksOf(q), manual: true, fullyCorrect: false };
    switch(q.type){
      case 'mcq': case 'dropdown': { const ok = ans !== null && ans !== undefined && String(ans) !== '' && Number(ans) === Number(q.correct); return { gained: ok ? marksOf(q) : 0, marks: marksOf(q), fullyCorrect: ok }; }
      case 'multi': { const a = (Array.isArray(ans) ? ans : []).map(Number).sort((x, y) => x - y); const c = [...q.correct].sort((x, y) => x - y); const ok = a.length === c.length && a.every((v, i) => v === c[i]); return { gained: ok ? marksOf(q) : 0, marks: marksOf(q), fullyCorrect: ok }; }
      case 'number': { const ok = answerMatches(ans ?? '', q.correct, q.alts); return { gained: ok ? marksOf(q) : 0, marks: marksOf(q), fullyCorrect: ok }; }
      case 'fill': { const given = Array.isArray(ans) ? ans : []; let m = 0; q.blanks.forEach((b, i) => { if(answerMatches(given[i] ?? '', b.answer, b.alts)) m++; }); const gained = q.blanks.length ? r2(marksOf(q) * m / q.blanks.length) : 0; return { gained, marks: marksOf(q), fullyCorrect: q.blanks.length > 0 && m === q.blanks.length }; }
      case 'hotspot': { const clicks = Array.isArray(ans) ? ans : []; if(!q.targets.length) return { gained: 0, marks: marksOf(q), fullyCorrect: false }; let hit = 0; q.targets.forEach(t => { if(clicks.some(c => Math.abs(c.x - t.x) <= t.r && Math.abs(c.y - t.y) <= t.r)) hit++; }); return { gained: r2(marksOf(q) * hit / q.targets.length), marks: marksOf(q), fullyCorrect: hit === q.targets.length }; }
      case 'dragmatch': { const map = ans || {}; let ok = 0; q.pairs.forEach(p => { if(String(map[p.drop] || '') === p.drag) ok++; }); return { gained: r2(marksOf(q) * ok / q.pairs.length), marks: marksOf(q), fullyCorrect: ok === q.pairs.length }; }
      case 'case': { let gained = 0; q.subqs.forEach((s, i) => { gained += scoreSub(s, Array.isArray(ans) ? ans[i] : undefined).gained; }); return { gained: r2(gained), marks: marksOf(q), fullyCorrect: false }; }
    }
    return { gained: 0, marks: marksOf(q), fullyCorrect: false };
  }
  function scoreSub(sub, ans){
    const m = Number(sub.marks) || 0;
    switch(sub.type){
      case 'mcq': case 'dropdown': { const ok = ans !== null && ans !== undefined && String(ans) !== '' && Number(ans) === Number(sub.correct); return { gained: ok ? m : 0, marks: m, fullyCorrect: ok }; }
      case 'multi': { const a = (Array.isArray(ans) ? ans : []).map(Number).sort((x, y) => x - y); const c = [...(sub.correct || [])].sort((x, y) => x - y); const ok = a.length === c.length && a.every((v, i) => v === c[i]); return { gained: ok ? m : 0, marks: m, fullyCorrect: ok }; }
      case 'number': { const ok = answerMatches(ans ?? '', sub.correct, sub.alts || []); return { gained: ok ? m : 0, marks: m, fullyCorrect: ok }; }
      case 'fill': { const given = Array.isArray(ans) ? ans : []; const total = (sub.blanks || []).length; let hit = 0; (sub.blanks || []).forEach((b, i) => { if(answerMatches(given[i] ?? '', b.answer, b.alts || [])) hit++; }); return { gained: total ? r2(m * hit / total) : 0, marks: m, fullyCorrect: total > 0 && hit === total }; }
    }
    return { gained: 0, marks: m, fullyCorrect: false };
  }

  /* ---------------- answer text (for review & marking) ---------------- */
  function optionText(q, idx){ return q.options && q.options[idx] != null ? q.options[idx] : ''; }
  function correctText(q){
    if(isCR(q)) return 'Marked manually by tutor';
    switch(q.type){
      case 'mcq': case 'dropdown': return String(optionText(q, q.correct));
      case 'multi': return q.correct.map(i => optionText(q, i)).filter(Boolean).join(', ');
      case 'number': return String(q.correct);
      case 'fill': return q.blanks.map(b => b.answer).join(' | ');
      case 'hotspot': return q.targets.map(t => `(${t.x}, ${t.y})`).join('  ');
      case 'dragmatch': return q.pairs.map(p => `${p.drop} → ${p.drag}`).join('; ');
      case 'case': return q.subqs.map((s, i) => `${i + 1}. ${correctText(s)}`).join('   ');
    }
    return '';
  }
  function answerText(q, ans){
    if(isCR(q)) return 'Submitted for manual marking';
    if(ans === null || ans === undefined || (Array.isArray(ans) && !ans.length) || ans === '') return '—';
    switch(q.type){
      case 'mcq': case 'dropdown': return String(optionText(q, Number(ans)));
      case 'multi': return (Array.isArray(ans) ? ans : []).map(i => optionText(q, i)).filter(Boolean).join(', ');
      case 'number': case 'fill': return Array.isArray(ans) ? ans.join(' | ') : String(ans);
      case 'hotspot': return (Array.isArray(ans) ? ans : []).map(c => `(${c.x}, ${c.y})`).join('  ');
      case 'dragmatch': return Object.entries(ans || {}).map(([d, v]) => `${d} → ${v}`).join('; ');
      case 'case': return q.subqs.map((s, i) => `${i + 1}. ${answerText(s, Array.isArray(ans) ? ans[i] : undefined)}`).join('   ');
    }
    return String(ans);
  }

  return { TYPES, SUB_TYPES, CR_TYPES, esc, lines, fmtTime, normalize, normalizeSub, marksOf, isCR, validate, injectCss, scenarioHtml, answerHtml, render, wire, setReadonly, capture, score, correctText, answerText, answerMatches };
})();
