import Typed from 'typed.js';

export function initHero() {
  const targets = [...document.querySelectorAll('[data-landing-typed]')];
  if (!targets.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const messages = targets.map((target) => target.textContent);
  const boxes = targets.map((target) => target.closest('.typed-hero-box'));
  const instances = [];
  const timers = new Set();
  const wait = (callback, time) => {
    const id = setTimeout(() => { timers.delete(id); callback(); }, time);
    timers.add(id);
  };
  function type(index) {
    const box = boxes[index];
    box.classList.add('is-active');
    const instance = new Typed(targets[index], {
      strings: [messages[index]], typeSpeed: 34, startDelay: 600,
      showCursor: true, contentType: 'text',
      onComplete(instance) {
        instance.cursor?.remove();
        box.classList.remove('is-active');
        box.classList.add('is-complete');
        if (index < targets.length - 1) wait(() => type(index + 1), 260);
        // Keep the completed text visible; no endless motion while visitors read.
      },
    });
    instances.push(instance);
  }
  const reveal = () => {
    timers.forEach(clearTimeout);
    instances.forEach((instance) => instance.destroy());
    targets.forEach((target, i) => { target.textContent = messages[i]; boxes[i].classList.remove('is-active'); boxes[i].classList.add('is-complete'); });
  };
  try {
    targets.forEach((target) => { target.textContent = ''; });
    document.querySelector('.hero-stage').classList.add('hero-animated');
    wait(() => type(0), 100);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => { if (event.matches) reveal(); });
  } catch { reveal(); }
}
