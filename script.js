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

// Move only the scenery. Text and buttons stay still and remain easy to use.
const hero = document.querySelector('.hero');
const motionAllowed = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
if (hero) {
  let x = 0, y = 0, targetX = 0, targetY = 0, frame = null;
  const canMove = () => motionAllowed.matches && !reducedMotion.matches && !document.hidden;
  function render() {
    x += (targetX - x) * 0.09;
    y += (targetY - y) * 0.09;
    hero.style.setProperty('--scene-x', `${(x * -9).toFixed(2)}px`);
    hero.style.setProperty('--scene-y', `${(y * -6).toFixed(2)}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.002) frame = requestAnimationFrame(render);
    else frame = null;
  }
  function reset() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    x = y = targetX = targetY = 0;
    hero.style.removeProperty('--scene-x');
    hero.style.removeProperty('--scene-y');
  }
  hero.addEventListener('pointermove', (event) => {
    if (!canMove() || event.pointerType === 'touch') return;
    const box = hero.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    if (frame === null) frame = requestAnimationFrame(render);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    if (frame === null && canMove()) frame = requestAnimationFrame(render);
  });
  hero.addEventListener('pointercancel', reset);
  reducedMotion.addEventListener('change', reset);
  motionAllowed.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) reset(); });
    heroObserver.observe(hero);
  }
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
