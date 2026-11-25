// Scroll-linked motion for the home page.
//
// One small engine, no library. It writes a progress number (--p, 0 to 1) onto
// elements marked data-progress, and the stylesheet turns that number into
// opacity, scale or a drawn line. Keeping the maths here and the look in CSS
// means the motion is easy to retune.
//
//   data-progress="pin"   the element is tall and holds a sticky screen; --p is
//                         how far through that tall element you have scrolled
//   data-progress="view"  --p runs from 0 as the element enters to 1 once it is
//                         mostly on screen
//   [data-story]          also picks which product is active, and moves the
//                         little rail
//
// With "reduce motion" on, nothing here animates: the stylesheet shows every
// state at once, and this file only keeps the header tidy.

const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

export function initScroll() {
  const root = document.documentElement;
  const header = document.querySelector('.lt-header');
  const progs = [...document.querySelectorAll('[data-progress="pin"], [data-progress="view"]')];
  const story = document.querySelector('[data-story]');
  const items = story ? [...story.querySelectorAll('.lt-item')] : [];
  const rail = story ? [...story.querySelectorAll('.lt-story-rail b')] : [];
  const pinned = window.matchMedia('(min-width: 901px)');

  let lastY = window.scrollY;
  let ticking = false;
  let active = -1;

  function setActive(i) {
    if (i === active) return;
    active = i;
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
    rail.forEach((el, k) => el.classList.toggle('on', k === i));
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    // Header: solid after the first bit of scroll, tucked away while reading downward.
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (down && y > vh * 0.6) header.classList.add('hide');
      else if (up || y < 80) header.classList.remove('hide');
    }
    lastY = y;

    if (root.classList.contains('rm')) return;

    root.style.setProperty('--hp', clamp(y / vh).toFixed(4));

    for (const el of progs) {
      const r = el.getBoundingClientRect();
      let p;
      if (el.dataset.progress === 'pin') {
        const total = r.height - vh;
        p = total > 0 ? -r.top / total : 0;
      } else {
        p = (vh - r.top) / (vh * 0.85);
      }
      el.style.setProperty('--p', clamp(p).toFixed(4));
    }

    if (story && items.length && pinned.matches) {
      const r = story.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? clamp(-r.top / total) : 0;
      setActive(Math.min(items.length - 1, Math.floor(p * items.length)));
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
