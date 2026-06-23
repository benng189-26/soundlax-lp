/* ===================================================================
   Bentoji Studio - shared site behaviour
   =================================================================== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- Lenis smooth scrolling ---- */
    var lenis = null;
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }

    /* ---- in-page anchor smooth scroll (delegated, covers dynamically-added links) ---- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var h = a.getAttribute('href');
      if (!h || h.length < 2) return;
      var t = document.querySelector(h);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -90, duration: 1.1 });
      else t.scrollIntoView({ behavior: 'smooth' });
    });

    /* ---- external links open in new tab ---- */
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    /* ---- mobile menu ---- */
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.documentElement.style.overflow = open ? 'hidden' : '';
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.documentElement.style.overflow = '';
        });
      });
    }

    /* ---- scroll reveal (once) ---- */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---- CMS-driven content (homepage / contact) ----
       Text nodes use data-cms="dotted.path". Repeatable sections
       (services / why / process) are rendered from arrays, replacing the
       hard-coded HTML fallback only once the JSON loads successfully. ---- */
    if (document.querySelector('[data-cms]')) {
      function escCms(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }
      function dig(obj, path) {
        return path.split('.').reduce(function (o, k) { return (o == null) ? o : o[k]; }, obj);
      }
      function pad(n) { return (n < 10 ? '0' : '') + n; }
      function reobserve(scope) {
        var nodes = scope.querySelectorAll('.reveal');
        if ('IntersectionObserver' in window) {
          var o = new IntersectionObserver(function (en) {
            en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } });
          }, { threshold: 0.12 });
          nodes.forEach(function (el) { o.observe(el); });
        } else {
          nodes.forEach(function (el) { el.classList.add('in'); });
        }
      }
      var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

      function renderServices(items) {
        var grid = document.querySelector('[data-svc-grid]');
        if (!grid || !items || !items.length) return;
        grid.innerHTML = items.map(function (it, i) {
          var paras = (it.paragraphs || []).map(function (x) { return '<p>' + escCms(x) + '</p>'; }).join('');
          var list  = (it.list || []).map(function (li) { return '<li>' + escCms(li) + '</li>'; }).join('');
          return '<div class="svc-exp reveal' + (i % 2 ? ' d2' : '') + '">' +
            '<span class="num">' + pad(i + 1) + '</span>' +
            '<h4>' + escCms(it.title) + '</h4>' +
            (it.tagline ? '<p class="svc-tagline">' + escCms(it.tagline) + '</p>' : '') +
            paras +
            (it.listLabel ? '<p class="svc-list-label">' + escCms(it.listLabel) + '</p>' : '') +
            (list ? '<ul>' + list + '</ul>' : '') +
            (it.linkText ? '<a class="svc-link" href="/contact">' + escCms(it.linkText) + ' ' + arrow + '</a>' : '') +
          '</div>';
        }).join('');
        reobserve(grid);
      }
      function renderWhy(items) {
        var grid = document.querySelector('[data-why-grid]');
        if (!grid || !items || !items.length) return;
        grid.innerHTML = items.map(function (it, i) {
          return '<div class="why-item reveal' + (i % 2 ? ' d2' : '') + '">' +
            '<h4>' + escCms(it.title) + '</h4><p>' + escCms(it.body) + '</p></div>';
        }).join('');
        reobserve(grid);
      }
      function renderProcess(items) {
        var grid = document.querySelector('[data-process-grid]');
        if (!grid || !items || !items.length) return;
        grid.innerHTML = items.map(function (it, i) {
          return '<div class="process-step reveal' + (i % 2 ? ' d2' : '') + '">' +
            '<span class="step-num">' + pad(i + 1) + '</span>' +
            '<h4>' + escCms(it.title) + '</h4><p>' + escCms(it.body) + '</p></div>';
        }).join('');
        reobserve(grid);
      }

      var cmsSrc = document.body.getAttribute('data-content') || '/content/homepage.json';
      fetch(cmsSrc)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          document.querySelectorAll('[data-cms]').forEach(function (el) {
            var val = dig(d, el.getAttribute('data-cms'));
            if (val == null) return;
            if (Array.isArray(val)) {
              el.innerHTML = val.map(function (x) { return '<p>' + escCms(x) + '</p>'; }).join('');
            } else {
              el.textContent = val;
            }
          });
          if (d.services) renderServices(d.services.items);
          if (d.why)      renderWhy(d.why.items);
          if (d.process)  renderProcess(d.process.items);
        })
        .catch(function () {});
    }

        /* ---- current year ---- */
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* ---- render portfolio (if a target exists & PROJECTS available) ---- */
    if (window.PROJECTS) {
      renderWorkGrid();
      renderWorkDetail();
    }

    /* ---- forms (Web3Forms) ---- */
    document.querySelectorAll('form[data-web3form]').forEach(initForm);
  });

  /* ---------- portfolio rendering ---------- */
  function projectHref(p) { return p.link ? p.link : ('/work?p=' + encodeURIComponent(p.slug)); }

  function placeholderInner(ph) {
    var number = ph && ph.number ? '<span class="ph-number">' + esc(ph.number) + '</span>' : '';
    var label = ph && ph.label ? esc(ph.label) : 'Website snapshot placeholder';
    return '<div class="placeholder-inner">' + number + '<span class="ph-label">' + label + '</span></div>';
  }

  function richText(value) {
    if (!Array.isArray(value)) return esc(value);
    return value.map(function (part) {
      if (typeof part === 'string') return esc(part);
      if (part && part.href) {
        return '<a href="' + esc(part.href) + '" target="_blank" rel="noopener noreferrer">' + esc(part.text || part.href) + '</a>';
      }
      return esc(part && part.text ? part.text : '');
    }).join('');
  }

  function classTokens(value) {
    return String(value || '').split(/\s+/).filter(function (token) {
      return /^[a-z0-9_-]+$/i.test(token);
    }).join(' ');
  }

  function shotHTML(shot, i, title, extraClass) {
    var cls = 'shot' + (extraClass ? ' ' + extraClass : '');
    if (typeof shot === 'string') {
      return '<figure class="' + cls + '"><img src="' + esc(shot) + '" alt="' + esc(title) + ' - screen ' + (i + 1) + '" loading="lazy"></figure>';
    }
    if (shot && shot.src) {
      return '<figure class="' + cls + '"><img src="' + esc(shot.src) + '" alt="' + esc(shot.alt || title + ' - screen ' + (i + 1)) + '" loading="lazy"></figure>';
    }
    return '<figure class="' + cls + ' shot-placeholder" role="img" aria-label="' + esc((shot && shot.label) || title + ' screen placeholder') + '">' + placeholderInner(shot || {}) + '</figure>';
  }

  function cardHTML(p) {
    var thumbClass = classTokens(p.thumbClass);
    var thumb = p.thumb
      ? '<div class="thumb-art' + (thumbClass ? ' ' + thumbClass : '') + '"><img src="' + p.thumb + '" alt="' + esc(p.title) + '" loading="lazy"></div>'
      : p.thumbPlaceholder
        ? '<div class="thumb-art thumb-placeholder" role="img" aria-label="' + esc(p.thumbPlaceholder.label || p.title) + '">' + placeholderInner(p.thumbPlaceholder) + '</div>'
        : '<div class="thumb-art"><div class="mesh"></div></div>';
    return '' +
      '<a class="work-card reveal" href="' + projectHref(p) + '"' + (p.external ? ' target="_blank" rel="noopener"' : '') + '>' +
        thumb +
        '<span class="cat">' + esc(p.category) + '</span>' +
        '<div class="work-meta"><h3>' + esc(p.title) + '</h3><span class="yr">' + esc(p.year) + '</span></div>' +
        (p.location ? '<p class="loc">' + esc(p.location) + '</p>' : '') +
        '<p class="desc">' + esc(p.tagline) + '</p>' +
        '<span class="arrow">View project <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M9 7h8v8"/></svg></span>' +
      '</a>';
  }

  function renderWorkGrid() {
    document.querySelectorAll('[data-work-grid]').forEach(function (grid) {
      var limit = parseInt(grid.getAttribute('data-limit') || '0', 10);
      var list = limit ? window.PROJECTS.slice(0, limit) : window.PROJECTS;
      grid.innerHTML = list.map(cardHTML).join('');
      // re-observe new reveal nodes
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
        grid.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
      } else {
        grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      }
    });
  }

  function renderWorkDetail() {
    var root = document.querySelector('[data-work-detail]');
    if (!root) return;
    var slug = new URLSearchParams(location.search).get('p');
    if (!slug) {
      var parts = location.pathname.replace(/\/+$/, '').split('/');
      slug = parts[1] === 'work' && parts[2] ? decodeURIComponent(parts[2]) : '';
    }
    var p = window.PROJECTS.filter(function (x) { return x.slug === slug; })[0];
    if (!p) { location.replace('/portfolio'); return; }
    document.title = p.title + ' - Bentoji Studio';

    var facts = (p.facts || []).map(function (f) {
      return '<div class="fact"><div class="k">' + esc(f.k) + '</div><div class="v">' + esc(f.v) + '</div></div>';
    }).join('');

    var toc = [];
    var body = (p.body || []).map(function (b) {
      if (b.h) { var id = 's-' + slugify(b.h); toc.push('<a href="#' + id + '">' + esc(b.h) + '</a>'); return '<h3 id="' + id + '">' + esc(b.h) + '</h3>'; }
      if (b.image) return shotHTML(b.image, 0, p.title, 'shot-inline');
      if (b.list) return '<ul class="work-list">' + b.list.map(function (li) { return '<li>' + richText(li) + '</li>'; }).join('') + '</ul>';
      return '<p>' + richText(b.p) + '</p>';
    }).join('');
    var tocHTML = toc.length ? '<nav class="work-toc" aria-label="Sections">' + toc.join('') + '</nav>' : '';

    var shots = (p.gallery || []).map(function (shot, i) {
      return shotHTML(shot, i, p.title);
    }).join('');

    var coverImg = p.cover || p.thumb;
    var coverClass = classTokens(p.coverClass);
    var cover = coverImg
      ? '<div class="thumb-art' + (coverClass ? ' ' + coverClass : '') + '"><img src="' + coverImg + '" alt="' + esc(p.title) + '"></div>'
      : p.coverPlaceholder
        ? '<div class="thumb-art thumb-placeholder" role="img" aria-label="' + esc(p.coverPlaceholder.label || p.title) + '">' + placeholderInner(p.coverPlaceholder) + '</div>'
        : '<div class="thumb-art"><div class="mesh"></div></div>';

    var visit = p.visit ? '<div class="hero-actions"><a class="btn btn-light" href="' + esc(p.visit) + '" target="_blank" rel="noopener noreferrer">Visit project <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg></a></div>' : '';

    root.innerHTML =
      '<div class="container work-detail">' +
        '<a class="text-link work-back" href="/portfolio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg> All work</a>' +
        '<div class="work-detail-grid">' +
          '<aside class="work-side reveal">' +
            '<div class="cat">' + esc(p.category) + '</div>' +
            '<h1>' + esc(p.title) + '</h1>' +
            (p.location ? '<p class="loc">' + esc(p.location) + '</p>' : '') +
            '<div class="work-facts">' + facts + '</div>' +
            tocHTML + visit +
          '</aside>' +
          '<div class="work-main reveal d1">' +
            '<p class="lead">' + esc(p.tagline) + '</p>' +
            '<div class="work-cover">' + cover + '</div>' +
            '<div class="work-body">' + body + '</div>' +
            (shots ? '<div class="work-shots">' + shots + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    // the detail HTML was injected after the page-load reveal observer ran,
    // so observe the newly-added .reveal elements now (otherwise they stay hidden).
    var newReveals = root.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); dio.unobserve(e.target); } });
      }, { threshold: 0.06 });
      newReveals.forEach(function (el) { dio.observe(el); });
    } else {
      newReveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- Web3Forms ---------- */
  function initForm(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form-note');
      var btn = form.querySelector('button[type=submit]');
      // validate required fields (name, email, message) and email format
      if (!form.checkValidity()) {
        if (note) { note.className = 'form-note'; note.textContent = ''; }
        form.reportValidity();
        return;
      }
      var key = form.querySelector('input[name=access_key]');
      if (!key || /YOUR_WEB3FORMS/.test(key.value)) {
        if (note) { note.className = 'form-note err'; note.textContent = 'Form not configured yet - add your Web3Forms access key.'; }
        return;
      }
      var data = Object.fromEntries(new FormData(form).entries());
      if (data.botcheck) return; // honeypot
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.success) {
          if (note) { note.className = 'form-note ok'; note.textContent = 'Thanks - your message is on its way.'; }
          form.reset();
        } else { throw new Error(res.message || 'failed'); }
      }).catch(function () {
        if (note) { note.className = 'form-note err'; note.textContent = 'Something went wrong. Please email soundlax.studio@gmail.com directly.'; }
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send'; }
      });
    });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

})();
