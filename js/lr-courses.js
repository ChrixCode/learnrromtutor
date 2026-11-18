/* ============================================================
   2tors.ng COURSES — discovery + detail engine (Step 4)
   The Store (APP.Store / LR.services.Store) is the SINGLE source
   of truth for courses. Creator-published courses using the same
   schema automatically appear in discovery — no template change.

   - migrate()   : additive v1 enrichment (subject, level,
                   difficulty, rating, language, curriculum,
                   objectives, image). Never overwrites fields
                   that already exist. Seeds the 6-course catalog
                   + Algebra/Python module packs only when absent.
   - Discovery   : renders .course-grid from the model; static
                   cards remain as no-JS fallback. Live search,
                   subject / level / free-paid filters, sorting,
                   empty state, analytics hooks.
   - Detail      : course-details.html?id=N renders title, tutor,
                   price, duration, rating, description, objectives,
                   modules/lessons, tutor card. Unknown id keeps
                   the static Algebra fallback.
   - Enroll seam : journals a Pending order, tracks the event,
                   routes guests to register with ?next= return.
   Requires: learnroom.js (LR). jQuery optional (used if present).
   ============================================================ */
(function () {
  'use strict';
  if (!window.LR || !LR.services || !LR.services.Store) return;
  var Store = LR.services.Store;

  var SCHEMA_FLAG = 'schema_courses_v1';

  var V1_DEFAULTS = {
    1: { subject: 'Mathematics', level: 'High School', difficulty: 'Beginner', rating: 4.9, reviews: 89, language: 'English', curriculum: 'US Common Core', objectives: ['Solve linear equations and inequalities', 'Graph quadratic functions', 'Factor polynomials', 'Apply algebra to real-world problems'] },
    2: { subject: 'English', level: 'All Levels', difficulty: 'Intermediate', rating: 4.8, reviews: 56, language: 'English', curriculum: 'US Common Core', objectives: ['Build vivid characters and settings', 'Structure stories with pacing', 'Edit and revise drafts', 'Develop a personal voice'] },
    3: { subject: 'Programming', level: 'Beginner', difficulty: 'Beginner', rating: 5.0, reviews: 72, language: 'English', curriculum: 'US Common Core', objectives: ['Write Python syntax with confidence', 'Use control flow and functions', 'Work with data structures', 'Build small real-world projects'] },
    4: { subject: 'Mathematics', level: 'Advanced', difficulty: 'Advanced', rating: 4.9, reviews: 41, language: 'English', curriculum: 'US Common Core', objectives: ['Master limits and continuity', 'Differentiate functions', 'Apply integrals', 'Model change with calculus'] },
    5: { subject: 'English', level: 'High School', difficulty: 'Intermediate', rating: 4.7, reviews: 33, language: 'English', curriculum: 'US Common Core', objectives: ['Plan thesis-driven essays', 'Cite evidence correctly', 'Revise for clarity', 'Master timed writing'] },
    6: { subject: 'Programming', level: 'Intermediate', difficulty: 'Intermediate', rating: 4.8, reviews: 47, language: 'English', curriculum: 'US Common Core', objectives: ['Build semantic HTML pages', 'Style with modern CSS', 'Add interactivity with JavaScript', 'Deploy a live site'] }
  };

  var SEED_COURSES = [
    { id: 1, name: 'Algebra Fundamentals', tutor: 'Dr. Mark Wilson', students: 12, status: 'Active', price: 49.99, duration: '8 weeks', category: 'Mathematics', description: 'Master the fundamentals of algebra, from basic equations to functions.' },
    { id: 2, name: 'Creative Writing', tutor: 'Catherine Chen', students: 8, status: 'Active', price: 39.99, duration: '6 weeks', category: 'Languages', description: 'Unlock your creative potential with guided writing practice.' },
    { id: 3, name: 'Python Programming', tutor: 'Jessica Carter', students: 15, status: 'Active', price: 59.99, duration: '10 weeks', category: 'Programming', description: 'Learn Python from scratch with hands-on projects.' },
    { id: 4, name: 'Calculus I', tutor: 'Dr. Mark Wilson', students: 10, status: 'Active', price: 54.99, duration: '12 weeks', category: 'Mathematics', description: 'Introductory calculus: limits, derivatives, and integrals.' },
    { id: 5, name: 'Essay Writing', tutor: 'Catherine Chen', students: 6, status: 'Active', price: 34.99, duration: '4 weeks', category: 'Languages', description: 'Improve your essay writing skills step by step.' },
    { id: 6, name: 'Web Development', tutor: 'Jessica Carter', students: 11, status: 'Active', price: 64.99, duration: '12 weeks', category: 'Programming', description: 'Build modern web applications with HTML, CSS, and JavaScript.' }
  ];

  var SEED_PACKS = {
    modules: [
      { id: 1, courseId: 1, title: 'Foundations of Algebra', order: 1, mock: true },
      { id: 2, courseId: 1, title: 'Linear Equations & Inequalities', order: 2, mock: true },
      { id: 3, courseId: 1, title: 'Quadratics & Functions', order: 3, mock: true },
      { id: 4, courseId: 3, title: 'Python Basics', order: 1, mock: true },
      { id: 5, courseId: 3, title: 'Mini Projects', order: 2, mock: true }
    ],
    lessons: [
      { id: 1, moduleId: 1, title: 'Variables & Expressions', kind: 'lesson', mock: true },
      { id: 2, moduleId: 1, title: 'Order of Operations', kind: 'lesson', mock: true },
      { id: 3, moduleId: 1, title: 'Simplifying Expressions', kind: 'practice', mock: true },
      { id: 4, moduleId: 2, title: 'One-Step & Multi-Step Equations', kind: 'lesson', mock: true },
      { id: 5, moduleId: 2, title: 'Graphing Linear Equations', kind: 'lesson', mock: true },
      { id: 6, moduleId: 2, title: 'Inequalities Practice', kind: 'practice', mock: true },
      { id: 7, moduleId: 3, title: 'Factoring Trinomials', kind: 'lesson', mock: true },
      { id: 8, moduleId: 3, title: 'Solving Quadratics by Factoring', kind: 'practice', mock: true },
      { id: 9, moduleId: 4, title: 'Syntax & Variables', kind: 'lesson', mock: true },
      { id: 10, moduleId: 4, title: 'Control Flow & Functions', kind: 'lesson', mock: true },
      { id: 11, moduleId: 5, title: 'Build a Quiz Game', kind: 'project', mock: true }
    ]
  };

  function imgFor(course) { return 'images/courses-image' + (((course.id - 1) % 5) + 1) + '.jpg'; }
  function authorFor(course) {
    var t = (course.tutor || '').toLowerCase();
    if (t.indexOf('mark') >= 0) return 'images/author-image1.jpg';
    if (t.indexOf('catherine') >= 0) return 'images/author-image2.jpg';
    if (t.indexOf('jessica') >= 0) return 'images/author-image3.jpg';
    return 'images/author-image4.jpg';
  }
  function priceLabel(c) { return (!c.price || c.price <= 0) ? 'Free' : 'USD ' + Number(c.price).toFixed(2); }
  function stars(c) {
    var r = c.rating || 0, out = '';
    for (var i = 1; i <= 5; i++) out += '<i class="fa fa-star" style="color:#f5a623;"></i>';
    return out + ' ' + (r ? Number(r).toFixed(1) : 'New');
  }

  function migrate() {
    var courses = Store.get('courses');
    if (!courses || !courses.length) {
      courses = SEED_COURSES.map(function (c) {
        var d = V1_DEFAULTS[c.id] || {};
        var copy = {}; for (var k in c) copy[k] = c[k];
        for (var k2 in d) copy[k2] = d[k2];
        copy.image = imgFor(copy);
        return copy;
      });
      Store.set('courses', courses);
    } else {
      var changed = false;
      courses.forEach(function (c) {
        var d = V1_DEFAULTS[c.id] || { subject: c.category || 'General', level: 'All Levels', difficulty: 'Beginner', rating: 0, reviews: 0, language: 'English', curriculum: 'US Common Core', objectives: [] };
        Object.keys(d).forEach(function (k) {
          if (c[k] === undefined || c[k] === null || c[k] === '') { c[k] = d[k]; changed = true; }
        });
        if (!c.image) { c.image = imgFor(c); changed = true; }
        if (!c.subject && c.category) { c.subject = c.category; changed = true; }
      });
      if (changed) Store.set('courses', courses);
    }
    ['modules', 'lessons'].forEach(function (key) {
      var cur = Store.get(key);
      if (!cur || !cur.length) Store.set(key, SEED_PACKS[key]);
    });
    try { Store.set(SCHEMA_FLAG, true); } catch (e) {}
    return Store.get('courses') || [];
  }

  /* ---------- Discovery ---------- */
  function cardHTML(c) {
    return '<div class="col-md-4 col-sm-6" data-course-card="' + c.id + '">' +
      '<div class="courses-thumb"><div class="courses-top">' +
      '<div class="courses-image"><img src="' + imgFor(c) + '" class="img-responsive" alt="' + c.name + '"></div>' +
      '<div class="courses-date"><span><i class="fa fa-clock-o"></i> ' + (c.duration || '') + '</span>' +
      '<span><i class="fa fa-users"></i> ' + (c.students || 0) + ' learners</span></div></div>' +
      '<div class="courses-detail"><h3><a href="course-details.html?id=' + c.id + '">' + c.name + '</a></h3>' +
      '<p>' + (c.description || '') + '</p>' +
      '<p class="course-meta" style="font-size:12px;color:#909090;">' + (c.level || '') + ' · ' + (c.difficulty || '') + ' · ' + stars(c) + '</p></div>' +
      '<div class="courses-info"><div class="courses-author"><img src="' + authorFor(c) + '" class="img-responsive" alt="">' +
      '<span>' + (c.tutor || '') + '</span></div>' +
      '<div class="courses-price' + ((!c.price || c.price <= 0) ? ' free' : '') + '"><a href="course-details.html?id=' + c.id + '"><span>' + priceLabel(c) + '</span></a></div>' +
      '</div></div></div>';
  }

  function currentFilters() {
    function val(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    return { q: val('lr-q').toLowerCase(), cat: val('lr-cat'), level: val('lr-level'), paid: val('lr-paid'), sort: val('lr-sort') };
  }

  function applyFilters(all, f) {
    var list = all.filter(function (c) {
      if (c.status && c.status !== 'Active') return false;
      if (f.q && ((c.name || '') + ' ' + (c.description || '') + ' ' + (c.tutor || '')).toLowerCase().indexOf(f.q) < 0) return false;
      if (f.cat && (c.category || c.subject) !== f.cat) return false;
      if (f.level && (c.level || '') !== f.level) return false;
      if (f.paid === 'free' && c.price > 0) return false;
      if (f.paid === 'paid' && !(c.price > 0)) return false;
      return true;
    });
    if (f.sort === 'price-low') list.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    else if (f.sort === 'price-high') list.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    else if (f.sort === 'popular') list.sort(function (a, b) { return (b.students || 0) - (a.students || 0); });
    else if (f.sort === 'rating') list.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    else list.sort(function (a, b) { return (b.id || 0) - (a.id || 0); });
    return list;
  }

  function renderGrid(all) {
    var grid = document.querySelector('.course-grid');
    if (!grid) return;
    var f = currentFilters();
    var list = applyFilters(all, f);
    if (!list.length) {
      grid.innerHTML = '<div class="col-md-12"><div class="text-center" style="padding:40px 0;"><h3>No courses match your filters</h3><p>Try a different keyword, subject, or price option.</p></div></div>';
    } else {
      grid.innerHTML = list.map(cardHTML).join('');
    }
    var count = document.getElementById('lr-count');
    if (count) count.textContent = list.length + ' of ' + all.filter(function (c) { return !c.status || c.status === 'Active'; }).length + ' courses';
    LR.track('courses.search', { q: f.q || null, cat: f.cat || null, level: f.level || null, paid: f.paid || null, results: list.length });
  }

  function initDiscovery() {
    var grid = document.querySelector('.course-grid');
    if (!grid) return false;
    var all = migrate();
    renderGrid(all);
    var go = document.getElementById('lr-go');
    if (go) go.addEventListener('click', function () { renderGrid(all); });
    var q = document.getElementById('lr-q');
    if (q) q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); renderGrid(all); } });
    ['lr-cat', 'lr-level', 'lr-paid', 'lr-sort'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () { renderGrid(all); });
    });
    return true;
  }

  /* ---------- Detail ---------- */
  function getId() {
    var m = location.search.match(/[?&]id=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
  function setText(sel, txt) {
    if (txt === undefined || txt === null) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = txt;
  }

  function renderDetail() {
    var id = getId();
    if (!id) return false;
    var all = migrate();
    var c = null;
    for (var i = 0; i < all.length; i++) if (all[i].id === id) { c = all[i]; break; }
    if (!c) return false; // unknown id: keep static fallback
    document.title = c.name + ' - LearnRoomTutor';
    setText('[data-lr-c="title"]', c.name);
    setText('[data-lr-c="tutor"]', c.tutor);
    setText('[data-lr-c="price"]', (c.price > 0 ? '$' + Number(c.price).toFixed(2) + ' total' : 'Free'));
    setText('[data-lr-c="duration"]', c.duration);
    setText('[data-lr-c="description"]', c.description);
    setText('[data-lr-c="level"]', (c.level || '') + ' · ' + (c.difficulty || ''));
    var starsEl = document.querySelector('[data-lr-c="rating"]');
    if (starsEl) starsEl.innerHTML = stars(c) + ' <span style="color:#888;">(' + (c.reviews || 0) + ' reviews)</span>';
    var obj = document.getElementById('lr-objectives');
    if (obj && c.objectives && c.objectives.length) {
      obj.innerHTML = c.objectives.map(function (o) {
        return '<li style="padding:8px 0;"><i class="fa fa-check" style="color:#3f51b5; margin-right:10px;"></i>' + o + '</li>';
      }).join('');
    }
    var modules = (Store.get('modules') || []).filter(function (m) { return m.courseId === id; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var lessons = Store.get('lessons') || [];
    var cur = document.getElementById('lr-curriculum');
    if (cur && modules.length) {
      var cards = cur.querySelectorAll('div[style*="background:#fff"], div[style*="background: #fff"]');
      // Rebuild module cards from the model (Content → Module → Lesson ready for creators).
      var host = cards.length ? cards[0].parentNode : null;
      if (host) {
        cards.forEach(function (n) { n.remove(); });
        modules.forEach(function (m) {
          var ls = lessons.filter(function (l) { return l.moduleId === m.id; });
          var li = ls.length ? ls.map(function (l) { return '<li>' + l.title + (l.kind !== 'lesson' ? ' <em style="color:#909090;">(' + l.kind + ')</em>' : '') + '</li>'; }).join('')
            : '<li>Content being prepared by the creator.</li>';
          var div = document.createElement('div');
          div.setAttribute('style', 'background:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.08); margin-bottom:15px;');
          div.innerHTML = '<h4>' + m.title + '</h4><ul style="padding-left:20px;">' + li + '</ul>';
          host.appendChild(div);
        });
      }
    }
    // Tutor card from the tutors collection when available.
    var tutors = Store.get('tutors') || [];
    var t = null;
    for (var j = 0; j < tutors.length; j++) if ((tutors[j].name || '') === c.tutor) { t = tutors[j]; break; }
    if (t) {
      setText('[data-lr-c="tutorName"]', t.name);
      setText('[data-lr-c="tutorBio"]', t.qualifications || t.bio || '');
      var rEl = document.querySelector('[data-lr-c="tutorRating"]');
      if (rEl && t.rating) rEl.innerHTML = stars({ rating: t.rating }) + ' ' + Number(t.rating).toFixed(1);
    } else {
      setText('[data-lr-c="tutorName"]', c.tutor);
    }
    setText('[data-lr-c="enrollLabel"]', 'Enroll Now — ' + priceLabel(c));
    setText('[data-lr-c="ctaTitle"]', 'Start Mastering ' + c.name.split(':')[0] + ' Today');
    LR.track('courses.view', { id: c.id, name: c.name });
    return true;
  }

  function initEnroll() {
    document.querySelectorAll('[data-lr-enroll]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var id = getId();
        LR.track('courses.enroll_click', { id: id });
        var loggedIn = LR.services.Auth && LR.services.Auth.isLoggedIn && LR.services.Auth.isLoggedIn();
        if (!loggedIn) {
          e.preventDefault();
          location.href = 'dashboards/register.html?next=' + encodeURIComponent(location.pathname + location.search);
          return;
        }
        e.preventDefault();
        var orders = Store.get('orders') || [];
        orders.push({ id: orders.length + 1, courseId: id, status: 'Pending', ts: new Date().toISOString(), mock: true });
        Store.set('orders', orders);
        LR.track('courses.enroll', { id: id });
        btn.textContent = 'Enrollment Requested ✓ (preview)';
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    if (document.querySelector('.course-grid')) initDiscovery();
    renderDetail();
    initEnroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  LR.courses = { migrate: migrate, renderGrid: renderGrid, renderDetail: renderDetail };
})();
