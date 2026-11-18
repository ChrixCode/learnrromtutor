/* ============================================================
   2tors.ng ANALYTICS — §24 readiness (Step 10)
   1. Canonical event catalog: every LR.track call in the
      platform must use a listed event with its required
      payload fields. Unknown events / missing fields raise a
      console warning (never break the UI).
   2. LR.metrics: cross-role metric library computed from the
      SAME Store collections every engine shares, so learner,
      tutor, and admin numbers can never disagree.
   Load immediately after learnroom.js.
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.track || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  var CATALOG = {
    'lr_page_view': ['title'],
    'lr_shell_render': ['role'],
    'auth.sign_in': [], 'auth.sign_out': [],
    'ai.complete': ['provider', 'promptVersion'],
    'ai.preview': ['provider', 'promptVersion'],
    'courses.search': ['results'],
    'courses.view': ['id'],
    'courses.enroll_click': ['id'], 'courses.enroll': ['id'],
    'learner.profile_saved': [], 'learner.onboarding_profile': [],
    'learner.diagnostic_completed': ['objectives'],
    'learner.practice': ['objectiveId', 'score'],
    'learner.escalate_human': [],
    'creator.draft_created': ['id'], 'creator.module_added': ['draft'],
    'creator.lesson_added': ['draft'], 'creator.ai_suggest': ['draft'],
    'creator.ai_approved': ['draft'], 'creator.submitted_review': ['draft'],
    'copilot.lesson_generated': ['id'], 'copilot.differentiated': ['id'],
    'copilot.assessment_generated': ['id'], 'copilot.approved': ['id'],
    'copilot.assigned': ['id'],
    'school.saved': ['name'], 'school.class_added': ['id'],
    'school.roster_assigned': ['user'], 'school.exported': [],
    'admin.course_approved': ['id']
  };

  // Event-log viewer: surfaces the local analytics queue in admin
  // Reports so the taxonomy is inspectable before any backend exists.
  function renderEventLog() {
    var host = document.getElementById('lr-events');
    if (!host) return;
    var q = [];
    try { q = JSON.parse(localStorage.getItem('lrt_analytics') || '[]'); } catch (e) {}
    var last = q.slice(-20).reverse();
    host.innerHTML = last.length
      ? '<table class="table table-head-bg-success table-striped table-hover"><thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead><tbody>' +
        last.map(function (e) {
          return '<tr><td>' + String(e.ts).slice(11, 19) + '</td><td>' + String(e.event) + '</td><td class="text-muted">' + String(JSON.stringify(e.payload)).slice(0, 80) + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="text-muted">No events tracked yet in this browser — use the platform and return.</p>';
  }

  var rawTrack = LR.track;
  LR.track = function (event, payload) {
    payload = payload || {};
    if (!CATALOG.hasOwnProperty(event)) {
      if (window.console && console.warn) console.warn('[LR.analytics] unknown event (add to catalog): ' + event);
    } else {
      CATALOG[event].forEach(function (field) {
        if (payload[field] === undefined && window.console && console.warn) {
          console.warn('[LR.analytics] event "' + event + '" missing field "' + field + '"');
        }
      });
    }
    return rawTrack(event, payload);
  };
  LR.Analytics = { catalog: Object.keys(CATALOG) };

  /* ---------- shared metrics (one computation, all roles) ---------- */
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

  LR.metrics = {
    learning: function () {
      var mastery = Store.get('masteryStates') || [];
      var scored = mastery.filter(function (m) { return m.score !== null && m.score !== undefined; });
      var attempts = (Store.get('attempts') || []).filter(function (a) { return a.kind !== 'diagnostic'; });
      var strong = attempts.filter(function (a) { return num(a.score) >= 80; }).length;
      return {
        assessed: scored.length,
        mastered: scored.filter(function (m) { return m.status === 'mastered'; }).length,
        avg: scored.length ? Math.round(scored.reduce(function (a, m) { return a + num(m.score); }, 0) / scored.length) : null,
        retrySuccess: attempts.length ? Math.round((strong / attempts.length) * 100) : null
      };
    },
    engagement: function () {
      var bookings = Store.get('bookings') || [];
      var users = Store.get('users') || [];
      var learners = users.filter(function (u) { return u.role === 'Student'; }).length || 1;
      var done = bookings.filter(function (b) { return b.status === 'Completed'; }).length;
      return { sessions: done, perLearner: Math.round((done / learners) * 10) / 10, bookings: bookings.length };
    },
    marketplace: function () {
      var courses = Store.get('courses') || [];
      var payments = Store.get('payments') || [];
      var creators = {};
      courses.forEach(function (c) { if (c.tutor) creators[c.tutor] = true; });
      return {
        published: courses.filter(function (c) { return c.status === 'Active'; }).length,
        pendingReview: courses.filter(function (c) { return c.status === 'Pending Review'; }).length,
        creators: Object.keys(creators).length,
        gmv: payments.filter(function (p) { return p.status === 'Completed'; }).reduce(function (a, p) { return a + num(p.amount); }, 0)
      };
    },
    teacher: function () {
      var drafts = Store.get('copilotDrafts') || [];
      return {
        generated: drafts.length,
        approved: drafts.filter(function (d) { return d.status === 'Approved' || d.status === 'Assigned'; }).length,
        assigned: drafts.filter(function (d) { return d.status === 'Assigned'; }).length
      };
    },
    schools: function () {
      if (LR.school && LR.school.cohort) return LR.school.cohort();
      return { students: 0, classes: 0, completion: 0, avgMastery: null };
    }
  };

  function card(value, label, color) {
    return '<div class="col-md-3"><div class="card card-stats card-' + color + '"><div class="card-body"><div class="numbers"><h4>' +
      value + '</h4><p class="card-category">' + label + '</p></div></div><div class="card-footer"><hr></div></div></div>';
  }

  function renderAdminMetrics() {
    var host = document.getElementById('lr-metrics');
    if (!host) return;
    var L = LR.metrics.learning(), M = LR.metrics.marketplace(), T = LR.metrics.teacher();
    host.innerHTML =
      card(M.published + ' active / ' + M.pendingReview + ' in review', 'Courses (live)', 'primary') +
      card(L.assessed ? Math.round((L.mastered / L.assessed) * 100) + '% mastered' : '—', 'Skills mastery (live)', 'success') +
      card(M.creators + ' creators · $' + Math.round(M.gmv).toLocaleString(), 'Marketplace GMV (live)', 'warning') +
      card(T.generated + ' drafts · ' + T.approved + ' approved', 'Copilot output (live)', 'info');
  }

  function boot() {
    renderAdminMetrics();
    renderEventLog();
    var clear = document.getElementById('lr-events-clear');
    if (clear) clear.addEventListener('click', function () {
      try { localStorage.setItem('lrt_analytics', '[]'); } catch (e) {}
      renderEventLog();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
