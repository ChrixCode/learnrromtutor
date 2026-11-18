/* ============================================================
   2tors.ng CREATOR — MVP 2 foundations (Step 7)
   Draft → build (Module → Lesson) → AI-structure review →
   creator approves → submit for review → admin moderates →
   publish. Publishing NEVER activates a course directly:
   new courses enter as 'Pending Review' (invisible in
   discovery until an admin sets Active). Payouts stay
   explicitly stubbed until moderation + payment controls
   are stable (§21).

   Drafts live in 'creatorDrafts' (NOT in 'courses'), so
   unfinished work can never leak into discovery.
   Requires: learnroom.js (LR). lrt-ecosystem.js optional.
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  // Preview identity: matches the signed-in tutor on tutor.html.
  var CREATOR = 'Dr. Mark Wilson';

  function drafts() { return Store.get('creatorDrafts') || []; }
  function saveDrafts(d) { Store.set('creatorDrafts', d); }
  function nextId(list) {
    return list.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1;
  }

  function createDraft(input) {
    input = input || {};
    var issues = [];
    if (!input.title) issues.push('Title is required.');
    if (!input.subject) issues.push('Subject is required.');
    if (issues.length) return { ok: false, issues: issues };
    var d = drafts();
    var draft = {
      id: Date.now(), creator: CREATOR,
      title: input.title, subject: input.subject,
      level: input.level || 'All Levels',
      price: input.free ? 0 : (parseFloat(input.price) || 0),
      description: input.description || '',
      status: 'Draft', modules: [], aiReviewed: false,
      createdAt: new Date().toISOString(), mock: true
    };
    d.push(draft);
    saveDrafts(d);
    LR.track('creator.draft_created', { id: draft.id });
    return { ok: true, draft: draft };
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

  function addModule(draftId, title) {
    var draft = getDraft(draftId);
    if (!draft || !title) return null;
    var m = { id: Date.now(), title: title, lessons: [], aiSuggested: false };
    draft.modules.push(m);
    putDraft(draft);
    LR.track('creator.module_added', { draft: draftId });
    return m;
  }

  function addLesson(draftId, moduleId, input) {
    var draft = getDraft(draftId);
    if (!draft) return null;
    var m = draft.modules.find(function (x) { return x.id === Number(moduleId); });
    if (!m || !input || !input.title) return null;
    var lesson = { title: input.title, kind: input.kind || 'lesson' };
    m.lessons.push(lesson);
    putDraft(draft);
    LR.track('creator.lesson_added', { draft: draftId });
    return lesson;
  }

  // AI packaging preview: mock suggests a 3-module outline for the
  // creator to review. The creator MUST approve before anything is
  // added — AI never publishes (§15).
  function aiSuggestStructure(draftId) {
    var draft = getDraft(draftId);
    if (!draft) return Promise.resolve(null);
    return LR.services.AI.complete({
      subject: draft.subject, level: draft.level,
      objective: draft.title, input: 'Propose a module outline'
    }).then(function (res) {
      var outline = [
        { title: draft.subject + ' Foundations', lessons: ['Key vocabulary & concepts', 'Guided examples', 'Check-for-understanding practice'] },
        { title: 'Core Skills Practice', lessons: ['Worked problems', 'Independent practice set', 'Common mistakes clinic'] },
        { title: 'Mastery Project', lessons: ['Real-world application task', 'Self-assessment rubric', 'Next-steps plan'] }
      ];
      var entry = { draft: draftId, provider: res.provider, promptVersion: res.promptVersion, safety: res.safety, surface: 'creator-ai-review' };
      if (LR.data && LR.data.logAiSession) LR.data.logAiSession(entry);
      LR.track('creator.ai_suggest', { draft: draftId });
      return { text: res.text, outline: outline };
    });
  }

  function approveSuggested(draftId, outline) {
    var draft = getDraft(draftId);
    if (!draft) return false;
    (outline || []).forEach(function (o) {
      draft.modules.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        title: o.title, aiSuggested: true,
        lessons: (o.lessons || []).map(function (t) { return { title: t, kind: 'lesson' }; })
      });
    });
    draft.aiReviewed = true;
    putDraft(draft);
    LR.track('creator.ai_approved', { draft: draftId, modules: (outline || []).length });
    return true;
  }

  function validateDraft(d) {
    var issues = [];
    if (!d) return ['Draft not found.'];
    if (!d.title) issues.push('Missing title.');
    if (!d.modules.length) issues.push('Add at least one module.');
    if (!d.modules.some(function (m) { return m.lessons.length; })) issues.push('Add at least one lesson.');
    return issues;
  }

  // Moderation gate: course enters as 'Pending Review' — hidden
  // from discovery (which only lists Active) until admin approves.
  function submitForReview(draftId) {
    var draft = getDraft(draftId);
    var issues = validateDraft(draft);
    if (issues.length) return { ok: false, issues: issues };
    var courses = Store.get('courses') || [];
    var courseId = courses.reduce(function (m, c) { return Math.max(m, c.id || 0); }, 0) + 1;
    courses.push({
      id: courseId, name: draft.title, tutor: draft.creator,
      students: 0, status: 'Pending Review',
      price: draft.price, duration: '6 weeks',
      category: draft.subject, subject: draft.subject,
      level: draft.level, difficulty: 'Mixed',
      rating: 0, reviews: 0, language: 'English',
      curriculum: 'US Common Core',
      description: draft.description || '',
      objectives: [], mock: true
    });
    Store.set('courses', courses);
    var gMods = Store.get('modules') || [];
    var gLessons = Store.get('lessons') || [];
    var mid = gMods.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
    var lid = gLessons.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
    draft.modules.forEach(function (m, i) {
      mid += 1;
      gMods.push({ id: mid, courseId: courseId, title: m.title, order: i + 1, mock: true });
      m.lessons.forEach(function (l) {
        lid += 1;
        gLessons.push({ id: lid, moduleId: mid, title: l.title, kind: l.kind || 'lesson', mock: true });
      });
    });
    Store.set('modules', gMods);
    Store.set('lessons', gLessons);
    draft.status = 'In Review';
    draft.publishedCourseId = courseId;
    putDraft(draft);
    LR.track('creator.submitted_review', { draft: draftId, course: courseId });
    return { ok: true, courseId: courseId };
  }

  function myContent() {
    var courses = Store.get('courses') || [];
    return {
      drafts: drafts(),
      published: courses.filter(function (c) { return c.tutor === CREATOR; })
    };
  }

  // Revenue: settled payouts + pending orders joined through courses.
  // Payout ACTIONS stay disabled (moderation + payments not stable).
  function revenue() {
    var payouts = (Store.get('payouts') || []).filter(function (p) { return p.tutor === CREATOR; });
    var courses = Store.get('courses') || [];
    var mine = {};
    courses.forEach(function (c) { if (c.tutor === CREATOR) mine[c.id] = c; });
    var orders = (Store.get('orders') || []).filter(function (o) { return mine[o.courseId]; });
    var settled = payouts.filter(function (p) { return p.status === 'Completed'; })
      .reduce(function (a, p) { return a + (p.amount || 0); }, 0);
    var pending = payouts.filter(function (p) { return p.status !== 'Completed'; })
      .reduce(function (a, p) { return a + (p.amount || 0); }, 0);
    return { payouts: payouts, orders: orders, settled: settled, pending: pending, payoutsEnabled: false };
  }

  /* ---------- UI wiring ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function badge(status) {
    var cls = status === 'Active' ? 'status-active' : (status === 'Pending Review' || status === 'In Review' ? 'status-pending' : 'status-scheduled');
    return '<span class="status-badge ' + cls + '">' + esc(status) + '</span>';
  }

  function renderContent() {
    var host = el('lr-cr-table');
    if (!host) return;
    var c = myContent();
    var rows = c.drafts.map(function (d) {
      return '<tr><td>' + esc(d.title) + '</td><td>Course draft</td><td>' + badge(d.status) + '</td><td>' + d.modules.length + ' modules</td></tr>';
    }).join('') + c.published.map(function (p) {
      return '<tr><td>' + esc(p.name) + '</td><td>Course</td><td>' + badge(p.status) + '</td><td>' + (p.students || 0) + ' learners</td></tr>';
    }).join('');
    host.innerHTML = rows || '<tr><td colspan="4" class="text-muted">No content yet — create your first draft.</td></tr>';
    var sel = el('lr-cr-draft');
    if (sel) {
      var cur = sel.value;
      sel.innerHTML = c.drafts.map(function (d) {
        return '<option value="' + d.id + '">' + esc(d.title) + ' (' + d.status + ')</option>';
      }).join('') || '<option value="">No drafts yet</option>';
      if (cur) sel.value = cur;
      renderBuilder();
    }
  }

  function renderBuilder() {
    var host = el('lr-cr-modules');
    if (!host) return;
    var sel = el('lr-cr-draft');
    var draft = sel && sel.value ? getDraft(sel.value) : null;
    var lsel = el('lr-cr-lesson-mod');
    if (!draft) {
      host.innerHTML = '<p class="text-muted">Select a draft to manage its modules and lessons.</p>';
      if (lsel) lsel.innerHTML = '<option value="">—</option>';
      return;
    }
    host.innerHTML = draft.modules.map(function (m) {
      var ls = m.lessons.length ? '<ul>' + m.lessons.map(function (l) {
        return '<li>' + esc(l.title) + ' <em class="text-muted">(' + esc(l.kind) + ')</em></li>';
      }).join('') + '</ul>' : '<p class="text-muted">No lessons yet.</p>';
      return '<div style="border:1px solid #f0f0f0;border-radius:5px;padding:12px;margin-bottom:10px;"><strong>' + esc(m.title) + '</strong>' +
        (m.aiSuggested ? ' <span class="lr-badge-soon">AI-assisted</span>' : '') + ls + '</div>';
    }).join('') || '<p class="text-muted">No modules yet — add one above or use AI Structuring.</p>';
    if (lsel) lsel.innerHTML = draft.modules.map(function (m) {
      return '<option value="' + m.id + '">' + esc(m.title) + '</option>';
    }).join('');
    var check = el('lr-cr-check');
    if (check) {
      var issues = validateDraft(draft);
      check.innerHTML = issues.length
        ? '<p class="text-warning">Before submitting: ' + issues.map(esc).join(' ') + '</p>'
        : '<p class="text-success">Ready for review — an admin must approve before learners can see it.</p>';
    }
  }

  function renderRevenue() {
    var host = el('lr-cr-revenue');
    if (!host) return;
    var r = revenue();
    host.innerHTML = '<p><strong>Settled payouts:</strong> $' + r.settled.toFixed(2) + ' · <strong>Awaiting approval:</strong> $' + r.pending.toFixed(2) + '</p>' +
      '<p><strong>Pending enrollments on your courses:</strong> ' + r.orders.length + '</p>' +
      (r.payouts.length ? '<table class="table table-head-bg-success table-striped table-hover"><thead><tr><th>ID</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
        r.payouts.map(function (p) {
          return '<tr><td>#' + esc(p.id) + '</td><td>$' + Number(p.amount || 0).toFixed(2) + '</td><td>' + badge(p.status) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="text-muted">No payouts recorded yet.</p>') +
      '<p class="text-muted"><i class="la la-lock"></i> Withdrawals unlock after content moderation and payment controls stabilize (MVP 2).</p>';
  }

  function bind() {
    var create = el('lr-cr-create');
    if (create) create.addEventListener('click', function () {
      var res = createDraft({
        title: el('lr-cr-title').value.trim(),
        subject: el('lr-cr-subject').value,
        level: el('lr-cr-level').value,
        price: el('lr-cr-price').value,
        free: el('lr-cr-free').checked,
        description: el('lr-cr-desc').value.trim()
      });
      var note = el('lr-cr-note');
      if (!res.ok) { note.innerHTML = '<p class="text-danger">' + res.issues.map(esc).join(' ') + '</p>'; return; }
      el('lr-cr-title').value = ''; el('lr-cr-desc').value = ''; el('lr-cr-price').value = '';
      note.innerHTML = '<p class="text-success">Draft created. Build its modules below.</p>';
      renderContent();
    });
    var sel = el('lr-cr-draft');
    if (sel) sel.addEventListener('change', renderBuilder);
    var madd = el('lr-cr-mod-add');
    if (madd) madd.addEventListener('click', function () {
      if (sel.value && el('lr-cr-mod-title').value.trim()) {
        addModule(sel.value, el('lr-cr-mod-title').value.trim());
        el('lr-cr-mod-title').value = '';
        renderBuilder();
      }
    });
    var ladd = el('lr-cr-lesson-add');
    if (ladd) ladd.addEventListener('click', function () {
      var lsel = el('lr-cr-lesson-mod');
      if (sel.value && lsel.value && el('lr-cr-lesson-title').value.trim()) {
        addLesson(sel.value, lsel.value, { title: el('lr-cr-lesson-title').value.trim(), kind: el('lr-cr-lesson-kind').value });
        el('lr-cr-lesson-title').value = '';
        renderBuilder();
      }
    });
    var ai = el('lr-cr-ai');
    if (ai) ai.addEventListener('click', function () {
      if (!sel.value) return;
      el('lr-cr-ai-out').innerHTML = '<p class="text-muted">Drafting an outline…</p>';
      aiSuggestStructure(sel.value).then(function (res) {
        if (!res) return;
        window._lrAiOutline = res.outline;
        el('lr-cr-ai-out').innerHTML = '<p class="text-muted">' + esc(res.text) + '</p><ol>' +
          res.outline.map(function (o) { return '<li><strong>' + esc(o.title) + '</strong>: ' + o.lessons.map(esc).join('; ') + '</li>'; }).join('') +
          '</ol><button id="lr-cr-ai-approve" class="btn btn-success btn-sm">Review & Approve Outline</button> ' +
          '<span class="text-muted">Nothing is added until you approve.</span>';
        document.getElementById('lr-cr-ai-approve').addEventListener('click', function () {
          approveSuggested(sel.value, window._lrAiOutline);
          el('lr-cr-ai-out').innerHTML = '<p class="text-success">Outline added as AI-assisted modules. Edit them above before submitting.</p>';
          renderBuilder();
        });
      });
    });
    var pub = el('lr-cr-publish');
    if (pub) pub.addEventListener('click', function () {
      if (!sel.value) return;
      var res = submitForReview(sel.value);
      var check = el('lr-cr-check');
      if (!res.ok) { check.innerHTML = '<p class="text-danger">' + res.issues.map(esc).join(' ') + '</p>'; return; }
      check.innerHTML = '<p class="text-success">Submitted for admin review. It stays hidden from learners until approved.</p>';
      renderContent(); renderRevenue();
    });
    renderContent(); renderRevenue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  LR.creator = {
    drafts: drafts, createDraft: createDraft, getDraft: getDraft,
    addModule: addModule, addLesson: addLesson,
    aiSuggestStructure: aiSuggestStructure, approveSuggested: approveSuggested,
    validateDraft: validateDraft, submitForReview: submitForReview,
    myContent: myContent, revenue: revenue
  };
})();
