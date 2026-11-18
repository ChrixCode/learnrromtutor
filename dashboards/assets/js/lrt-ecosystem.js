/* ============================================================
   2tors.ng ECOSYSTEM STORE EXTENSION (Phase 0)
   Extends APP.Store (lrt-cms.js) with the §17 data model:
   profiles, skillProfiles, objectives, masteryStates,
   modules, lessons, activities, questions, assignments,
   attempts, orders, revenueLedger, aiSessions, schools,
   classes, auditLog.

   RULES: additive only. Seeds a collection ONLY when the key
   is absent — never overwrites existing admin data.
   Requires lrt-cms.js (APP.Store); falls back to LR.services.
   ============================================================ */
(function ($) {
  'use strict';

  var Store = (window.APP && APP.Store)
    ? APP.Store
    : (window.LR ? LR.services.Store : null);
  if (!Store) return;

  var ECOSYSTEM_SEED = {
    profiles: [
      { id: 1, userId: 6, role: 'learner', age: 16, grade: 'Grade 11', curriculum: 'US Common Core', subjects: ['Mathematics', 'English'], mock: true }
    ],
    objectives: [
      { id: 1, subject: 'Mathematics', level: 'Grade 11', code: 'MATH-ALG-01', title: 'Solve quadratic equations', mock: true },
      { id: 2, subject: 'Mathematics', level: 'Grade 11', code: 'MATH-ALG-02', title: 'Factor polynomials', mock: true },
      { id: 3, subject: 'English', level: 'Grade 11', code: 'ENG-WR-01', title: 'Write a structured essay', mock: true }
    ],
    skillProfiles: [
      { id: 1, learnerId: 6, objectiveId: 1, evidence: 0, state: 'diagnosing', updatedAt: 'Jul 8, 2026', mock: true }
    ],
    masteryStates: [
      { id: 1, learnerId: 6, objectiveId: 1, status: 'not-started', score: null, mock: true }
    ],
    modules: [],
    lessons: [],
    activities: [],
    questions: [
      { id: 1, activityId: null, objectiveId: 1, kind: 'diagnostic', prompt: 'Solve: x^2 - 5x + 6 = 0', answer: 'x = 2 or x = 3', rubric: 'Full marks for both roots with working.', mock: true }
    ],
    assignments: [],
    attempts: [],
    orders: [],
    revenueLedger: [],
    aiSessions: [],
    schools: [],
    classes: [],
    auditLog: []
  };

  function ensureEcosystemSchema() {
    Object.keys(ECOSYSTEM_SEED).forEach(function (key) {
      var existing = null;
      try { existing = Store.get(key); } catch (e) { existing = null; }
      if (existing === null || existing === undefined) {
        Store.set(key, ECOSYSTEM_SEED[key]);
      }
    });
  }

  ///aiSessions helper: every AI interaction is journaled with
  //prompt version + safety metadata (§14/§15 readiness).
  function logAiSession(entry) {
    var sessions = Store.get('aiSessions') || [];
    entry = entry || {};
    entry.id = sessions.length ? sessions[sessions.length - 1].id + 1 : 1;
    entry.ts = new Date().toISOString();
    entry.provider = entry.provider || 'mock';
    entry.promptVersion = entry.promptVersion || 'v0-phase0';
    entry.safety = entry.safety || { mock: true };
    sessions.push(entry);
    if (sessions.length > 200) sessions = sessions.slice(-200);
    Store.set('aiSessions', sessions);
    return entry;
  }

  window.LR = window.LR || {};
  LR.data = LR.data || {};
  LR.data.ensureEcosystemSchema = ensureEcosystemSchema;
  LR.data.logAiSession = logAiSession;

  // Seed on load (additive only).
  try { ensureEcosystemSchema(); } catch (e) {}

})(jQuery);
