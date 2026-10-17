(function () {
  var base = document.body.getAttribute('data-base') || '';
  var index = window.HC_INDEX || [];

  /* mobile menu */
  var header = document.getElementById('hc-header');
  var menuBtn = header && header.querySelector('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = header.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  /* search with inline results */
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function score(words, title) {
    var t = norm(title), n = 0;
    for (var i = 0; i < words.length; i++) { if (t.indexOf(words[i]) === -1) return 0; n += t.indexOf(words[i]) === 0 ? 3 : 1; }
    return n;
  }
  document.querySelectorAll('form.search').forEach(function (form) {
    var input = form.querySelector('input');
    var box = form.querySelector('.search-results');
    var scope = form.getAttribute('data-scope');
    var topicSlug = (location.pathname.match(/topics\/([a-z0-9-]+)\.html/) || [])[1];
    function close() { box.hidden = true; box.innerHTML = ''; }
    function run() {
      var q = norm(input.value);
      if (scope === 'topic') {
        var rows = document.querySelectorAll('.list li');
        var any = false;
        rows.forEach(function (li) {
          var show = !q || li.querySelector('.row').getAttribute('data-title').indexOf(q) !== -1;
          li.hidden = !show; if (show) any = true;
        });
        document.querySelectorAll('.sec-title').forEach(function (h) {
          var next = h.nextElementSibling; var visible = next && next.querySelector('li:not([hidden])');
          h.hidden = !visible; if (next) next.hidden = !visible;
        });
        var nm = document.querySelector('.no-match'); if (nm) nm.hidden = any;
        return;
      }
      if (q.length < 2) { close(); return; }
      var words = q.split(' ');
      var hits = index.map(function (a) { return { a: a, s: score(words, a.t) }; })
        .filter(function (h) { return h.s > 0; })
        .sort(function (x, y) { return y.s - x.s; }).slice(0, 8);
      if (!hits.length) { box.innerHTML = '<div class="sr-empty">No articles match “' + input.value.replace(/</g, '&lt;') + '”. Try fewer words.</div>'; box.hidden = false; return; }
      box.innerHTML = hits.map(function (h) {
        return '<a role="option" href="' + base + h.a.u + '"><span class="t">' + h.a.t.replace(/</g, '&lt;') + '</span><span class="c">' + h.a.c + '</span></a>';
      }).join('');
      box.hidden = false;
    }
    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (scope === 'topic') return;
      var first = box.querySelector('a'); if (first) location.href = first.getAttribute('href');
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); input.blur(); } });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { var f = document.querySelector('form.search input'); if (f) { e.preventDefault(); f.focus(); } }
  });

  /* article: feedback, copy link, TOC highlight */
  var fb = document.querySelector('[data-feedback]');
  if (fb) fb.querySelectorAll('[data-vote]').forEach(function (b) {
    b.addEventListener('click', function () {
      fb.querySelectorAll('[data-vote]').forEach(function (x) { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('selected'); b.setAttribute('aria-pressed', 'true');
      fb.querySelector('[data-thanks]').hidden = false;
    });
  });
  var copy = document.querySelector('[data-copy]');
  if (copy) copy.addEventListener('click', function () {
    var done = function () { var old = copy.innerHTML; copy.textContent = 'Link copied'; setTimeout(function () { copy.innerHTML = old; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
  var toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {};
    toc.forEach(function (a) { var el = document.querySelector(a.getAttribute('href')); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { toc.forEach(function (a) { a.classList.remove('active'); }); map[en.target.id].classList.add('active'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
