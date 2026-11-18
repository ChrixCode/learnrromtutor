/* ============================================================
   2TORS.NG — SHARED DASHBOARD SHELL
   4-Role Platform: Administrator | Tutor | Parent | Student
   No school role. Schools are managed by admin internally.
   ============================================================ */
(function ($) {
  'use strict';

  window.LR = window.LR || {};

  LR.nav = {

    /* ── PARENT / GUARDIAN ── (data-lr-shell="learner") */
    learner: [
      { href: '#section-dashboard',     icon: 'la la-home',              label: 'Family Overview',    badge: '3' },
      { href: '#section-children',      icon: 'la la-child',             label: 'My Students' },
      { href: '#section-booking',       icon: 'la la-search',            label: 'Find & Book a Tutor' },
      { href: '#section-bookings',      icon: 'la la-calendar',          label: 'Booking History' },
      { href: '#section-sessions',      icon: 'la la-video-camera',      label: 'Upcoming Sessions' },
      { href: '#section-reports',       icon: 'la la-file-text',         label: 'Progress Reports',   badge: '2', badgeClass: 'badge-success' },
      { href: '#section-assignments',   icon: 'la la-tasks',             label: 'Assignments',        badge: '1', badgeClass: 'badge-danger' },
      { href: '#section-guardians',     icon: 'la la-users',             label: 'Guardians & Access' },
      { href: '#section-notifications', icon: 'la la-bell',              label: 'Notifications',      badge: '3' },
      { href: '#section-messages',      icon: 'la la-envelope',          label: 'Messages' },
      { href: '#section-payments',      icon: 'la la-credit-card',       label: 'Payment History' },
      { href: '#section-settings',      icon: 'la la-cog',               label: 'Account Settings' }
    ],

    /* ── TUTOR / EDUCATOR ── (data-lr-shell="tutor") */
    tutor: [
      { href: '#section-dashboard',     icon: 'la la-dashboard',         label: 'Dashboard',          badge: '4' },
      { href: '#section-profile',       icon: 'la la-user',              label: 'My Profile' },
      { href: '#section-verification',  icon: 'la la-id-card',           label: 'Verification',       badge: '1', badgeClass: 'badge-warning' },
      { href: '#section-availability',  icon: 'la la-calendar',          label: 'Availability' },
      { href: '#section-approval',      icon: 'la la-check-circle',      label: 'Booking Requests',   badge: '4', badgeClass: 'badge-danger' },
      { href: '#section-schedule',      icon: 'la la-clock-o',           label: 'Session Schedule' },
      { href: '#section-students',      icon: 'la la-users',             label: 'My Students' },
      { href: '#section-assignments',   icon: 'la la-file-text',         label: 'Assignments' },
      { href: '#section-reports',       icon: 'la la-bar-chart',         label: 'Progress Reports' },
      { href: '#section-earnings',      icon: 'la la-money',             label: 'Earnings & Payouts' },
      { href: '#section-notifications', icon: 'la la-bell',              label: 'Notifications' },
      { href: '#section-messages',      icon: 'la la-envelope',          label: 'Messages' },
      { href: '#section-settings',      icon: 'la la-cog',               label: 'Account Settings' }
    ],

    /* ── STUDENT / LEARNER ── (data-lr-shell="student") */
    student: [
      { href: '#section-dashboard',     icon: 'la la-home',              label: 'My Dashboard' },
      { href: '#section-sessions',      icon: 'la la-calendar',          label: 'Upcoming Lessons' },
      { href: '#section-assignments',   icon: 'la la-tasks',             label: 'Assignments',        badge: '2', badgeClass: 'badge-danger' },
      { href: '#section-reports',       icon: 'la la-bar-chart',         label: 'My Progress' },
      { href: '#section-subjects',      icon: 'la la-book',              label: 'My Subjects' },
      { href: '#section-tutors',        icon: 'la la-graduation-cap',    label: 'My Tutors' },
      { href: '#section-notifications', icon: 'la la-bell',              label: 'Notifications' }
    ],

    /* ── PLATFORM ADMINISTRATOR ── (data-lr-shell="admin") */
    admin: [
      { href: '#section-dashboard',     icon: 'la la-dashboard',         label: 'Platform Overview',  badge: '5' },
      { href: '#section-users',         icon: 'la la-users',             label: 'User Management',    badge: '4' },
      { href: '#section-verification',  icon: 'la la-id-card',           label: 'Tutor Verification', badge: '3', badgeClass: 'badge-success' },
      { href: '#section-bookings',      icon: 'la la-calendar',          label: 'Booking Overview' },
      { href: '#section-categories',    icon: 'la la-tags',              label: 'Subjects & Categories' },
      { href: '#section-reports',       icon: 'la la-bar-chart',         label: 'Reports & Analytics' },
      { href: '#section-safeguarding',  icon: 'la la-shield',            label: 'Safeguarding',       badge: '2', badgeClass: 'badge-danger' },
      { href: '#section-complaints',    icon: 'la la-ticket',            label: 'Support Tickets',    badge: '5' },
      { href: '#section-logs',          icon: 'la la-history',           label: 'Audit Logs' },
      { href: '#section-roles',         icon: 'la la-lock',              label: 'Roles & Permissions' },
      { href: '#section-config',        icon: 'la la-cog',               label: 'Platform Settings' }
    ]

  };

  LR.shell = {
    renderSidebar: function (role) {
      var items = LR.nav[role];
      var $ul = $('ul.nav[data-lr-nav="' + role + '"]');
      if (!items || !$ul.length) return false;
      $ul.empty();
      items.forEach(function (it, idx) {
        var href = it.href;
        var badge = it.badge
          ? '<span class="badge ' + (it.badgeClass || 'badge-count') + '">' + it.badge + '</span>'
          : '';
        var liClass = 'nav-item' + (idx === 0 ? ' active' : '');
        $ul.append(
          '<li class="' + liClass + '">' +
            '<a href="' + href + '">' +
              '<i class="' + it.icon + '"></i>' +
              '<p>' + it.label + '</p>' +
              badge +
            '</a>' +
          '</li>'
        );
      });
      return true;
    },
    init: function () {
      var role = $('body').attr('data-lr-shell');
      if (role) this.renderSidebar(role);
    }
  };

  $(document).ready(function () { LR.shell.init(); });

})(jQuery);
