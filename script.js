'use strict';

// The document, native project disclosures and links work without JavaScript.
document.documentElement.classList.add('js');
const yearNode = document.getElementById('year');
if (yearNode) yearNode.textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');
const mobileMenu = window.matchMedia('(max-width: 900px)');
function setMenu(open, restoreFocus = false) {
  if (!menuButton || !nav) return;
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (restoreFocus) menuButton.focus();
}
if (menuButton && nav) {
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMenu(false);
    if (wasOpen && link.hash && link.origin === window.location.origin) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) setMenu(false); });
  document.addEventListener('focusin', (event) => { if (!event.target.closest('.site-header')) setMenu(false); });
  mobileMenu.addEventListener('change', () => setMenu(false));
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealNodes = document.querySelectorAll('.reveal');
let revealObserver;
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('reveal-pending');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.06, rootMargin: '0px 0px 24px 0px' });
  for (const node of revealNodes) {
    if (node.getBoundingClientRect().top > window.innerHeight) {
      node.classList.add('reveal-pending');
      revealObserver.observe(node);
    }
  }
}
reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  revealObserver?.disconnect();
  for (const node of revealNodes) node.classList.remove('reveal-pending');
});

// Navigation tracks the section passing beneath the fixed header.
if (nav) {
  const sectionLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sections = sectionLinks.map(link => document.querySelector(link.hash)).filter(Boolean);
  let scrollFrame = null;
  const updateNavigation = () => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12;
    const marker = Math.max(160, window.innerHeight * 0.28);
    let current = '';
    for (const section of sections) { if (section.getBoundingClientRect().top <= marker) current = section.id; }
    if (atBottom) current = 'contact';
    for (const link of sectionLinks) {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    document.querySelector('.site-header')?.classList.toggle('scrolled', window.scrollY > 30);
    scrollFrame = null;
  };
  window.addEventListener('scroll', () => { if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateNavigation); }, { passive: true });
  window.addEventListener('resize', updateNavigation, { passive: true });
  updateNavigation();
}

// The hero visual is a small, decorative control-system preview. It reacts to
// pointer position while keeping the text and buttons completely still.
const hero = document.querySelector('.hero');
const motionAllowed = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
const pendulum = document.getElementById('hero-pendulum');
const pendulumMass = document.getElementById('hero-pendulum-mass');
const phaseDot = document.getElementById('hero-phase-dot');
const angleReadout = document.getElementById('hero-angle-readout');
const rateReadout = document.getElementById('hero-rate-readout');
if (hero && pendulum && pendulumMass && phaseDot) {
  let x = 0, y = 0, targetX = 0, targetY = 0, frame = null;
  let angle = 0.045;
  let angularRate = 0;
  let targetAngle = 0;
  let lastTime = performance.now();
  const canMove = () => motionAllowed.matches && !reducedMotion.matches && !document.hidden;
  function render(now) {
    if (document.hidden) { frame = null; return; }
    const dt = Math.min(.035, Math.max(.001, (now - lastTime) / 1000));
    lastTime = now;
    if (reducedMotion.matches) {
      angle = 0;
      angularRate = 0;
      targetAngle = 0;
    } else {
      const restoring = (targetAngle - angle) * 7.2;
      const damping = angularRate * 2.25;
      angularRate += (restoring - damping) * dt;
      angle += angularRate * dt;
    }
    const degrees = angle * 180 / Math.PI;
    pendulum.setAttribute('transform', `rotate(${degrees.toFixed(3)} 320 456)`);
    pendulumMass.setAttribute('transform', `rotate(${degrees.toFixed(3)} 320 456)`);
    phaseDot.setAttribute('cx', (438 + angle * 240).toFixed(1));
    phaseDot.setAttribute('cy', (303 - angularRate * 110).toFixed(1));
    if (angleReadout) angleReadout.textContent = `${degrees.toFixed(1)}°`;
    if (rateReadout) rateReadout.textContent = `${angularRate.toFixed(2)} rad/s`;
    frame = requestAnimationFrame(render);
  }
  function reset() {
    x = y = targetX = targetY = targetAngle = 0;
    hero.style.removeProperty('--scene-x');
    hero.style.removeProperty('--scene-y');
    if (reducedMotion.matches) {
      angle = angularRate = 0;
      pendulum.removeAttribute('transform');
      pendulumMass.removeAttribute('transform');
    }
  }
  hero.addEventListener('pointermove', (event) => {
    if (!canMove() || event.pointerType === 'touch') return;
    const box = hero.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    targetAngle = targetX * .13 + targetY * .025;
    x += (targetX - x) * .09;
    y += (targetY - y) * .09;
    hero.style.setProperty('--scene-x', `${(x * -7).toFixed(2)}px`);
    hero.style.setProperty('--scene-y', `${(y * -4).toFixed(2)}px`);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    targetX = targetY = targetAngle = 0;
    hero.style.setProperty('--scene-x', '0px');
    hero.style.setProperty('--scene-y', '0px');
  });
  hero.addEventListener('pointercancel', () => { targetX = targetY = targetAngle = 0; reset(); });
  reducedMotion.addEventListener('change', reset);
  motionAllowed.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { reset(); return; }
    lastTime = performance.now();
    if (frame === null) frame = requestAnimationFrame(render);
  });
  frame = requestAnimationFrame(render);
}

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
if (copyButton && copyStatus && navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  let resetStatus;
  copyButton.addEventListener('click', async () => {
    clearTimeout(resetStatus);
    try {
      await navigator.clipboard.writeText('nima.nry@gmail.com');
      copyStatus.textContent = 'Email address copied.';
    } catch {
      copyStatus.textContent = 'Please select and copy the email address above.';
    }
    resetStatus = setTimeout(() => { copyStatus.textContent = ''; }, 5000);
  });
}
