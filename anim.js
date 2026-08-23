(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pendingHash = window.location.hash;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (pendingHash) window.scrollTo(0, 0);

  function headerOffset() {
    const header = document.querySelector('header');
    return header ? header.offsetHeight + 10 : 10;
  }

  function scrollToHash(hash, behavior) {
    const id = String(hash || '').replace('#', '');
    if (!id) return false;
    const section = document.getElementById(id);
    if (!section) return false;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? 'auto' : (behavior || 'smooth')
    });
    return true;
  }

  function enterPage() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('is-entered');
      });
    });
  }

  function playSiteCut(onCovered, options) {
    options = options || {};
    if (reduceMotion) {
      if (typeof onCovered === 'function') onCovered();
      return;
    }
    if (document.body.classList.contains('is-launching')) return;
    document.body.classList.add('is-launching');
    const wrap = document.createElement('div');
    wrap.className = 'launch-cut';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<span class="launch-cut-blade"></span><span class="launch-cut-flash"></span><span class="launch-cut-cover"></span>';
    document.body.appendChild(wrap);
    window.requestAnimationFrame(function () {
      wrap.classList.add('is-active');
    });
    window.setTimeout(function () {
      if (typeof onCovered === 'function') onCovered();
      if (options.keepCovered) return;
      wrap.classList.add('is-done');
      window.setTimeout(function () {
        wrap.remove();
        document.body.classList.remove('is-launching');
      }, 420);
    }, 860);
  }

  window.playSiteCut = playSiteCut;

  function launchCutTo(href) {
    if (reduceMotion) {
      window.location.href = href;
      return;
    }
    playSiteCut(function () {
      window.location.href = href;
    }, { keepCovered: true });
  }

  function leaveTo(href) {
    if (reduceMotion || document.body.classList.contains('inquiry-page')) {
      window.location.href = href;
      return;
    }
    if (document.body.classList.contains('is-leaving')) return;
    document.body.classList.add('is-leaving');
    window.setTimeout(function () {
      window.location.href = href;
    }, 400);
  }

  const revealSelectors = [
    '.hero .eyebrow',
    '.hero h1',
    '.hero-copy',
    '.hero-tag',
    '.hero .actions',
    '.trust-item',
    '.section-copy .eyebrow',
    '.section-copy h2',
    '.section-copy p',
    '.section-copy .btn',
    '.video-frame',
    '.services > .container > .eyebrow',
    '.service-card',
    '.work-head',
    '.filters',
    '.why-card',
    '.process > .container > .eyebrow',
    '.process h2',
    '.step',
    '.cta > .container > .eyebrow',
    '.cta-copy h2',
    '.cta-copy p',
    '.cta-copy .btn',
    '.social-item'
  ];

  function initReveals() {
    const found = [];
    revealSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        found.push(el);
      });
    });

    const seen = new Set();
    const items = found.filter(function (el) {
      if (seen.has(el)) return false;
      seen.add(el);
      return true;
    });

    items.forEach(function (el) {
      el.classList.add('reveal');
      const parent = el.parentElement;
      if (!parent) return;
      const pack = items.filter(function (item) {
        return item.parentElement === parent;
      });
      const index = pack.indexOf(el);
      if (index > 0) el.style.setProperty('--reveal-delay', (index * 80) + 'ms');
    });

    if (reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  function cleanUrl() {
    if (!history.replaceState) return;
    history.replaceState(null, '', window.location.pathname);
  }

  function isInternalPage(url) {
    if (url.origin !== window.location.origin) return false;
    if (url.protocol === 'mailto:') return false;
    return true;
  }

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.id === 'watch-showreel' || link.id === 'play-showreel') return;
    if (link.hasAttribute('data-work-filter')) return;

    const url = new URL(link.getAttribute('href'), window.location.href);
    if (!isInternalPage(url)) return;

    const samePage = url.pathname.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '');

    if (samePage && url.hash) {
      event.preventDefault();
      scrollToHash(url.hash);
      cleanUrl();
      return;
    }

    if (samePage) {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      cleanUrl();
      return;
    }

    event.preventDefault();
    const path = url.pathname.replace(/\/+$/, '');
    if (path.endsWith('/work') || path.endsWith('work.html')) {
      launchCutTo(link.href);
      return;
    }
    leaveTo(url.href);
  });

  function initMobileNav() {
    const header = document.querySelector('header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!header || !toggle || !nav) return;

    function setOpen(open) {
      header.classList.toggle('is-nav-open', open);
      document.body.classList.toggle('nav-lock', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-nav-open'));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  function start() {
    initMobileNav();
    if (document.body.classList.contains('inquiry-page')) {
      document.body.classList.add('is-entered');
      return;
    }
    enterPage();
    initReveals();
    if (pendingHash) {
      window.setTimeout(function () {
        scrollToHash(pendingHash, reduceMotion ? 'auto' : 'smooth');
        cleanUrl();
      }, reduceMotion ? 0 : 280);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
