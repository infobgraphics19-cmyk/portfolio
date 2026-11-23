(function () {
  'use strict';
  var root = document.getElementById('adbho-root');
  if (!root || root.getAttribute('data-adbho-ready')) { return; }
  root.setAttribute('data-adbho-ready', '1');

  // Height of a fixed or sticky site header, so jump links don't hide headings under it.
  function headerOffset() {
    var max = 0;
    var els = document.querySelectorAll('header, .site-header, #masthead, .elementor-location-header, [data-sticky]');
    for (var i = 0; i < els.length; i++) {
      var cs = window.getComputedStyle(els[i]);
      if ((cs.position === 'fixed' || cs.position === 'sticky') && els[i].offsetHeight < window.innerHeight / 2) {
        max = Math.max(max, els[i].getBoundingClientRect().bottom);
      }
    }
    if (document.body.classList.contains('admin-bar')) { max = Math.max(max, 32); }
    return Math.round(max) + 16;
  }

  function setOffset() { root.style.setProperty('--adbho-offset', headerOffset() + 'px'); }
  setOffset();
  window.addEventListener('resize', setOffset);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth in-page jumps for links that point at this page's own sections only.
  root.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href*="#adbho-"]') : null;
    if (!link || !root.contains(link)) { return; }
    var href = link.getAttribute('href');
    var hash = href.slice(href.indexOf('#'));
    var path = href.slice(0, href.indexOf('#'));
    if (path && path.replace(/\/$/, '') !== window.location.pathname.replace(/\/$/, '')) { return; }
    var target = document.getElementById(hash.slice(1));
    if (!target) { return; }
    e.preventDefault();
    e.stopPropagation();
    setOffset();
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    if (window.history && window.history.replaceState) { window.history.replaceState(null, '', hash); }
  }, true);

  // FAQ: keep one answer open at a time.
  var faqs = root.querySelectorAll('.adbho-faq details');
  for (var i = 0; i < faqs.length; i++) {
    faqs[i].addEventListener('toggle', function () {
      if (!this.open) { return; }
      for (var j = 0; j < faqs.length; j++) { if (faqs[j] !== this) { faqs[j].open = false; } }
    });
  }
})();
