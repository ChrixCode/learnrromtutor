/* ============================================================
   2TORS.NG — window.LR namespace
   Provides analytics, auth seam, mock AI, and store seam.
   ============================================================ */
(function (global) {
  'use strict';

  var LR = global.LR = global.LR || {};
  LR.version = '0.1.0-phase0';
  LR.config = {
    analyticsKey: 'lrt_analytics',
    analyticsMax: 200,
    aiProvider: 'mock',
    aiPromptVersion: 'v0-phase0'
  };

  /* ---------- 1. Analytics hook ---------- */
  LR.track = function (event, payload) {
    var entry = {
      event: event,
      payload: payload || {},
      url: location.pathname,
      ts: new Date().toISOString()
    };
    try {
      var q = JSON.parse(localStorage.getItem(LR.config.analyticsKey) || '[]');
      q.push(entry);
      if (q.length > LR.config.analyticsMax) q = q.slice(-LR.config.analyticsMax);
      localStorage.setItem(LR.config.analyticsKey, JSON.stringify(q));
    } catch (e) { /* storage unavailable: console only */ }
    if (window.console && console.debug) console.debug('[LR.track]', entry);
    return entry;
  };

  LR.services = LR.services || {};

  /* ---------- 2. Auth service seam ---------- */
  LR.services.Auth = {
    isLoggedIn: function () {
      try {
        if (global.APP && APP.auth) return APP.auth.isLoggedIn();
        return localStorage.getItem('lrt_session') === '1';
      } catch (e) { return false; }
    },
    // Mock sign-in: accepts any credentials in frontend phase.
    // Backend phase: POST to real endpoint, keep this signature.
    signIn: function (email, password) {
      return new Promise(function (resolve) {
        var session = { email: email, role: 'learner', mock: true, ts: Date.now() };
        try { localStorage.setItem('lrt_session', '1'); } catch (e) {}
        LR.track('auth.sign_in', { mock: true });
        resolve(session);
      });
    },
    signOut: function () {
      return new Promise(function (resolve) {
        try {
          if (global.APP && APP.auth) global.APP.auth.logout();
          localStorage.removeItem('lrt_session');
        } catch (e) {}
        LR.track('auth.sign_out', {});
        resolve(true);
      });
    }
  };

  /* ---------- 3. AI service seam (mock) ---------- */
  // Contract for MVP 1: complete({ subject, level, objective, input })
  // -> Promise<{ text, provider, promptVersion, safety }>.
  // The mock returns a curriculum-framed placeholder so UI can be
  // built honestly; a real gateway replaces ONLY this body.
  LR.services.AI = {
    complete: function (opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var text = '[AI Tutor mock · ' + (opts.subject || 'general') +
          ' · ' + (opts.level || 'all-levels') + '] ' +
          'This is a frontend-phase placeholder. It will explain "' +
          (opts.input || opts.objective || 'your topic') +
          '" here once the AI gateway (Phase MVP 1) is connected. ' +
          'Difficult cases escalate to a human tutor.';
        var res = {
          text: text,
          provider: LR.config.aiProvider,
          promptVersion: LR.config.aiPromptVersion,
          safety: { ageChecked: false, moderated: false, mock: true }
        };
        LR.track('ai.complete', {
          subject: opts.subject || null,
          provider: res.provider,
          promptVersion: res.promptVersion
        });
        resolve(res);
      });
    }
  };

  /* ---------- 4. Store seam ---------- */
  LR.services.Store = {
    _mem: {},
    get: function (key) {
      try {
        if (global.APP && APP.Store) return APP.Store.get(key);
        var raw = localStorage.getItem('lrt_' + key);
        return raw ? JSON.parse(raw) : (this._mem[key] || null);
      } catch (e) { return this._mem[key] || null; }
    },
    set: function (key, val) {
      try {
        if (global.APP && APP.Store) { APP.Store.set(key, val); return; }
        localStorage.setItem('lrt_' + key, JSON.stringify(val));
      } catch (e) { this._mem[key] = val; }
    }
  };

  // Auto-track page views (convention: lr_page_view).
  try { LR.track('lr_page_view', { title: document.title }); } catch (e) {}

})(window);
