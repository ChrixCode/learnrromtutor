/* ============================================================
   2tors.ng LEARNER — MVP 1 learner experience (Step 5/6)
   Onboarding (profile) → diagnostic → skill profile →
   learning map → AI Tutor practice → mastery → parent summary
   → human escalation. Diagnoses → practices → evidences
   mastery; never advances on watch-time.

   Additive only: seeds diagnostic questions/objectives when
   absent, upserts skillProfiles/masteryStates, journals AI
   sessions with prompt-version + safety metadata.
   Requires: learnroom.js (LR). lrt-ecosystem.js optional
   (used for logAiSession when present).
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  var EXTRA_OBJECTIVES = [
    { id: 4, subject: 'English', level: 'Grade 11', code: 'ENG-RD-01', title: 'Comprehend informational passages', mock: true }
  ];

  var DX_QUESTIONS = [
    { id: 2, objectiveId: 1, kind: 'diagnostic', prompt: 'Factor: x² + 7x + 12', options: ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x − 3)(x − 4)'], answer: 0, mock: true },
    { id: 3, objectiveId: 1, kind: 'diagnostic', prompt: 'Solve: x² = 49', options: ['x = 7', 'x = ±7', 'x = 49', 'x = −7'], answer: 1, mock: true },
    { id: 4, objectiveId: 2, kind: 'diagnostic', prompt: 'Greatest common factor of 12x² and 18x?', options: ['6x', '6', '3x', '36x²'], answer: 0, mock: true },
    { id: 5, objectiveId: 2, kind: 'diagnostic', prompt: 'Which is a perfect-square trinomial?', options: ['x² + 5x + 6', 'x² + 6x + 9', 'x² + 4x + 8', '2x² + 4x + 2'], answer: 1, mock: true },
    { id: 6, objectiveId: 3, kind: 'diagnostic', prompt: 'A strong thesis statement should be…', options: ['vague and broad', 'specific and arguable', 'a question', 'a famous quote'], answer: 1, mock: true },
    { id: 7, objectiveId: 3, kind: 'diagnostic', prompt: 'Which sentence uses commas correctly?', options: ['I like apples oranges and bananas.', 'I like apples, oranges, and bananas.', 'I like, apples oranges and bananas.', 'I like apples oranges, and bananas.'], answer: 1, mock: true },
    { id: 8, objectiveId: 4, kind: 'diagnostic', prompt: 'The main idea of a passage is…', options: ['a minor detail', 'the central point', 'always the first sentence', 'the same as the title'], answer: 1, mock: true },
    { id: 9, objectiveId: 4, kind: 'diagnostic', prompt: 'Context clues help readers…', options: ['skip difficult texts', 'infer word meanings', 'memorize the dictionary', 'avoid reading'], answer: 1, mock: true },
    { id: 10, objectiveId: 1, kind: 'diagnostic', prompt: 'Discriminant of x² − 5x + 6?', options: ['1', '13', '25', '−1'], answer: 0, mock: true }
  ];

  function statusFor(score) {
    if (score >= 80) return 'mastered';
    if (score >= 50) return 'developing';
    return 'needs-support';
  }

  function ensureSeeds() {
    var objs = Store.get('objectives') || [];
    EXTRA_OBJECTIVES.forEach(function (o) {
      if (!objs.some(function (x) { return x.id === o.id; })) objs.push(o);
    });
    Store.set('objectives', objs);
    var qs = Store.get('questions') || [];
    DX_QUESTIONS.forEach(function (q) {
      if (!qs.some(function (x) { return x.id === q.id; })) qs.push(q);
    });
    Store.set('questions', qs);
  }

  /* ---------- profile ---------- */
  function getProfile() {
    var all = Store.get('profiles') || [];
    return all.length ? all[0] : null;
  }
  function saveProfile(p) {
    p = p || {};
    var rec = {
      id: 1, userId: 6, role: 'learner',
      age: parseInt(p.age, 10) || null,
      grade: p.grade || '', curriculum: p.curriculum || '',
      subjects: p.subjects || [], mock: true
    };
    Store.set('profiles', [rec]);
    LR.track('learner.profile_saved', { grade: rec.grade, subjects: rec.subjects });
    return rec;
  }

  /* ---------- diagnostic ---------- */
  function diagnosticQuestions() {
    ensureSeeds();
    return (Store.get('questions') || []).filter(function (q) { return q.kind === 'diagnostic'; });
  }
  function gradeDiagnostic(answers) {
    // answers: { questionId: chosenIndex }
    ensureSeeds();
    var qs = diagnosticQuestions();
    var byObj = {};
    var journal = Store.get('attempts') || [];
    qs.forEach(function (q) {
      var ok = answers[q.id] !== undefined && Number(answers[q.id]) === q.answer ? 1 : 0;
      byObj[q.objectiveId] = byObj[q.objectiveId] || { correct: 0, total: 0 };
      byObj[q.objectiveId].correct += ok;
      byObj[q.objectiveId].total += 1;
      // Per-question audit trail powers misconception flags (§14).
      journal.push({ id: journal.length + 1, kind: 'diagnostic', questionId: q.id, objectiveId: q.objectiveId, correct: !!ok, ts: new Date().toISOString(), mock: true });
    });
    Store.set('attempts', journal);
    var profiles = Store.get('skillProfiles') || [];
    var mastery = Store.get('masteryStates') || [];
    Object.keys(byObj).forEach(function (oid) {
      var o = byObj[oid];
      var score = Math.round((o.correct / o.total) * 100);
      var sp = profiles.find(function (s) { return s.objectiveId === Number(oid); });
      if (sp) { sp.evidence = score; sp.state = statusFor(score); }
      else profiles.push({ id: profiles.length + 1, learnerId: 6, objectiveId: Number(oid), evidence: score, state: statusFor(score), mock: true });
      var ms = mastery.find(function (m) { return m.objectiveId === Number(oid); });
      if (ms) { ms.status = score >= 80 ? 'mastered' : (score >= 50 ? 'in-progress' : 'not-started'); ms.score = score; }
      else mastery.push({ id: mastery.length + 1, learnerId: 6, objectiveId: Number(oid), status: score >= 80 ? 'mastered' : (score >= 50 ? 'in-progress' : 'not-started'), score: score, mock: true });
    });
    Store.set('skillProfiles', profiles);
    Store.set('masteryStates', mastery);
    LR.track('learner.diagnostic_completed', { objectives: Object.keys(byObj).length });
    return masterySummary();
  }

  /* ---------- mastery ---------- */
  function masterySummary() {
    var objs = Store.get('objectives') || [];
    var mastery = Store.get('masteryStates') || [];
    var rows = objs.map(function (o) {
      var m = mastery.find(function (x) { return x.objectiveId === o.id; });
      return { objective: o, score: m ? m.score : null, status: m ? m.status : 'not-started' };
    });
    var scored = rows.filter(function (r) { return r.score !== null; });
    return {
      rows: rows,
      assessed: scored.length,
      total: rows.length,
      mastered: scored.filter(function (r) { return r.status === 'mastered'; }).length,
      pct: scored.length ? Math.round(scored.reduce(function (a, r) { return a + r.score; }, 0) / scored.length) : 0
    };
  }

  function recordPractice(objectiveId, score) {
    var mastery = Store.get('masteryStates') || [];
    var profiles = Store.get('skillProfiles') || [];
    var ms = mastery.find(function (m) { return m.objectiveId === objectiveId; });
    var best = Math.max(score, ms && ms.score !== null ? ms.score : 0);
    if (ms) { ms.score = best; ms.status = best >= 80 ? 'mastered' : (best >= 50 ? 'in-progress' : 'not-started'); }
    else mastery.push({ id: mastery.length + 1, learnerId: 6, objectiveId: objectiveId, status: best >= 80 ? 'mastered' : 'in-progress', score: best, mock: true });
    var sp = profiles.find(function (s) { return s.objectiveId === objectiveId; });
    if (sp) { sp.evidence = best; sp.state = statusFor(best); }
    Store.set('masteryStates', mastery);
    Store.set('skillProfiles', profiles);
    var attempts = Store.get('attempts') || [];
    attempts.push({ id: attempts.length + 1, objectiveId: objectiveId, score: score, ts: new Date().toISOString(), mock: true });
    Store.set('attempts', attempts);
    LR.track('learner.practice', { objectiveId: objectiveId, score: score, best: best });
    return { best: best, mastered: best >= 80 };
  }

  /* ---------- practice rounds (Practice → Feedback → Retry) ---------- */
  // Builds a round from bank questions for one objective. Diagnostic
  // items double as practice in this phase; creator/AI-authored
  // practice items join automatically via the same schema.
  function practiceSet(objectiveId, n) {
    var bank = (Store.get('questions') || []).filter(function (q) {
      return Number(q.objectiveId) === Number(objectiveId) && q.options && q.options.length;
    });
    n = Math.max(1, Math.min(5, parseInt(n, 10) || 3));
    return bank.slice(0, n);
  }
  function gradeRound(objectiveId, answers) {
    // answers: { questionId: chosenIndex } — journals per-question
    // attempts so misconception flags stay truthful.
    var set = practiceSet(objectiveId, 5);
    var journal = Store.get('attempts') || [];
    var correct = 0;
    set.forEach(function (q) {
      if (answers[q.id] === undefined) return;
      var ok = Number(answers[q.id]) === q.answer ? 1 : 0;
      correct += ok;
      journal.push({ id: journal.length + 1, kind: 'practice', questionId: q.id, objectiveId: Number(objectiveId), correct: !!ok, score: ok ? 100 : 0, ts: new Date().toISOString(), mock: true });
    });
    Store.set('attempts', journal);
    var score = set.length ? Math.round((correct / set.length) * 100) : 0;
    return { total: set.length, correct: correct, result: recordPractice(Number(objectiveId), score) };
  }

  /* ---------- AI Tutor chat ---------- */
  function askTutor(input, context) {
    context = context || {};
    return LR.services.AI.complete({
      subject: context.subject || 'Mathematics',
      level: context.level || 'Grade 11',
      objective: context.objective || null,
      input: input
    }).then(function (res) {
      var entry = { input: input, subject: context.subject || 'Mathematics', provider: res.provider, promptVersion: res.promptVersion, safety: res.safety, surface: 'learner-ai-tutor' };
      if (LR.data && LR.data.logAiSession) LR.data.logAiSession(entry);
      return res;
    });
  }

  function escalateToHuman(topic) {
    LR.track('learner.escalate_human', { topic: topic || null });
    location.href = '../browse-tutors.html';
  }

  /* ---------- parent summary ---------- */
  function parentSummary() {
    var s = masterySummary();
    if (!s.assessed) return 'No diagnostic completed yet — complete onboarding to generate the first summary.';
    var weak = s.rows.filter(function (r) { return r.score !== null && r.score < 50; }).map(function (r) { return r.objective.title; });
    return 'This week: ' + s.mastered + ' of ' + s.assessed + ' assessed skills mastered (avg ' + s.pct + '%). ' +
      (weak.length ? 'Focus next: ' + weak.join('; ') + '.' : 'All assessed skills on track — reinforcement practice recommended.');
  }

  /* ---------- UI wiring (progressive: only binds what exists) ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderMastery() {
    var host = el('lr-mastery');
    if (!host) return;
    var s = masterySummary();
    if (!s.assessed) {
      host.innerHTML = '<p class="text-muted">Complete the diagnostic in <a href="#section-onboarding">Getting Started</a> to generate your skill profile.</p>';
      return;
    }
    var bars = { mastered: 'bg-success', 'in-progress': 'bg-primary', 'not-started': 'bg-warning' };
    host.innerHTML = s.rows.map(function (r) {
      var pct = r.score === null ? 0 : r.score;
      return '<div class="progress-card"><div class="d-flex justify-content-between mb-1">' +
        '<span class="text-muted">' + esc(r.objective.code + ' — ' + r.objective.title) + '</span>' +
        '<span class="text-muted fw-bold">' + (r.score === null ? 'not assessed' : r.score + '% · ' + r.status) + '</span></div>' +
        '<div class="progress mb-2" style="height: 7px;"><div class="progress-bar ' + (bars[r.status] || 'bg-info') + '" style="width: ' + pct + '%"></div></div></div>';
    }).join('');
    var ps = el('lr-parent');
    if (ps) ps.textContent = parentSummary();
  }

  function renderDiagnostic() {
    var host = el('lr-dx');
    if (!host || host.dataset.built) return;
    var qs = diagnosticQuestions();
    host.dataset.built = '1';
    host.innerHTML = qs.map(function (q, i) {
      return '<div class="form-group" data-dx-q="' + q.id + '"><label><strong>Q' + (i + 1) + '.</strong> ' + esc(q.prompt) + '</label>' +
        q.options.map(function (op, oi) {
          return '<div class="radio"><label><input type="radio" name="dx-' + q.id + '" value="' + oi + '"> ' + esc(op) + '</label></div>';
        }).join('') + '</div>';
    }).join('');
  }

  function renderMap() {
    var host = el('lr-map');
    if (!host) return;
    var s = masterySummary();
    if (!s.assessed) { host.innerHTML = '<p class="text-muted">Your learning map appears after the diagnostic.</p>'; return; }
    var order = { 'needs-support': 0, 'developing': 1, 'in-progress': 1, 'not-started': 2, 'mastered': 3 };
    var rows = s.rows.slice().sort(function (a, b) { return (order[a.status] == null ? 2 : order[a.status]) - (order[b.status] == null ? 2 : order[b.status]); });
    host.innerHTML = '<ol>' + rows.map(function (r) {
      var next = r.status === 'mastered' ? 'reinforce with mixed practice'
        : r.status === 'not-started' ? 'start with AI Tutor foundations'
        : 'practice weak areas, then retry';
      return '<li><strong>' + esc(r.objective.title) + '</strong> — ' + r.status + '. Next: ' + next + '.</li>';
    }).join('') + '</ol>';
  }

  function bubble(who, text) {
    var box = el('lr-ai-msgs');
    if (!box) return;
    var div = document.createElement('div');
    div.className = 'msg-bubble ' + (who === 'you' ? 'sent' : 'received');
    div.innerHTML = '<p style="margin:0;"></p>';
    div.firstChild.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function bind() {
    var save = el('lr-ob-save');
    if (save) save.addEventListener('click', function () {
      var subs = Array.prototype.slice.call(document.querySelectorAll('input[name="lr-ob-sub"]:checked')).map(function (c) { return c.value; });
      saveProfile({ age: el('lr-ob-age').value, grade: el('lr-ob-grade').value, curriculum: el('lr-ob-curriculum').value, subjects: subs });
      el('lr-ob-status').textContent = 'Profile saved. Now complete the diagnostic below.';
      LR.track('learner.onboarding_profile', {});
    });
    renderDiagnostic();
    var sub = el('lr-dx-submit');
    if (sub) sub.addEventListener('click', function () {
      var answers = {};
      diagnosticQuestions().forEach(function (q) {
        var checked = document.querySelector('input[name="dx-' + q.id + '"]:checked');
        if (checked) answers[q.id] = checked.value;
      });
      var s = gradeDiagnostic(answers);
      el('lr-dx-results').innerHTML = '<p><strong>Diagnostic complete:</strong> ' + s.mastered + ' of ' + s.assessed + ' skills mastered (avg ' + s.pct + '%).</p>';
      renderMap(); renderMastery();
    });
    var send = el('lr-tutor-send');
    if (send) {
      var go = function () {
        var inp = el('lr-tutor-input');
        var q = inp.value.trim();
        if (!q) return;
        bubble('you', q);
        inp.value = '';
        bubble('ai', 'Thinking…');
        askTutor(q, { subject: el('lr-tutor-subject').value }).then(function (res) {
          var box = el('lr-ai-msgs');
          box.removeChild(box.lastChild);
          bubble('ai', res.text);
        });
      };
      send.addEventListener('click', go);
      el('lr-tutor-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    }
    var escBtn = el('lr-escalate');
    if (escBtn) escBtn.addEventListener('click', function () { escalateToHuman(el('lr-tutor-subject').value); });
    var pxObj = el('lr-px-objective');
    if (pxObj) {
      var s = masterySummary();
      pxObj.innerHTML = s.rows.map(function (r) {
        return '<option value="' + r.objective.id + '">' + esc(r.objective.code + ' — ' + r.objective.title) + (r.score === null ? '' : ' (' + r.score + '%)') + '</option>';
      }).join('') || '<option value="">Complete the diagnostic first</option>';
      pxObj.addEventListener('change', renderPractice);
    }
    var pxCheck = el('lr-px-check');
    if (pxCheck) pxCheck.addEventListener('click', gradePracticeUI);
    var pxRetry = el('lr-px-retry');
    if (pxRetry) pxRetry.addEventListener('click', renderPractice);
    renderPractice(); renderMap(); renderMastery();
  }

  function renderPractice() {
    var box = el('lr-px-box');
    var objSel = el('lr-px-objective');
    if (!box || !objSel || !objSel.value) return;
    var set = practiceSet(objSel.value, 3);
    if (!set.length) { box.innerHTML = '<p class="text-muted">No practice items for this skill yet.</p>'; return; }
    box.innerHTML = set.map(function (q, i) {
      return '<div class="form-group" data-px-q="' + q.id + '"><label><strong>Q' + (i + 1) + '.</strong> ' + esc(q.prompt) + '</label>' +
        q.options.map(function (op, oi) {
          return '<div class="radio"><label><input type="radio" name="px-' + q.id + '" value="' + oi + '"> ' + esc(op) + '</label></div>';
        }).join('') + '</div>';
    }).join('');
    el('lr-px-feedback').innerHTML = '';
  }

  function gradePracticeUI() {
    var objSel = el('lr-px-objective');
    if (!objSel || !objSel.value) return;
    var set = practiceSet(objSel.value, 3);
    var answers = {};
    set.forEach(function (q) {
      var checked = document.querySelector('input[name="px-' + q.id + '"]:checked');
      if (checked) answers[q.id] = checked.value;
    });
    if (!Object.keys(answers).length) {
      el('lr-px-feedback').innerHTML = '<p class="text-warning">Answer at least one question first.</p>';
      return;
    }
    var g = gradeRound(objSel.value, answers);
    var line = g.result.mastered
      ? '<p class="text-success"><strong>Mastered!</strong> ' + g.correct + '/' + g.total + ' correct — best ' + g.result.best + '%. Reinforcement practice recommended.</p>'
      : '<p><strong>' + g.correct + '/' + g.total + ' correct.</strong> Best ' + g.result.best + '% — review the misses and hit Retry.</p>';
    var miss = set.filter(function (q) { return answers[q.id] !== undefined && Number(answers[q.id]) !== q.answer; });
    if (miss.length) {
      line += '<ul>' + miss.map(function (q) {
        return '<li>' + esc(q.prompt) + ' → <em>' + esc(q.options[q.answer]) + '</em></li>';
      }).join('') + '</ul>';
    }
    el('lr-px-feedback').innerHTML = line;
    renderMap(); renderMastery();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  LR.learner = {
    ensureSeeds: ensureSeeds, getProfile: getProfile, saveProfile: saveProfile,
    diagnosticQuestions: diagnosticQuestions, gradeDiagnostic: gradeDiagnostic,
    masterySummary: masterySummary, recordPractice: recordPractice,
    practiceSet: practiceSet, gradeRound: gradeRound,
    askTutor: askTutor, escalateToHuman: escalateToHuman, parentSummary: parentSummary
  };
})();
