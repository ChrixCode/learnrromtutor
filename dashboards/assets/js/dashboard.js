(function ($) {
  "use strict";

  function switchSection(sectionId) {
    $('.dashboard-section').hide();
    $('#' + sectionId).show();
    $('.sidebar .nav-item').removeClass('active');
    $('.sidebar a[href="#' + sectionId + '"]').closest('.nav-item').addClass('active');
    if ($(window).width() < 768) {
      $('html').removeClass('nav_open');
      $('.sidenav-toggler').removeClass('toggled');
    }
    window.location.hash = sectionId;
    $('html, body').animate({ scrollTop: 0 }, 300);
  }

  $(document).on('click', '.sidebar a[href^="#"]', function (e) {
    var href = $(this).attr('href');
    var sectionId = href.substring(1);
    if ($('#' + sectionId).length) {
      e.preventDefault();
      switchSection(sectionId);
    }
  });

  if (window.location.hash) {
    var hash = window.location.hash.substring(1);
    if ($('#' + hash).length) {
      switchSection(hash);
    }
  }

  $(window).on('resize', function () {
    if ($(window).width() >= 768) {
      $('html').removeClass('nav_open');
      $('.sidenav-toggler').removeClass('toggled');
    }
  });

  $('[data-toggle="tooltip"]').tooltip();

  if (jQuery.fn.scrollbar) {
    jQuery('.scrollbar-inner').scrollbar();
  }

  $('.sidenav-toggler').click(function () {
    if ($('html').hasClass('nav_open')) {
      $('html').removeClass('nav_open');
      $(this).removeClass('toggled');
    } else {
      $('html').addClass('nav_open');
      $(this).addClass('toggled');
    }
  });

  $('.topbar-toggler').click(function () {
    if ($('html').hasClass('topbar_open')) {
      $('html').removeClass('topbar_open');
      $(this).removeClass('toggled');
    } else {
      $('html').addClass('topbar_open');
      $(this).addClass('toggled');
    }
  });

  $('.select-all-checkbox').change(function () {
    var target = $(this).attr('data-target');
    $(target).prop('checked', $(this).prop('checked'));
  });

  $('.navbar-collapse a').on('click', function () {
    $('.navbar-collapse').collapse('hide');
  });

  $(window).scroll(function () {
    if ($('.navbar').length && $('.navbar').offset().top > 50) {
      $('.navbar-fixed-top').addClass('top-nav-collapse');
    } else if ($('.navbar').length) {
      $('.navbar-fixed-top').removeClass('top-nav-collapse');
    }
    if ($(window).scrollTop() > 300) {
      $('#back-to-top').fadeIn();
    } else {
      $('#back-to-top').fadeOut();
    }
  });

  if ($('.home-slider').length) {
    $('.home-slider').owlCarousel({
      animateOut: 'fadeOut', items: 1, loop: true, dots: false,
      autoplayHoverPause: false, autoplay: true, smartSpeed: 1000
    });
  }

  if ($('.owl-courses').length) {
    $('.owl-courses').owlCarousel({
      animateOut: 'fadeOut', loop: true, autoplayHoverPause: false,
      autoplay: true, smartSpeed: 1000, dots: false, nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
      responsiveClass: true,
      responsive: { 0: { items: 1 }, 1000: { items: 3 } }
    });
  }

  if ($('.owl-client').length) {
    $('.owl-client').owlCarousel({
      animateOut: 'fadeOut', loop: true, autoplayHoverPause: false,
      autoplay: true, smartSpeed: 1000,
      responsiveClass: true,
      responsive: { 0: { items: 1 }, 1000: { items: 3 } }
    });
  }

  $(window).on('load', function () {
    $('.preloader').fadeOut(1000);
  });

  $(function () {
    $('.custom-navbar a, #home a').on('click', function (event) {
      if ($(this).attr('href') && $(this).attr('href').indexOf('#') === 0) {
        var $anchor = $(this);
        $('html, body').stop().animate({
          scrollTop: $($anchor.attr('href')).offset().top - 49
        }, 1000);
        event.preventDefault();
      }
    });
  });

  $(document).on('click', '#back-to-top', function () {
    $('html, body').animate({ scrollTop: 0 }, 500);
  });

  $(document).on('click', '.toggle-password', function () {
    var input = $($(this).attr('data-target'));
    if (input.attr('type') === 'password') {
      input.attr('type', 'text');
      $(this).removeClass('la la-eye').addClass('la la-eye-slash');
    } else {
      input.attr('type', 'password');
      $(this).removeClass('la la-eye-slash').addClass('la la-eye');
    }
  });

  $(document).on('click', '.form-check-input.task-select', function () {
    var row = $(this).closest('tr');
    if ($(this).prop('checked')) {
      row.addClass('table-active');
    } else {
      row.removeClass('table-active');
    }
  });

  if ($('.select-all-checkbox').length) {
    $('.select-all-checkbox').on('change', function () {
      var target = $(this).attr('data-target');
      $(target).each(function () {
        var row = $(this).closest('tr');
        if ($(this).prop('checked')) {
          row.addClass('table-active');
        } else {
          row.removeClass('table-active');
        }
      });
    });
  }

})(jQuery);
