(function ($) {
  "use strict";

  const APP = {
    version: '1.0.0',
    adminPassword: 'admin123',
    storagePrefix: 'lrt_',

    // ─── Storage Layer ──────────────────────────────────────────────
    Store: {
      _prefix: 'lrt_',
      _key: function (k) { return this._prefix + k; },
      get: function (key) {
        try { return JSON.parse(localStorage.getItem(this._key(key))) || null; }
        catch (e) { return null; }
      },
      set: function (key, val) {
        localStorage.setItem(this._key(key), JSON.stringify(val));
      },
      remove: function (key) {
        localStorage.removeItem(this._key(key));
      },
      getAll: function () {
        const all = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith(this._prefix)) {
            const name = k.slice(this._prefix.length);
            try { all[name] = JSON.parse(localStorage.getItem(k)); }
            catch (e) { all[name] = localStorage.getItem(k); }
          }
        }
        return all;
      },
      importAll: function (data) {
        for (const [key, val] of Object.entries(data)) {
          this.set(key, val);
        }
      },
      exportAll: function () {
        return this.getAll();
      }
    },

    // ─── Seed Data ──────────────────────────────────────────────────
    seedData: function () {
      if (this.Store.get('_seeded')) return;

      const now = new Date();
      const fmt = function (d) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };

      this.Store.set('users', [
        { id: 1, name: 'Admin', email: 'admin@learnroomtutor.com', role: 'Admin', status: 'Active', joined: fmt(now), phone: '', bio: 'Platform administrator' },
        { id: 2, name: 'Emily Watson', email: 'emily@example.com', role: 'Student', status: 'Active', joined: 'Jul 8, 2026', phone: '+1 (555) 111-2222', bio: 'High school student' },
        { id: 3, name: 'James Chen', email: 'james@example.com', role: 'Tutor', status: 'Pending', joined: 'Jul 7, 2026', phone: '+1 (555) 222-3333', bio: 'Physics tutor' },
        { id: 4, name: 'Robert Kim', email: 'robert@example.com', role: 'Tutor', status: 'Verified', joined: 'Jul 6, 2026', phone: '+1 (555) 333-4444', bio: 'Experienced math tutor' },
        { id: 5, name: 'Lisa Park', email: 'lisa@example.com', role: 'Tutor', status: 'Pending', joined: 'Jul 7, 2026', phone: '+1 (555) 444-5555', bio: 'Chemistry tutor' },
        { id: 6, name: 'John D.', email: 'john@example.com', role: 'Student', status: 'Active', joined: 'Jul 5, 2026', phone: '', bio: 'College student' },
        { id: 7, name: 'Sarah M.', email: 'sarah@example.com', role: 'Student', status: 'Active', joined: 'Jul 4, 2026', phone: '', bio: 'Graduate student' },
      ]);

      this.Store.set('tutors', [
        { id: 1, name: 'Dr. Mark Wilson', email: 'mark@example.com', specialization: 'Mathematics', courses: 3, rating: 4.9, status: 'Verified', phone: '+1 (555) 101-0101', bio: 'PhD in Mathematics with 10+ years teaching experience', qualifications: 'PhD Mathematics, Stanford', experience: 10, students: 45, sessions: 320, earnings: 15000, reviews: 89 },
        { id: 2, name: 'Catherine Chen', email: 'catherine@example.com', specialization: 'Creative Writing', courses: 2, rating: 4.8, status: 'Verified', phone: '+1 (555) 202-0202', bio: 'Published author and writing coach', qualifications: 'MA English, Columbia', experience: 8, students: 32, sessions: 210, earnings: 9800, reviews: 56 },
        { id: 3, name: 'Jessica Carter', email: 'jessica@example.com', specialization: 'Python Programming', courses: 2, rating: 5.0, status: 'Verified', phone: '+1 (555) 303-0303', bio: 'Full-stack developer and coding instructor', qualifications: 'BS Computer Science, MIT', experience: 6, students: 28, sessions: 180, earnings: 8500, reviews: 72 },
        { id: 4, name: 'James Chen', email: 'james@example.com', specialization: 'Physics', courses: 0, rating: 0, status: 'Pending', phone: '+1 (555) 222-3333', bio: 'Physics tutor awaiting verification', qualifications: 'MS Physics, Caltech', experience: 3, students: 0, sessions: 0, earnings: 0, reviews: 0 },
        { id: 5, name: 'Lisa Park', email: 'lisa@example.com', specialization: 'Chemistry', courses: 0, rating: 0, status: 'Pending', phone: '+1 (555) 444-5555', bio: 'Chemistry tutor awaiting verification', qualifications: 'BS Chemistry, UCLA', experience: 2, students: 0, sessions: 0, earnings: 0, reviews: 0 },
      ]);

      this.Store.set('courses', [
        { id: 1, name: 'Algebra Fundamentals', tutor: 'Dr. Mark Wilson', students: 12, status: 'Active', price: 49.99, duration: '8 weeks', category: 'Mathematics', description: 'Master the fundamentals of algebra' },
        { id: 2, name: 'Creative Writing', tutor: 'Catherine Chen', students: 8, status: 'Active', price: 39.99, duration: '6 weeks', category: 'Languages', description: 'Unlock your creative potential' },
        { id: 3, name: 'Python Programming', tutor: 'Jessica Carter', students: 15, status: 'Active', price: 59.99, duration: '10 weeks', category: 'Programming', description: 'Learn Python from scratch' },
        { id: 4, name: 'Calculus I', tutor: 'Dr. Mark Wilson', students: 10, status: 'Active', price: 54.99, duration: '12 weeks', category: 'Mathematics', description: 'Introductory calculus' },
        { id: 5, name: 'Essay Writing', tutor: 'Catherine Chen', students: 6, status: 'Active', price: 34.99, duration: '4 weeks', category: 'Languages', description: 'Improve your essay writing skills' },
        { id: 6, name: 'Web Development', tutor: 'Jessica Carter', students: 11, status: 'Active', price: 64.99, duration: '12 weeks', category: 'Programming', description: 'Build modern web applications' },
      ]);

      this.Store.set('categories', [
        { id: 1, name: 'Mathematics', courses: 24, status: 'Active' },
        { id: 2, name: 'Languages', courses: 18, status: 'Active' },
        { id: 3, name: 'Science', courses: 15, status: 'Active' },
        { id: 4, name: 'Programming', courses: 22, status: 'Active' },
        { id: 5, name: 'Test Prep', courses: 12, status: 'Active' },
        { id: 6, name: 'Music', courses: 8, status: 'Active' },
      ]);

      this.Store.set('bookings', [
        { id: 'BK-001', student: 'John D.', tutor: 'Dr. Mark Wilson', date: 'Jul 12, 2026', time: '10:00 AM', subject: 'Algebra', status: 'Scheduled' },
        { id: 'BK-002', student: 'Sarah M.', tutor: 'Catherine Chen', date: 'Jul 14, 2026', time: '2:00 PM', subject: 'Creative Writing', status: 'Scheduled' },
        { id: 'BK-003', student: 'Mike R.', tutor: 'Jessica Carter', date: 'Jul 15, 2026', time: '11:00 AM', subject: 'Python', status: 'Completed' },
        { id: 'BK-004', student: 'Emily Watson', tutor: 'Dr. Mark Wilson', date: 'Jul 10, 2026', time: '3:00 PM', subject: 'Calculus', status: 'Completed' },
        { id: 'BK-005', student: 'Lisa Park', tutor: 'Catherine Chen', date: 'Jul 18, 2026', time: '9:00 AM', subject: 'Essay Writing', status: 'Scheduled' },
      ]);

      this.Store.set('payments', [
        { id: 'TXN-001', user: 'John D.', amount: 120.00, date: 'Jul 8, 2026', method: 'Credit Card', status: 'Completed' },
        { id: 'TXN-002', user: 'Sarah M.', amount: 60.00, date: 'Jul 6, 2026', method: 'PayPal', status: 'Completed' },
        { id: 'TXN-003', user: 'Mike R.', amount: 90.00, date: 'Jul 3, 2026', method: 'Credit Card', status: 'Pending' },
        { id: 'TXN-004', user: 'Emily Watson', amount: 150.00, date: 'Jul 9, 2026', method: 'Debit Card', status: 'Completed' },
        { id: 'TXN-005', user: 'John D.', amount: 45.00, date: 'Jul 10, 2026', method: 'PayPal', status: 'Pending' },
      ]);

      this.Store.set('payouts', [
        { id: 'PO-001', tutor: 'Dr. Mark Wilson', amount: 500.00, method: 'Bank Transfer', date: 'Jul 10, 2026', status: 'Pending' },
        { id: 'PO-002', tutor: 'Catherine Chen', amount: 320.00, method: 'PayPal', date: 'Jul 9, 2026', status: 'Pending' },
        { id: 'PO-003', tutor: 'Jessica Carter', amount: 750.00, method: 'Bank Transfer', date: 'Jul 8, 2026', status: 'Completed' },
        { id: 'PO-004', tutor: 'Sarah Lee', amount: 180.00, method: 'PayPal', date: 'Jul 7, 2026', status: 'Completed' },
      ]);

      this.Store.set('complaints', [
        { id: 'CMP-001', from: 'John D.', type: 'Session Issue', date: 'Jul 7, 2026', description: 'Tutor was 15 minutes late', status: 'Open' },
        { id: 'CMP-002', from: 'Dr. Mark Wilson', type: 'Payment', date: 'Jul 5, 2026', description: 'Payment not received for session', status: 'Resolved' },
        { id: 'CMP-003', from: 'Sarah M.', type: 'Technical', date: 'Jul 9, 2026', description: 'Video platform not working', status: 'Open' },
      ]);

      this.Store.set('settings', {
        siteName: 'LearnRoomTutor',
        tagline: 'Find Your Perfect Tutor',
        supportEmail: 'support@learnroomtutor.com',
        supportPhone: '+1 (555) 000-0000',
        address: '123 Education St, New York, NY 10001',
        primaryColor: '#29ca8e',
        secondaryColor: '#3f51b5',
        metaTitle: 'LearnRoomTutor - Find Your Perfect Tutor',
        metaDescription: 'Connect with expert tutors worldwide for personalized learning experiences in any subject.',
        metaKeywords: 'tutoring, online learning, education, tutors',
        maintenanceMode: false,
        maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back shortly.',
        sessionTimeout: 30,
        maxTutorsPerStudent: 5,
        commissionRate: 15,
        smtpHost: 'smtp.learnroomtutor.com',
        smtpPort: 587,
        fromEmail: 'noreply@learnroomtutor.com',
        twoFactorAuth: true,
        enforceStrongPasswords: true,
        googleOAuth: false,
        passwordExpiry: 90,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        suspiciousLoginAlert: true,
        stripeEnabled: true,
        paypalEnabled: false,
        minPayoutAmount: 50,
        payoutSchedule: 'Manual (admin approval)',
        processingFee: 2.50
      });

      this.Store.set('activityLogs', [
        { id: 1, timestamp: 'Jul 8, 2026 10:30 AM', user: 'Admin', action: 'User login', ip: '192.168.1.100' },
        { id: 2, timestamp: 'Jul 8, 2026 09:15 AM', user: 'Admin', action: 'Tutor verification approved', ip: '192.168.1.100' },
        { id: 3, timestamp: 'Jul 7, 2026 04:45 PM', user: 'James Chen', action: 'Account created', ip: '10.0.0.25' },
        { id: 4, timestamp: 'Jul 7, 2026 02:30 PM', user: 'Emily Watson', action: 'Course enrolled', ip: '10.0.0.30' },
        { id: 5, timestamp: 'Jul 6, 2026 11:00 AM', user: 'Admin', action: 'System settings updated', ip: '192.168.1.100' },
      ]);

      this.Store.set('notifications', [
        { id: 1, type: 'danger', icon: 'la la-exclamation-triangle', title: 'New complaint from learner', description: 'John D. reported a session issue', time: '5 minutes ago', section: 'section-complaints' },
        { id: 2, type: 'primary', icon: 'la la-id-card', title: 'New tutor verification pending', description: 'James Chen submitted documents', time: '15 minutes ago', section: 'section-verification' },
        { id: 3, type: 'success', icon: 'la la-credit-card', title: 'Payment of $240 processed', description: 'Payment to Dr. Mark Wilson', time: '1 hour ago', section: 'section-payments' },
        { id: 4, type: 'info', icon: 'la la-user-plus', title: 'New user registered', description: 'Sarah M. joined the platform', time: '2 hours ago', section: 'section-users' },
        { id: 5, type: 'warning', icon: 'la la-exclamation-triangle', title: 'Payout request awaiting approval', description: 'Catherine Chen requested $320', time: '2 hours ago', section: 'section-payouts' },
        { id: 6, type: 'success', icon: 'la la-check-circle', title: 'Course completed', description: 'Python Programming course ended', time: '3 hours ago', section: 'section-courses' },
        { id: 7, type: 'primary', icon: 'la la-star', title: 'New 5-star review', description: 'Jessica Carter received a review', time: '4 hours ago', section: 'section-tutors' },
        { id: 8, type: 'info', icon: 'la la-calendar', title: 'Session booked', description: 'Sarah M. booked Creative Writing', time: '5 hours ago', section: 'section-bookings' },
      ]);

      this.Store.set('content', {
        home: { title: 'Home Page', lastUpdated: 'Jul 5, 2026', status: 'Published' },
        about: { title: 'About Us', lastUpdated: 'Jun 28, 2026', status: 'Published' },
        blog: { title: 'Blog', lastUpdated: 'Jul 8, 2026', status: 'Published' },
        services: { title: 'Services', lastUpdated: 'Jul 1, 2026', status: 'Published' },
        contact: { title: 'Contact', lastUpdated: 'Jun 15, 2026', status: 'Published' },
      });

      this.Store.set('_seeded', true);
      this.Store.set('_adminAuthed', false);
    },

    // ─── Auth ───────────────────────────────────────────────────────
    auth: {
      isLoggedIn: function () {
        return APP.Store.get('_adminAuthed') === true;
      },
      login: function (password) {
        if (password === APP.adminPassword) {
          APP.Store.set('_adminAuthed', true);
          APP.Store.set('_adminSession', Date.now());
          APP.addLog('Admin', 'Admin login');
          APP.addNotification('success', 'la la-check-circle', 'Login successful', 'Welcome back, Admin', 'just now', 'section-dashboard');
          return true;
        }
        return false;
      },
      logout: function () {
        APP.Store.set('_adminAuthed', false);
        APP.Store.remove('_adminSession');
        APP.UI.showLogin();
      },
      changePassword: function (oldPw, newPw) {
        if (oldPw === APP.adminPassword && newPw && newPw.length >= 6) {
          APP.adminPassword = newPw;
          APP.Store.set('_adminPassword', newPw);
          APP.addLog('Admin', 'Password changed');
          return true;
        }
        return false;
      }
    },

    // ─── Notifications ──────────────────────────────────────────────
    addNotification: function (type, icon, title, description, time, section) {
      const notes = APP.Store.get('notifications') || [];
      const id = notes.length ? Math.max.apply(null, notes.map(function (n) { return n.id; })) + 1 : 1;
      notes.unshift({ id: id, type: type, icon: icon, title: title, description: description, time: time || 'just now', section: section || 'section-dashboard' });
      APP.Store.set('notifications', notes);
      APP.UI.updateNotificationBadge();
    },

    // ─── Activity Log ───────────────────────────────────────────────
    addLog: function (user, action) {
      const logs = APP.Store.get('activityLogs') || [];
      const id = logs.length ? Math.max.apply(null, logs.map(function (l) { return l.id; })) + 1 : 1;
      const now = new Date();
      const ts = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      logs.unshift({ id: id, timestamp: ts, user: user || 'Admin', action: action, ip: '127.0.0.1' });
      if (logs.length > 100) logs.length = 100;
      APP.Store.set('activityLogs', logs);
    }
  };

  // ─── UI Module ───────────────────────────────────────────────────
  APP.UI = {
    showLogin: function () {
      if (!$('#login-overlay').length) {
        const overlay = $('<div id="login-overlay"><div class="login-card"><div class="login-header"><i class="la la-graduation-cap" style="font-size:48px;color:#29ca8e;"></i><h2>LearnRoomTutor</h2><p>Admin Panel</p></div><div class="login-body"><div class="form-group"><input type="password" id="login-password" class="form-control" placeholder="Enter admin password" style="font-size:16px;padding:12px;"></div><button id="login-btn" class="btn btn-primary btn-block" style="padding:12px;font-size:16px;">Sign In</button><p id="login-error" class="text-danger text-center" style="display:none;margin-top:10px;">Invalid password. Try again.</p></div></div></div>');
        $('body').append(overlay);
        var style = $('<style>#login-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);z-index:99999;display:none;align-items:center;justify-content:center}#login-overlay.show{display:flex}#login-overlay .login-card{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px;width:400px;max-width:90vw;text-align:center}#login-overlay .login-header{margin-bottom:30px}#login-overlay .login-header h2{color:#333;margin:10px 0 5px}#login-overlay .login-header p{color:#888;margin:0}</style>');
        $('head').append(style);
      }
      $('.wrapper').hide();
      $('#login-overlay').addClass('show').show();
    },

    hideLogin: function () {
      $('#login-overlay').removeClass('show').hide();
      $('.wrapper').show();
    },

    updateNotificationBadge: function () {
      const notes = APP.Store.get('notifications') || [];
      const count = notes.length;
      $('.notification').text(count > 99 ? '99+' : count);
    },

    renderNotifications: function () {
      const notes = APP.Store.get('notifications') || [];
      const $center = $('.notif-center');
      if (!$center.length) return;
      $center.empty();
      notes.slice(0, 5).forEach(function (n) {
        $center.append('<a href="#' + n.section + '"><div class="notif-icon notif-' + n.type + '"><i class="' + n.icon + '"></i></div><div class="notif-content"><span class="block">' + n.title + '</span><span class="time">' + n.time + '</span></div></a>');
      });
      if (notes.length > 5) {
        $center.closest('.notif-box').find('.see-all').show();
      } else {
        $center.closest('.notif-box').find('.see-all').hide();
      }
    },

    toast: function (type, message, title) {
      if ($.notify) {
        $.notify({ icon: 'la la-bell', title: title || '', message: message }, { type: type || 'info', placement: { from: 'bottom', align: 'right' }, timer: 3000 });
      } else {
        alert(message);
      }
    },

    confirm: function (message, callback) {
      if (confirm(message)) {
        callback();
      }
    }
  };

  // ─── Dashboard ────────────────────────────────────────────────────
  APP.Dashboard = {
    render: function () {
      const users = APP.Store.get('users') || [];
      const tutors = APP.Store.get('tutors') || [];
      const courses = APP.Store.get('courses') || [];
      const bookings = APP.Store.get('bookings') || [];
      const payments = APP.Store.get('payments') || [];

      $('.card-stats .numbers .card-title').each(function () {
        var label = $(this).closest('.numbers').find('.card-category').text().trim().toLowerCase();
        if (label.indexOf('total users') >= 0) $(this).text(users.length.toLocaleString());
        else if (label.indexOf('total tutors') >= 0) $(this).text(tutors.filter(function (t) { return t.status !== 'Pending'; }).length.toLocaleString());
        else if (label.indexOf('total students') >= 0) $(this).text(users.filter(function (u) { return u.role === 'Student'; }).length.toLocaleString());
        else if (label.indexOf('revenue') >= 0) {
          var total = 0;
          payments.forEach(function (p) { if (p.status === 'Completed') total += p.amount; });
          $(this).text('$' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      });

      var activeCourses = courses.filter(function (c) { return c.status === 'Active'; }).length;
      $('#task-complete').closest('.card').find('.card-title').text(activeCourses + ' Active');

      var growth = users.length > 7 ? '+15%' : '+12%';
      $('.progress-card:eq(0) .text-muted.fw-bold').text(growth);
      $('.progress-card:eq(1) .text-muted.fw-bold').text(bookings.length.toLocaleString());

      var revenueTotal = 0;
      payments.forEach(function (p) { if (p.status === 'Completed') revenueTotal += p.amount; });
      var revenueGrowth = revenueTotal > 500 ? '+18%' : '+12%';
      $('.progress-card:eq(2) .text-muted.fw-bold').text(revenueGrowth);

      $('.progress-card:eq(3) .text-muted.fw-bold').text('94%');
    },

    renderRecentRegistrations: function () {
      const users = APP.Store.get('users') || [];
      const tbody = $('#section-dashboard .table:eq(0) tbody');
      if (!tbody.length) return;
      tbody.empty();
      var recent = users.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 4);
      recent.forEach(function (u, i) {
        var badge = 'status-active';
        if (u.status === 'Pending') badge = 'status-pending';
        else if (u.status === 'Verified') badge = 'status-verified';
        tbody.append('<tr><td>' + (i + 1) + '</td><td>' + u.name + '</td><td>' + u.role + '</td><td>' + u.joined + '</td><td><span class="status-badge ' + badge + '">' + u.status + '</span></td></tr>');
      });
    }
  };

  // ─── Users ────────────────────────────────────────────────────────
  APP.Users = {
    render: function (target) {
      const users = APP.Store.get('users') || [];
      var container = target || '#section-users .table-responsive .table tbody';
      var $tbody = $(container);
      if (!$tbody.length) return;
      $tbody.empty();
      var stats = { total: users.length, active: 0, pending: 0, suspended: 0 };
      users.forEach(function (u) {
        if (u.status === 'Active') stats.active++;
        else if (u.status === 'Pending') stats.pending++;
        else if (u.status === 'Suspended') stats.suspended++;
      });
      if (target) {
        $(target).closest('.card').siblings('.row').find('.card-title').each(function () {
          var label = $(this).closest('.numbers').find('.card-category').text().trim().toLowerCase();
          if (label === 'total users') $(this).text(stats.total);
          else if (label === 'active') $(this).text(stats.active);
          else if (label === 'pending') $(this).text(stats.pending);
          else if (label === 'suspended') $(this).text(stats.suspended);
        });
      }
      users.forEach(function (u) {
        var badge = 'status-' + u.status.toLowerCase();
        var actions = '';
        if (u.status === 'Pending') actions = '<button class="btn btn-sm btn-success user-approve" data-id="' + u.id + '">Approve</button> <button class="btn btn-sm btn-danger user-reject" data-id="' + u.id + '">Reject</button>';
        else actions = '<button class="btn btn-sm btn-primary user-edit" data-id="' + u.id + '">Edit</button> <button class="btn btn-sm btn-danger user-suspend" data-id="' + u.id + '">' + (u.status === 'Suspended' ? 'Activate' : 'Suspend') + '</button>';
        $tbody.append('<tr><td>' + u.id + '</td><td>' + u.name + '</td><td>' + u.email + '</td><td>' + u.role + '</td><td><span class="status-badge ' + badge + '">' + u.status + '</span></td><td>' + u.joined + '</td><td>' + actions + '</td></tr>');
      });
    },

    initEvents: function () {
      $(document).off('click', '.user-edit, .user-suspend, .user-approve, .user-reject');
      $(document).on('click', '.user-edit', function () {
        var id = $(this).data('id');
        APP.Modal.open('Edit User', '<div class="form-group"><label>Name</label><input type="text" class="form-control user-field-name" value=""></div><div class="form-group"><label>Email</label><input type="email" class="form-control user-field-email"></div><div class="form-group"><label>Role</label><select class="form-control user-field-role"><option>Student</option><option>Tutor</option><option>Admin</option></select></div>', function () {
          var users = APP.Store.get('users') || [];
          var user = users.find(function (u) { return u.id === id; });
          if (user) {
            user.name = $('.user-field-name').val();
            user.email = $('.user-field-email').val();
            user.role = $('.user-field-role').val();
            APP.Store.set('users', users);
            APP.UI.toast('success', 'User updated');
            APP.addLog('Admin', 'Updated user: ' + user.name);
            APP.Users.render();
          }
        });
        var users = APP.Store.get('users') || [];
        var user = users.find(function (u) { return u.id === id; });
        if (user) {
          $('.user-field-name').val(user.name);
          $('.user-field-email').val(user.email);
          $('.user-field-role').val(user.role);
        }
      });
      $(document).on('click', '.user-suspend', function () {
        var id = $(this).data('id');
        var users = APP.Store.get('users') || [];
        var user = users.find(function (u) { return u.id === id; });
        if (user) {
          user.status = user.status === 'Suspended' ? 'Active' : 'Suspended';
          APP.Store.set('users', users);
          APP.UI.toast('info', 'User status changed to ' + user.status);
          APP.addLog('Admin', (user.status === 'Suspended' ? 'Suspended' : 'Activated') + ' user: ' + user.name);
          APP.Users.render();
        }
      });
      $(document).on('click', '.user-approve', function () {
        var id = $(this).data('id');
        var users = APP.Store.get('users') || [];
        var user = users.find(function (u) { return u.id === id; });
        if (user) {
          user.status = 'Active';
          APP.Store.set('users', users);
          APP.UI.toast('success', 'User approved');
          APP.addLog('Admin', 'Approved user: ' + user.name);
          APP.Users.render();
        }
      });
      $(document).on('click', '.user-reject', function () {
        var id = $(this).data('id');
        APP.UI.confirm('Reject this user?', function () {
          var users = APP.Store.get('users') || [];
          var idx = users.findIndex(function (u) { return u.id === id; });
          if (idx >= 0) {
            users.splice(idx, 1);
            APP.Store.set('users', users);
            APP.UI.toast('info', 'User rejected and removed');
            APP.addLog('Admin', 'Rejected user');
            APP.Users.render();
          }
        });
      });
    }
  };

  // ─── Modal ────────────────────────────────────────────────────────
  APP.Modal = {
    open: function (title, bodyHtml, onSave) {
      var modalId = 'modal-custom';
      var $modal = $('#' + modalId);
      if ($modal.length) $modal.remove();
      var html = '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">' + title + '</h5><button type="button" class="close" data-dismiss="modal"><span>&times;</span></button></div><div class="modal-body">' + bodyHtml + '</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-primary modal-save-btn">Save</button></div></div></div></div>';
      $('body').append(html);
      $modal.modal('show');
      $modal.on('click', '.modal-save-btn', function () {
        if (onSave) onSave();
        $modal.modal('hide');
      });
      $modal.on('hidden.bs.modal', function () { $modal.remove(); });
    },

    alert: function (title, message) {
      APP.Modal.open(title, '<p>' + message + '</p>', function () {});
      $('.modal-save-btn').text('OK');
    }
  };

  // ─── Tutors ───────────────────────────────────────────────────────
  APP.Tutors = {
    render: function () {
      const tutors = APP.Store.get('tutors') || [];
      var $tbody = $('#admin-tutors-page .table tbody');
      if (!$tbody.length) $tbody = $('body').find('.table-responsive:visible').first().find('tbody');
      if (!$tbody.length || !$tbody.closest('.container-fluid').length) {
        $tbody = $('#section-verification').length ? $('#section-verification .table tbody') : null;
      }
      if (!$tbody) return;

      var targetTable = $('#admin-tutors-page').length ? '#admin-tutors-page' : '#section-tutors-list';
      $tbody = $(targetTable + ' .table tbody');
      if (!$tbody.length) {
        $tbody = $('h4.page-title:contains("Tutor Management")').closest('.container-fluid').find('.table tbody');
        if (!$tbody.length) return;
      }

      $tbody.empty();
      tutors.forEach(function (t) {
        var badge = 'status-' + t.status.toLowerCase();
        var rating = t.rating > 0 ? t.rating.toFixed(1) : '-';
        var actions = '';
        if (t.status === 'Pending') actions = '<button class="btn btn-sm btn-success tutor-approve" data-id="' + t.id + '">Approve</button> <button class="btn btn-sm btn-danger tutor-reject" data-id="' + t.id + '">Reject</button>';
        else actions = '<button class="btn btn-sm btn-primary tutor-view" data-id="' + t.id + '">View</button> <button class="btn btn-sm btn-danger tutor-suspend" data-id="' + t.id + '">' + (t.status === 'Suspended' ? 'Activate' : 'Suspend') + '</button>';
        $tbody.append('<tr><td>' + t.name + '</td><td>' + t.email + '</td><td>' + t.specialization + '</td><td>' + t.courses + '</td><td>' + rating + '</td><td><span class="status-badge ' + badge + '">' + t.status + '</span></td><td>' + actions + '</td></tr>');
      });

      $('.card-stats .numbers .card-title').each(function () {
        var label = $(this).closest('.numbers').find('.card-category').text().trim().toLowerCase();
        if (label.indexOf('total tutors') >= 0) $(this).text(tutors.length);
        else if (label === 'verified') $(this).text(tutors.filter(function (t) { return t.status === 'Verified'; }).length);
        else if (label.indexOf('pending') >= 0) $(this).text(tutors.filter(function (t) { return t.status === 'Pending'; }).length);
        else if (label === 'suspended' || label.indexOf('suspend') >= 0) $(this).text(tutors.filter(function (t) { return t.status === 'Suspended'; }).length);
      });
    },

    initEvents: function () {
      $(document).off('click', '.tutor-approve, .tutor-reject, .tutor-suspend, .tutor-view');
      $(document).on('click', '.tutor-approve', function () {
        var id = $(this).data('id');
        var tutors = APP.Store.get('tutors') || [];
        var tutor = tutors.find(function (t) { return t.id === id; });
        if (tutor) {
          tutor.status = 'Verified';
          APP.Store.set('tutors', tutors);
          APP.UI.toast('success', tutor.name + ' verified as tutor');
          APP.addLog('Admin', 'Approved tutor: ' + tutor.name);
          APP.Tutors.render();
        }
      });
      $(document).on('click', '.tutor-reject', function () {
        var id = $(this).data('id');
        APP.UI.confirm('Reject this tutor application?', function () {
          var tutors = APP.Store.get('tutors') || [];
          var idx = tutors.findIndex(function (t) { return t.id === id; });
          if (idx >= 0) {
            tutors.splice(idx, 1);
            APP.Store.set('tutors', tutors);
            APP.UI.toast('info', 'Tutor application rejected');
            APP.addLog('Admin', 'Rejected tutor application');
            APP.Tutors.render();
          }
        });
      });
      $(document).on('click', '.tutor-suspend', function () {
        var id = $(this).data('id');
        var tutors = APP.Store.get('tutors') || [];
        var tutor = tutors.find(function (t) { return t.id === id; });
        if (tutor) {
          tutor.status = tutor.status === 'Suspended' ? 'Verified' : 'Suspended';
          APP.Store.set('tutors', tutors);
          APP.UI.toast('info', 'Tutor ' + (tutor.status === 'Suspended' ? 'suspended' : 'activated'));
          APP.addLog('Admin', (tutor.status === 'Suspended' ? 'Suspended' : 'Activated') + ' tutor: ' + tutor.name);
          APP.Tutors.render();
        }
      });
      $(document).on('click', '.tutor-view', function () {
        var id = $(this).data('id');
        var tutors = APP.Store.get('tutors') || [];
        var tutor = tutors.find(function (t) { return t.id === id; });
        if (tutor) {
          APP.Modal.open('Tutor Profile: ' + tutor.name,
            '<p><strong>Email:</strong> ' + tutor.email + '</p><p><strong>Specialization:</strong> ' + tutor.specialization + '</p><p><strong>Qualifications:</strong> ' + tutor.qualifications + '</p><p><strong>Experience:</strong> ' + tutor.experience + ' years</p><p><strong>Rating:</strong> ' + (tutor.rating > 0 ? tutor.rating.toFixed(1) : 'N/A') + '</p><p><strong>Students:</strong> ' + tutor.students + '</p><p><strong>Sessions:</strong> ' + tutor.sessions + '</p><p><strong>Earnings:</strong> $' + tutor.earnings.toLocaleString() + '</p>',
            function () {});
          $('.modal-save-btn').text('Close');
        }
      });
    }
  };

  // ─── Courses ──────────────────────────────────────────────────────
  APP.Courses = {
    render: function () {
      const courses = APP.Store.get('courses') || [];
      const container = $('#section-courses');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      courses.forEach(function (c) {
        var badge = 'status-' + (c.status === 'Active' ? 'active' : (c.status === 'Pending Review' ? 'pending' : 'inactive'));
        var mod = c.status === 'Pending Review'
          ? '<button class="btn btn-sm btn-success course-approve" data-id="' + c.id + '">Approve</button> '
          : '';
        $tbody.append('<tr><td>' + c.name + '</td><td>' + c.tutor + '</td><td>' + c.students + '</td><td><span class="status-badge ' + badge + '">' + c.status + '</span></td><td>' + mod + '<button class="btn btn-sm btn-primary course-edit" data-id="' + c.id + '">Edit</button> <button class="btn btn-sm btn-danger course-delete" data-id="' + c.id + '">Delete</button></td></tr>');
      });
    },

    initEvents: function () {
      $(document).off('click', '.course-edit, .course-delete, .course-approve');
      $(document).on('click', '.course-approve', function () {
        var id = $(this).data('id');
        var courses = APP.Store.get('courses') || [];
        var course = courses.find(function (c) { return c.id === id; });
        if (course) {
          course.status = 'Active';
          APP.Store.set('courses', courses);
          APP.UI.toast('success', 'Course approved and published to discovery');
          APP.addLog('Admin', 'Approved course: ' + course.name);
          if (window.LR) LR.track('admin.course_approved', { id: id });
          APP.Courses.render();
        }
      });
      $(document).on('click', '.course-edit', function () {
        var id = $(this).data('id');
        var courses = APP.Store.get('courses') || [];
        var course = courses.find(function (c) { return c.id === id; });
        if (course) {
          APP.Modal.open('Edit Course',
            '<div class="form-group"><label>Name</label><input type="text" class="form-control course-f-name" value="' + course.name + '"></div><div class="form-group"><label>Price ($)</label><input type="number" step="0.01" class="form-control course-f-price" value="' + course.price + '"></div><div class="form-group"><label>Status</label><select class="form-control course-f-status"><option ' + (course.status === 'Active' ? 'selected' : '') + '>Active</option><option ' + (course.status === 'Pending Review' ? 'selected' : '') + '>Pending Review</option><option ' + (course.status === 'Inactive' ? 'selected' : '') + '>Inactive</option></select></div>',
            function () {
              course.name = $('.course-f-name').val();
              course.price = parseFloat($('.course-f-price').val()) || 0;
              course.status = $('.course-f-status').val();
              APP.Store.set('courses', courses);
              APP.UI.toast('success', 'Course updated');
              APP.addLog('Admin', 'Updated course: ' + course.name);
              APP.Courses.render();
            });
        }
      });
      $(document).on('click', '.course-delete', function () {
        var id = $(this).data('id');
        APP.UI.confirm('Delete this course?', function () {
          var courses = APP.Store.get('courses') || [];
          var idx = courses.findIndex(function (c) { return c.id === id; });
          if (idx >= 0) {
            APP.addLog('Admin', 'Deleted course: ' + courses[idx].name);
            courses.splice(idx, 1);
            APP.Store.set('courses', courses);
            APP.UI.toast('info', 'Course deleted');
            APP.Courses.render();
          }
        });
      });
    }
  };

  // ─── Bookings ─────────────────────────────────────────────────────
  APP.Bookings = {
    render: function () {
      const bookings = APP.Store.get('bookings') || [];
      const container = $('#section-bookings');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      bookings.forEach(function (b) {
        var badge = 'status-' + b.status.toLowerCase();
        $tbody.append('<tr><td>#' + b.id + '</td><td>' + b.student + '</td><td>' + b.tutor + '</td><td>' + b.date + '</td><td><span class="status-badge ' + badge + '">' + b.status + '</span></td></tr>');
      });
    }
  };

  // ─── Payments ─────────────────────────────────────────────────────
  APP.Payments = {
    render: function () {
      const payments = APP.Store.get('payments') || [];
      const container = $('#section-payments');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      payments.forEach(function (p) {
        var badge = 'status-' + p.status.toLowerCase();
        $tbody.append('<tr><td>#' + p.id + '</td><td>' + p.user + '</td><td>$' + p.amount.toFixed(2) + '</td><td>' + p.date + '</td><td><span class="status-badge ' + badge + '">' + p.status + '</span></td></tr>');
      });
    }
  };

  // ─── Payouts ──────────────────────────────────────────────────────
  APP.Payouts = {
    render: function () {
      const payouts = APP.Store.get('payouts') || [];
      const container = $('#section-payouts');
      if (!container.length) {
        if ($('h4.page-title:contains("Payout")').length) {
          var tbody = $('h4.page-title:contains("Payout")').closest('.container-fluid').find('.table tbody');
          if (tbody.length) {
            tbody.empty();
            payouts.forEach(function (p) {
              var badge = 'status-' + p.status.toLowerCase();
              var actions = p.status === 'Pending' ? '<button class="btn btn-sm btn-success payout-approve" data-id="' + p.id + '">Approve</button> <button class="btn btn-sm btn-danger payout-reject" data-id="' + p.id + '">Reject</button>' : '<button class="btn btn-sm btn-primary">View</button>';
              tbody.append('<tr><td>#' + p.id + '</td><td>' + p.tutor + '</td><td>$' + p.amount.toFixed(2) + '</td><td>' + p.method + '</td><td>' + p.date + '</td><td><span class="status-badge ' + badge + '">' + p.status + '</span></td><td>' + actions + '</td></tr>');
            });
          }
        }
        return;
      }
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      payouts.forEach(function (p) {
        var badge = 'status-' + p.status.toLowerCase();
        var actions = p.status === 'Pending' ? '<button class="btn btn-sm btn-success payout-approve" data-id="' + p.id + '">Approve</button> <button class="btn btn-sm btn-danger payout-reject" data-id="' + p.id + '">Reject</button>' : '<button class="btn btn-sm btn-primary">View</button>';
        $tbody.append('<tr><td>#' + p.id + '</td><td>' + p.tutor + '</td><td>$' + p.amount.toFixed(2) + '</td><td>' + p.method + '</td><td>' + p.date + '</td><td><span class="status-badge ' + badge + '">' + p.status + '</span></td><td>' + actions + '</td></tr>');
      });
    },

    initEvents: function () {
      $(document).off('click', '.payout-approve, .payout-reject');
      $(document).on('click', '.payout-approve', function () {
        var id = $(this).data('id');
        var payouts = APP.Store.get('payouts') || [];
        var payout = payouts.find(function (p) { return p.id === id; });
        if (payout) {
          payout.status = 'Completed';
          APP.Store.set('payouts', payouts);
          APP.UI.toast('success', 'Payout approved');
          APP.addLog('Admin', 'Approved payout: ' + payout.id + ' to ' + payout.tutor);
          APP.Payouts.render();
        }
      });
      $(document).on('click', '.payout-reject', function () {
        var id = $(this).data('id');
        APP.UI.confirm('Reject this payout?', function () {
          var payouts = APP.Store.get('payouts') || [];
          var idx = payouts.findIndex(function (p) { return p.id === id; });
          if (idx >= 0) {
            payouts.splice(idx, 1);
            APP.Store.set('payouts', payouts);
            APP.UI.toast('info', 'Payout rejected');
            APP.addLog('Admin', 'Rejected payout');
            APP.Payouts.render();
          }
        });
      });
    }
  };

  // ─── Complaints ───────────────────────────────────────────────────
  APP.Complaints = {
    render: function () {
      const complaints = APP.Store.get('complaints') || [];
      const container = $('#section-complaints');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      complaints.forEach(function (c) {
        var badge = c.status === 'Open' ? 'status-pending' : 'status-completed';
        var actions = c.status === 'Open' ? '<button class="btn btn-sm btn-success complaint-resolve" data-id="' + c.id + '">Resolve</button>' : '<button class="btn btn-sm btn-primary">View</button>';
        $tbody.append('<tr><td>#' + c.id + '</td><td>' + c.from + '</td><td>' + c.type + '</td><td>' + c.date + '</td><td><span class="status-badge ' + badge + '">' + c.status + '</span></td><td>' + actions + '</td></tr>');
      });
    },

    initEvents: function () {
      $(document).off('click', '.complaint-resolve');
      $(document).on('click', '.complaint-resolve', function () {
        var id = $(this).data('id');
        var complaints = APP.Store.get('complaints') || [];
        var complaint = complaints.find(function (c) { return c.id === id; });
        if (complaint) {
          complaint.status = 'Resolved';
          APP.Store.set('complaints', complaints);
          APP.UI.toast('success', 'Complaint resolved');
          APP.addLog('Admin', 'Resolved complaint: ' + complaint.id);
          APP.Complaints.render();
        }
      });
    }
  };

  // ─── Content ──────────────────────────────────────────────────────
  APP.Content = {
    render: function () {
      const content = APP.Store.get('content') || {};
      const container = $('#section-content');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      Object.keys(content).forEach(function (key) {
        var page = content[key];
        var badge = page.status === 'Published' ? 'status-active' : 'status-pending';
        $tbody.append('<tr><td>' + page.title + '</td><td>' + page.lastUpdated + '</td><td><span class="status-badge ' + badge + '">' + page.status + '</span></td><td><button class="btn btn-sm btn-primary content-edit" data-key="' + key + '">Edit</button></td></tr>');
      });
    },

    initEvents: function () {
      $(document).off('click', '.content-edit');
      $(document).on('click', '.content-edit', function () {
        var key = $(this).data('key');
        var content = APP.Store.get('content') || {};
        var page = content[key];
        if (page) {
          APP.Modal.open('Edit: ' + page.title,
            '<div class="form-group"><label>Title</label><input type="text" class="form-control content-f-title" value="' + page.title + '"></div><div class="form-group"><label>Status</label><select class="form-control content-f-status"><option ' + (page.status === 'Published' ? 'selected' : '') + '>Published</option><option ' + (page.status === 'Draft' ? 'selected' : '') + '>Draft</option></select></div>',
            function () {
              page.title = $('.content-f-title').val();
              page.status = $('.content-f-status').val();
              page.lastUpdated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              content[key] = page;
              APP.Store.set('content', content);
              APP.UI.toast('success', 'Page updated');
              APP.addLog('Admin', 'Updated content: ' + page.title);
              APP.Content.render();
            });
        }
      });
    }
  };

  // ─── Settings / Website ──────────────────────────────────────────
  APP.Settings = {
    load: function () {
      const s = APP.Store.get('settings') || {};
      $.each(s, function (key, val) {
        var $el = $('[data-setting="' + key + '"]');
        if ($el.length) {
          if ($el.is(':checkbox')) $el.prop('checked', val);
          else if ($el.is('select')) $el.val(val);
          else $el.val(val);
        }
      });
    },

    save: function (scope) {
      const s = APP.Store.get('settings') || {};
      var prefix = scope ? '[data-setting-scope="' + scope + '"]' : '';
      $(prefix + ' [data-setting]').each(function () {
        var key = $(this).data('setting');
        if ($(this).is(':checkbox')) s[key] = $(this).prop('checked');
        else if ($(this).is('select')) s[key] = $(this).val();
        else s[key] = $(this).val();
      });
      APP.Store.set('settings', s);
      APP.UI.toast('success', 'Settings saved');
      APP.addLog('Admin', 'Updated ' + (scope || 'general') + ' settings');
    },

    initEvents: function () {
      $(document).off('click', '[data-save-settings]');
      $(document).on('click', '[data-save-settings]', function () {
        var scope = $(this).data('save-settings');
        APP.Settings.save(scope || '');
      });
    }
  };

  // ─── Activity Logs ────────────────────────────────────────────────
  APP.ActivityLogs = {
    render: function () {
      const logs = APP.Store.get('activityLogs') || [];
      const container = $('#section-logs');
      if (!container.length) return;
      var $tbody = container.find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      logs.slice(0, 10).forEach(function (l) {
        $tbody.append('<tr><td>' + l.timestamp + '</td><td>' + l.user + '</td><td>' + l.action + '</td><td>' + l.ip + '</td></tr>');
      });
    }
  };

  // ─── Render All ───────────────────────────────────────────────────
  APP.renderAll = function () {
    APP.Dashboard.render();
    APP.Dashboard.renderRecentRegistrations();
    APP.Users.render();
    APP.Tutors.render();
    APP.Courses.render();
    APP.Bookings.render();
    APP.Payments.render();
    APP.Payouts.render();
    APP.Complaints.render();
    APP.Content.render();
    APP.ActivityLogs.render();
    APP.UI.renderNotifications();
    APP.UI.updateNotificationBadge();
  };

  // ─── Init ─────────────────────────────────────────────────────────
  APP.init = function () {
    // Load saved password
    var savedPw = APP.Store.get('_adminPassword');
    if (savedPw) APP.adminPassword = savedPw;

    // Seed data on first run
    APP.seedData();

    // Check auth
    if (!APP.auth.isLoggedIn()) {
      APP.UI.showLogin();
    }

    // Bind login
    $(document).off('click', '#login-btn');
    $(document).on('click', '#login-btn', function () {
      var pw = $('#login-password').val();
      if (APP.auth.login(pw)) {
        APP.UI.hideLogin();
        APP.renderAll();
        APP.UI.toast('success', 'Welcome to LearnRoomTutor Admin');
      } else {
        $('#login-error').show().fadeOut(3000);
      }
    });

    $(document).off('keypress', '#login-password');
    $(document).on('keypress', '#login-password', function (e) {
      if (e.which === 13) $('#login-btn').click();
    });

    // Logout
    $(document).off('click', '.dropdown-user a[href*="index.html"]');
    $(document).on('click', '.dropdown-user a[href*="index.html"]', function (e) {
      e.preventDefault();
      APP.auth.logout();
    });

    // Init all events
    APP.Users.initEvents();
    APP.Tutors.initEvents();
    APP.Courses.initEvents();
    APP.Payouts.initEvents();
    APP.Complaints.initEvents();
    APP.Content.initEvents();
    APP.Settings.initEvents();

    // Re-render when sidebar navigates to a new section
    $(document).on('click', '.sidebar a[href^="#"]', function () {
      var href = $(this).attr('href');
      var sectionId = href.substring(1);
      setTimeout(function () {
        APP.renderAll();
        if (sectionId === 'section-settings' || sectionId === 'section-config' || sectionId === 'section-website') {
          APP.Settings.load();
        }
      }, 100);
    });

    // Load settings on settings pages
    setTimeout(function () {
      APP.Settings.load();
    }, 300);

    // Render if already visible
    if (APP.auth.isLoggedIn()) {
      APP.renderAll();
    }

    // Handle "Add User" button
    $(document).off('click', '.card-header .btn-primary:contains("Add User")');
    $(document).on('click', '.card-header .btn-primary:contains("Add User")', function () {
      APP.Modal.open('Add User',
        '<div class="form-group"><label>Name</label><input type="text" class="form-control user-add-name"></div><div class="form-group"><label>Email</label><input type="email" class="form-control user-add-email"></div><div class="form-group"><label>Role</label><select class="form-control user-add-role"><option>Student</option><option>Tutor</option><option>Admin</option></select></div>',
        function () {
          var users = APP.Store.get('users') || [];
          var id = users.length ? Math.max.apply(null, users.map(function (u) { return u.id; })) + 1 : 1;
          users.push({
            id: id,
            name: $('.user-add-name').val(),
            email: $('.user-add-email').val(),
            role: $('.user-add-role').val(),
            status: 'Active',
            joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            phone: '',
            bio: ''
          });
          APP.Store.set('users', users);
          APP.UI.toast('success', 'User added');
          APP.addLog('Admin', 'Added new user: ' + $('.user-add-name').val());
          APP.Users.render();
        });
    });

    // Search tutor functionality
    $(document).off('keyup', 'input[placeholder="Search tutors..."]');
    $(document).on('keyup', 'input[placeholder="Search tutors..."]', function () {
      var q = $(this).val().toLowerCase();
      var tutors = APP.Store.get('tutors') || [];
      var $tbody = $(this).closest('.container-fluid').find('.table tbody');
      if (!$tbody.length) return;
      $tbody.empty();
      var filtered = tutors.filter(function (t) { return t.name.toLowerCase().indexOf(q) >= 0 || t.email.toLowerCase().indexOf(q) >= 0 || t.specialization.toLowerCase().indexOf(q) >= 0; });
      filtered.forEach(function (t) {
        var badge = 'status-' + t.status.toLowerCase();
        var rating = t.rating > 0 ? t.rating.toFixed(1) : '-';
        var actions = t.status === 'Pending' ? '<button class="btn btn-sm btn-success tutor-approve" data-id="' + t.id + '">Approve</button> <button class="btn btn-sm btn-danger tutor-reject" data-id="' + t.id + '">Reject</button>' : '<button class="btn btn-sm btn-primary tutor-view" data-id="' + t.id + '">View</button> <button class="btn btn-sm btn-danger tutor-suspend" data-id="' + t.id + '">' + (t.status === 'Suspended' ? 'Activate' : 'Suspend') + '</button>';
        $tbody.append('<tr><td>' + t.name + '</td><td>' + t.email + '</td><td>' + t.specialization + '</td><td>' + t.courses + '</td><td>' + rating + '</td><td><span class="status-badge ' + badge + '">' + t.status + '</span></td><td>' + actions + '</td></tr>');
      });
    });

    // Global search in admin header
    $(document).off('keyup', '.nav-search input');
    $(document).on('keyup', '.nav-search input', function () {
      var q = $(this).val().toLowerCase().trim();
      if (q.length < 2) return;
      var users = APP.Store.get('users') || [];
      var tutors = APP.Store.get('tutors') || [];
      var courses = APP.Store.get('courses') || [];
      var results = [];
      users.forEach(function (u) { if (u.name.toLowerCase().indexOf(q) >= 0) results.push({ type: 'User', name: u.name, section: '#section-users' }); });
      tutors.forEach(function (t) { if (t.name.toLowerCase().indexOf(q) >= 0) results.push({ type: 'Tutor', name: t.name, section: '#section-verification' }); });
      courses.forEach(function (c) { if (c.name.toLowerCase().indexOf(q) >= 0) results.push({ type: 'Course', name: c.name, section: '#section-courses' }); });
      if (results.length) {
        var html = results.slice(0, 5).map(function (r) { return '<a href="' + r.section + '" class="list-group-item list-group-item-action">' + r.type + ': ' + r.name + '</a>'; }).join('');
        var $sr = $('#search-results');
        if (!$sr.length) {
          $('body').append('<div id="search-results" class="list-group" style="position:fixed;top:70px;left:250px;z-index:9999;width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15);"></div>');
          $sr = $('#search-results');
        }
        $sr.html(html).show();
        $sr.find('a').on('click', function () { $sr.hide(); });
      } else {
        $('#search-results').hide();
      }
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('.nav-search').length) {
        $('#search-results').hide();
      }
    });

    console.log('LearnRoomTutor CMS initialized (v' + APP.version + ')');
  };

  // ─── Boot ─────────────────────────────────────────────────────────
  $(document).ready(function () {
    APP.init();
  });

  window.LRTCMS = APP;

})(jQuery);
