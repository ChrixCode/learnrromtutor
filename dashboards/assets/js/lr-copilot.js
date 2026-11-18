/* ============================================================
   2tors.ng TEACHER COPILOT — MVP 3 foundations (Step 8)
   Generate → teacher edits → teacher approves → assign.
   NOTHING reaches learners without explicit approval (§15):
   drafts start as 'Draft'; only 'Approved' drafts can be
   'Assigned'. Suggestions are suggestions — the teacher
   remains responsible for final decisions (§6).

   Insights read REAL Store data (masteryStates, diagnostic +
   practice attempts): weak objectives, per-question miss
   rates (misconception flags), and template intervention
   suggestions. With no data, panels say so honestly.
   Requires: learnroom.js (LR).
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  function drafts() { return Store.get('copilotDrafts') || []; }
  function saveDrafts(d) { Store.set('copilotDrafts', d); }

  function generateLesson(input) {
    input = input || {};
    if (!input.topic) return Promise.resolve({ ok: false, issue: 'Topic is required.' });
    return LR.services.AI.complete({
      subject: input.subject || 'Mathematics',
      level: input.grade || 'Grade 11',
      objective: input.topic, input: 'Draft a lesson plan'
    }).then(function (res) {
      var d = drafts();
      var draft = {
        id: Date.now(), type: 'lesson',
        subject: input.subject || 'Mathematics',
        grade: input.grade || 'Grade 11', topic: input.topic,
        status: 'Draft',
        content: {
          objectives: ['Recall prior knowledge for ' + input.topic, 'Explain ' + input.topic + ' in own words', 'Apply ' + input.topic + ' to new problems'],
          explanation: res.text,
          activities: ['5-minute retrieval starter', 'Worked example + think-aloud', 'Pair practice with answer check']
        },
        variants: null, assessment: null,
        provider: res.provider, promptVersion: res.promptVersion,
        createdAt: new Date().toISOString(), mock: true
      };
      d.push(draft);
      saveDrafts(d);
      if (LR.data && LR.data.logAiSession) LR.data.logAiSession({ surface: 'copilot-lesson', provider: res.provider, promptVersion: res.promptVersion, safety: res.safety });
      LR.track('copilot.lesson_generated', { id: draft.id });
      return { ok: true, draft: draft };
    });
  }

  function getDraft(id) {
    return drafts().find(function (d) { return d.id === Number(id); }) || null;
  }
  function putDraft(draft) {
    var d = drafts();
    var i = d.findIndex(function (x) { return x.id === draft.id; });
    if (i >= 0) d[i] = draft; else d.push(draft);
    saveDrafts(d);
  }

  // Three-level differentiation, derived from the approved draft so
  // variants never drift from what the teacher reviewed.
  function differentiate(draftId) {
    var draft = getDraft(draftId);
    if (!draft) return null;
    draft.variants = {
      foundational: { label: 'Foundational', steps: ['Vocabulary pre-teach with visuals', 'One worked example, heavily scaffolded', '3 low-floor practice items with immediate feedback'] },
      intermediate: { label: 'Intermediate', steps: (draft.content.activities || []).slice() },
      advanced: { label: 'Advanced', steps: ['Non-routine extension problem', 'Explain reasoning in writing', 'Create a problem for a peer'] }
    };
    putDraft(draft);
    LR.track('copilot.differentiated', { id: draftId });
    return draft.variants;
  }

  // Assessment: prefer real bank questions for the subject, top up
  // with clearly-flagged mock items when the bank runs short.
  function generateAssessment(draftId, count) {
    var draft = getDraft(draftId);
    if (!draft) return { ok: false, issue: 'Draft not found.' };
    count = Math.max(1, Math.min(10, parseInt(count, 10) || 5));
    var bank = (Store.get('questions') || []).filter(function (q) {
      return (q.options && q.options.length);
    });
    var items = bank.slice(0, count).map(function (q) {
      return { prompt: q.prompt, options: q.options, answer: q.answer, key: q.options[q.answer], bankId: q.id, mock: !!q.mock };
    });
    while (items.length < count) {
      items.push({ prompt: 'Explain ' + draft.topic + ' in your own words (part ' + (items.length + 1) + ').', options: null, answer: null, key: 'Accept any accurate explanation; see rubric.', bankId: null, mock: true });
    }
    draft.assessment = {
      items: items,
      rubric: ['Accuracy of method (40%)', 'Correct final answer (30%)', 'Clarity of working/explanation (30%)'],
      status: 'Draft'
    };
    putDraft(draft);
    LR.track('copilot.assessment_generated', { id: draftId, items: items.length });
    return { ok: true, assessment: draft.assessment };
  }

  // The approve gate: edits are saved with approval; assignment
  // is refused for anything not Approved.
  function approveDraft(draftId, note) {
    var draft = getDraft(draftId);
    if (!draft) return false;
    draft.status = 'Approved';
    draft.approvalNote = note || '';
    draft.approvedAt = new Date().toISOString();
    putDraft(draft);
    LR.track('copilot.approved', { id: draftId });
    return true;
  }
  function assignDraft(draftId, className) {
    var draft = getDraft(draftId);
    if (!draft) return { ok: false, issue: 'Draft not found.' };
    if (draft.status !== 'Approved') return { ok: false, issue: 'Approve the draft before assigning — unapproved content cannot reach learners.' };
    draft.status = 'Assigned';
    draft.assignedTo = className || 'My Class';
    putDraft(draft);
    var assigns = Store.get('assignments') || [];
    assigns.push({ id: assigns.length + 1, title: draft.topic, class: draft.assignedTo, status: 'Assigned', ts: new Date().toISOString(), mock: true });
    Store.set('assignments', assigns);
    LR.track('copilot.assigned', { id: draftId });
    return { ok: true };
  }

  /* ---------- classroom intelligence (real data) ---------- */
  function insights() {
    var mastery = Store.get('masteryStates') || [];
    var objectives = Store.get('objectives') || [];
    var attempts = Store.get('attempts') || [];
    var questions = Store.get('questions') || [];
    var weak = mastery.filter(function (m) { return m.score !== null && m.score < 50; }).map(function (m) {
      var o = objectives.find(function (x) { return x.id === m.objectiveId; });
      return { objectiveId: m.objectiveId, title: o ? o.title : ('Objective ' + m.objectiveId), score: m.score };
    });
    // Misconception flags: per-question miss rate from journaled attempts.
    var byQ = {};
    attempts.forEach(function (a) {
      if (a.questionId === undefined || a.correct === undefined) return;
      byQ[a.questionId] = byQ[a.questionId] || { miss: 0, total: 0 };
      byQ[a.questionId].total += 1;
      if (!a.correct) byQ[a.questionId].miss += 1;
    });
    var flags = Object.keys(byQ).filter(function (qid) {
      var s = byQ[qid];
      return s.total >= 1 && (s.miss / s.total) >= 0.5;
    }).map(function (qid) {
      var q = questions.find(function (x) { return String(x.id) === String(qid); });
      var s = byQ[qid];
      return { questionId: Number(qid), prompt: q ? q.prompt : 'Question ' + qid, missRate: Math.round((s.miss / s.total) * 100), n: s.total };
    });
    var interventions = weak.map(function (w) {
      return { objectiveId: w.objectiveId, suggestion: 'Reteach "' + w.title + '" with a worked example, then assign 5 targeted practice items and retry the check.' };
    });
    return { weak: weak, flags: flags, interventions: interventions, assessed: mastery.filter(function (m) { return m.score !== null; }).length };
  }

  /* ---------- UI wiring ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var currentId = null;

  function refreshDraftSelect() {
    var sel = el('lr-cp-draft');
    if (!sel) return;
    var cur = sel.value || currentId;
    sel.innerHTML = drafts().map(function (d) {
      return '<option value="' + d.id + '">' + esc(d.topic) + ' [' + d.status + ']</option>';
    }).join('') || '<option value="">No drafts yet</option>';
    if (cur) sel.value = cur;
    currentId = sel.value || null;
    renderDraft();
  }

  function renderDraft() {
    var host = el('lr-cp-draft-view');
    if (!host) return;
    var d = currentId ? getDraft(currentId) : null;
    if (!d) { host.innerHTML = '<p class="text-muted">Generate a lesson to begin. Review everything before approving.</p>'; return; }
    host.innerHTML = '<p><strong>' + esc(d.topic) + '</strong> · ' + esc(d.subject) + ' · ' + esc(d.grade) +
      ' · <span class="status-badge ' + (d.status === 'Approved' ? 'status-active' : (d.status === 'Assigned' ? 'status-completed' : 'status-pending')) + '">' + d.status + '</span></p>' +
      '<p><strong>Objectives:</strong></p><ul>' + d.content.objectives.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' +
      '<p><strong>Activities:</strong></p><ul>' + d.content.activities.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
      '<p class="text-muted">Model: mock · prompt ' + esc(d.promptVersion || 'v0-phase0') + ' · teacher review required.</p>';
  }

  function renderVariants() {
    var host = el('lr-cp-variants');
    if (!host) return;
    var d = currentId ? getDraft(currentId) : null;
    if (!d || !d.variants) { host.innerHTML = '<p class="text-muted">Differentiation appears here after you generate it.</p>'; return; }
    host.innerHTML = ['foundational', 'intermediate', 'advanced'].map(function (k) {
      var v = d.variants[k];
      return '<div class="col-md-4"><div style="border:1px solid #f0f0f0;border-radius:5px;padding:12px;"><strong>' + v.label + '</strong><ul>' +
        v.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div></div>';
    }).join('');
  }

  function renderAssessment() {
    var host = el('lr-cp-assess');
    if (!host) return;
    var d = currentId ? getDraft(currentId) : null;
    if (!d || !d.assessment) { host.innerHTML = '<p class="text-muted">Generate an assessment for the selected draft.</p>'; return; }
    host.innerHTML = '<ol>' + d.assessment.items.map(function (it) {
      return '<li>' + esc(it.prompt) + (it.mock ? ' <span class="lr-badge-soon">Mock</span>' : '') +
        '<br><em class="text-muted">Key: ' + esc(it.key) + '</em></li>';
    }).join('') + '</ol><p><strong>Rubric:</strong> ' + d.assessment.rubric.map(esc).join(' · ') + '</p>';
  }

  function renderInsights() {
    var host = el('lr-cp-insights');
    if (!host) return;
    var ins = insights();
    if (!ins.assessed) {
      host.innerHTML = '<p class="text-muted">No learning data yet — insights appear once learners complete diagnostics or practice.</p>';
      return;
    }
    host.innerHTML =
      '<p><strong>Weak areas (' + ins.weak.length + '):</strong> ' + (ins.weak.map(function (w) { return esc(w.title) + ' (' + w.score + '%)'; }).join('; ') || 'none') + '</p>' +
      '<p><strong>Misconception flags (' + ins.flags.length + '):</strong> ' + (ins.flags.map(function (f) { return esc(f.prompt) + ' — missed by ' + f.missRate + '% (n=' + f.n + ')'; }).join('; ') || 'none') + '</p>' +
      '<p><strong>Suggested interventions:</strong></p><ul>' + (ins.interventions.map(function (i) { return '<li>' + esc(i.suggestion) + '</li>'; }).join('') || '<li>None needed — reinforce mastered skills.</li>') + '</ul>';
  }

  function bind() {
    var gen = el('lr-cp-generate');
    if (gen) gen.addEventListener('click', function () {
      el('lr-cp-draft-view').innerHTML = '<p class="text-muted">Drafting…</p>';
      generateLesson({ subject: el('lr-cp-subject').value, grade: el('lr-cp-grade').value, topic: el('lr-cp-topic').value.trim() }).then(function (res) {
        if (!res.ok) { el('lr-cp-draft-view').innerHTML = '<p class="text-danger">' + esc(res.issue) + '</p>'; return; }
        currentId = res.draft.id;
        refreshDraftSelect(); renderVariants(); renderAssessment();
      });
    });
    var sel = el('lr-cp-draft');
    if (sel) sel.addEventListener('change', function () { currentId = sel.value; renderDraft(); renderVariants(); renderAssessment(); });
    var diff = el('lr-cp-differentiate');
    if (diff) diff.addEventListener('click', function () { if (currentId && differentiate(currentId)) renderVariants(); });
    var agen = el('lr-cp-assess-go');
    if (agen) agen.addEventListener('click', function () {
      if (!currentId) return;
      var res = generateAssessment(currentId, el('lr-cp-count').value);
      var msg = el('lr-cp-assess-msg');
      if (!res.ok && msg) msg.textContent = res.issue;
      renderAssessment();
    });
    var app = el('lr-cp-approve');
    if (app) app.addEventListener('click', function () {
      if (!currentId) return;
      approveDraft(currentId, el('lr-cp-note').value);
      el('lr-cp-status').innerHTML = '<p class="text-success">Approved. You may now assign it — nothing went to learners before this click.</p>';
      refreshDraftSelect();
    });
    var assign = el('lr-cp-assign');
    if (assign) assign.addEventListener('click', function () {
      if (!currentId) return;
      var res = assignDraft(currentId, el('lr-cp-class').value);
      el('lr-cp-status').innerHTML = res.ok
        ? '<p class="text-success">Assigned to ' + esc(el('lr-cp-class').value || 'My Class') + '.</p>'
        : '<p class="text-danger">' + esc(res.issue) + '</p>';
      refreshDraftSelect();
    });
    refreshDraftSelect(); renderInsights();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  LR.copilot = {
    generateLesson: generateLesson, getDraft: getDraft, differentiate: differentiate,
    generateAssessment: generateAssessment, approveDraft: approveDraft,
    assignDraft: assignDraft, insights: insights
  };
})();
