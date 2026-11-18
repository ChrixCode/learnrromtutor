/* ============================================================
   2tors.ng SCHOOLS — MVP 4 foundations (Step 8)
   Single-tenant preview of the school SaaS model: school
   profile → academic year → classes → roster → cohort
   analytics → audit preview. Multi-tenancy, parent portal,
   and exports are stubbed honestly as later phases.

   Class rosters reference existing users additively
   (user.classIds); nothing else about a user is rewritten.
   Requires: learnroom.js (LR).
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  function schools() { return Store.get('schools') || []; }
  function saveSchools(s) { Store.set('schools', s); }
  function classes() { return Store.get('classes') || []; }
  function saveClasses(c) { Store.set('classes', c); }

  function getSchool() {
    var s = schools();
    return s.length ? s[0] : null;
  }
  function saveSchool(input) {
    input = input || {};
    if (!input.name) return { ok: false, issue: 'School name is required.' };
    var rec = {
      id: 1, name: input.name,
      curriculum: input.curriculum || 'US Common Core',
      academicYear: input.year || '2026/27', plan: 'preview',
      createdAt: new Date().toISOString(), mock: true
    };
    saveSchools([rec]);
    LR.track('school.saved', { name: rec.name });
    return { ok: true, school: rec };
  }

  function addClass(input) {
    input = input || {};
    if (!input.name) return null;
    var c = classes();
    var rec = {
      id: c.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1,
      schoolId: 1, name: input.name,
      subject: input.subject || 'General',
      teacher: input.teacher || 'Unassigned', mock: true
    };
    c.push(rec);
    saveClasses(c);
    LR.track('school.class_added', { id: rec.id });
    return rec;
  }

  function roster(classId) {
    var users = Store.get('users') || [];
    return users.filter(function (u) {
      return u.role === 'Student' && (u.classIds || []).indexOf(Number(classId)) >= 0;
    });
  }
  function assignToClass(userId, classId) {
    var users = Store.get('users') || [];
    var u = users.find(function (x) { return x.id === Number(userId); });
    if (!u) return false;
    u.classIds = u.classIds || [];
    if (u.classIds.indexOf(Number(classId)) < 0) u.classIds.push(Number(classId));
    Store.set('users', users);
    LR.track('school.roster_assigned', { user: userId, class: classId });
    return true;
  }

  // Cohort analytics from REAL data: users, bookings, mastery,
  // activity logs. Empty states when there is nothing to measure.
  function cohort() {
    var users = Store.get('users') || [];
    var students = users.filter(function (u) { return u.role === 'Student'; });
    var bookings = Store.get('bookings') || [];
    var done = bookings.filter(function (b) { return b.status === 'Completed'; }).length;
    var mastery = Store.get('masteryStates') || [];
    var scored = mastery.filter(function (m) { return m.score !== null; });
    var logs = Store.get('activityLogs') || [];
    return {
      students: students.length,
      classes: classes().length,
      completion: bookings.length ? Math.round((done / bookings.length) * 100) : 0,
      avgMastery: scored.length ? Math.round(scored.reduce(function (a, m) { return a + m.score; }, 0) / scored.length) : null,
      teacherActivity: logs.length,
      interventions: mastery.filter(function (m) { return m.score !== null && m.score < 50; }).length
    };
  }

  // Real CSV export of cohort + mastery (works today, no backend).
  function exportCSV() {
    var c = cohort();
    var mastery = Store.get('masteryStates') || [];
    var objectives = Store.get('objectives') || [];
    var lines = ['metric,value', 'students,' + c.students, 'classes,' + c.classes,
      'completion_pct,' + c.completion, 'avg_mastery,' + (c.avgMastery === null ? '' : c.avgMastery),
      'interventions,' + c.interventions, '', 'objective,score,status'];
    mastery.forEach(function (m) {
      var o = objectives.find(function (x) { return x.id === m.objectiveId; });
      lines.push('"' + (o ? o.title : ('Objective ' + m.objectiveId)) + '",' + (m.score === null ? '' : m.score) + ',' + m.status);
    });
    return lines.join('\n');
  }
  function downloadCSV() {
    var blob = new Blob([exportCSV()], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'learnroom-cohort.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    LR.track('school.exported', {});
  }

  /* ---------- UI wiring ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderCohort() {
    var host = el('lr-sc-cohort');
    if (!host) return;
    var c = cohort();
    host.innerHTML =
      '<div class="col-md-3"><div class="card card-stats card-primary"><div class="card-body"><div class="numbers"><h4>' + c.students + '</h4><p class="card-category">Students</p></div></div></div></div>' +
      '<div class="col-md-3"><div class="card card-stats card-success"><div class="card-body"><div class="numbers"><h4>' + c.classes + '</h4><p class="card-category">Classes</p></div></div></div></div>' +
      '<div class="col-md-3"><div class="card card-stats card-warning"><div class="card-body"><div class="numbers"><h4>' + c.completion + '%</h4><p class="card-category">Completion</p></div></div></div></div>' +
      '<div class="col-md-3"><div class="card card-stats card-info"><div class="card-body"><div class="numbers"><h4>' + (c.avgMastery === null ? '—' : c.avgMastery + '%') + '</h4><p class="card-category">Avg Mastery</p></div></div></div></div>';
    var extra = el('lr-sc-extra');
    if (extra) extra.innerHTML = '<p class="text-muted">Teacher activity events: ' + c.teacherActivity + ' · Learners needing intervention: ' + c.interventions + '. Parent portal, role permissions, and CSV exports arrive in MVP 4.</p>';
  }

  function renderClasses() {
    var host = el('lr-sc-classes');
    if (!host) return;
    var c = classes();
    host.innerHTML = c.map(function (k) {
      return '<tr><td>' + esc(k.name) + '</td><td>' + esc(k.subject) + '</td><td>' + esc(k.teacher) + '</td><td>' + roster(k.id).length + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="text-muted">No classes yet — add the first one.</td></tr>';
  }

  function bind() {
    var save = el('lr-sc-save');
    if (save) save.addEventListener('click', function () {
      var res = saveSchool({ name: el('lr-sc-name').value.trim(), curriculum: el('lr-sc-curriculum').value, year: el('lr-sc-year').value });
      el('lr-sc-status').textContent = res.ok ? 'School profile saved (single-tenant preview).' : res.issue;
      renderCohort();
    });
    var add = el('lr-sc-add-class');
    if (add) add.addEventListener('click', function () {
      if (!getSchool()) { el('lr-sc-status').textContent = 'Save the school profile first.'; return; }
      if (el('lr-sc-class-name').value.trim()) {
        addClass({ name: el('lr-sc-class-name').value.trim(), subject: el('lr-sc-class-subject').value, teacher: el('lr-sc-class-teacher').value });
        el('lr-sc-class-name').value = '';
        renderClasses(); renderCohort();
      }
    });
    var s = getSchool();
    if (s) {
      if (el('lr-sc-name')) el('lr-sc-name').value = s.name;
      if (el('lr-sc-status')) el('lr-sc-status').textContent = 'Loaded: ' + s.name + ' · ' + s.academicYear + '.';
    }
    renderRosterControls();
    var radd = el('lr-sc-roster-add');
    if (radd) radd.addEventListener('click', function () {
      var u = el('lr-sc-learner').value, k = el('lr-sc-roster-class').value;
      if (u && k && assignToClass(u, k)) {
        el('lr-sc-roster-status').textContent = 'Learner assigned to class.';
        renderClasses(); renderCohort(); renderRosterControls();
      }
    });
    var exp = el('lr-sc-export');
    if (exp) exp.addEventListener('click', downloadCSV);
    renderClasses(); renderCohort();
  }

  function renderRosterControls() {
    var usel = el('lr-sc-learner'), ksel = el('lr-sc-roster-class'), list = el('lr-sc-roster-list');
    if (!usel || !ksel) return;
    var users = (Store.get('users') || []).filter(function (u) { return u.role === 'Student'; });
    usel.innerHTML = users.map(function (u) { return '<option value="' + u.id + '">' + esc(u.name) + '</option>'; }).join('') || '<option value="">No learners</option>';
    var c = classes();
    ksel.innerHTML = c.map(function (k) { return '<option value="' + k.id + '">' + esc(k.name) + '</option>'; }).join('') || '<option value="">No classes</option>';
    if (list) {
      list.innerHTML = c.map(function (k) {
        var names = roster(k.id).map(function (u) { return esc(u.name); }).join(', ') || '<em class="text-muted">empty</em>';
        return '<p><strong>' + esc(k.name) + ':</strong> ' + names + '</p>';
      }).join('') || '<p class="text-muted">No classes yet.</p>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  LR.school = {
    getSchool: getSchool, saveSchool: saveSchool,
    classes: classes, addClass: addClass,
    roster: roster, assignToClass: assignToClass, cohort: cohort,
    exportCSV: exportCSV
  };
})();
