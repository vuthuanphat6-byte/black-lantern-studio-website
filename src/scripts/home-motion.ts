// Progressive enhancement: content and CSS geometry also work without JavaScript.
const home = document.querySelector<HTMLElement>('.home-design');
const opening = document.querySelector<HTMLElement>('.opening');
const scene = document.querySelector<HTMLElement>('.lantern-scene');
const card = document.querySelector<HTMLElement>('[data-tilt]');
const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let paused = reduced.matches;
function resetTilt() {
  scene?.style.setProperty('--pointer-x', '0deg');
  scene?.style.setProperty('--pointer-y', '0deg');
  card?.style.setProperty('--tilt-x', '0deg');
  card?.style.setProperty('--tilt-y', '0deg');
}
function updateMotion() {
  if (!home || !toggle) return;
  toggle.hidden = reduced.matches;
  home.dataset.motion = paused ? 'paused' : 'active';
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.textContent = paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động';
  resetTilt();
}
if (home && toggle && opening) {
  updateMotion();
  toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updateMotion(); });
  finePointer.addEventListener('change', resetTilt);
  opening.addEventListener('pointermove', (event: PointerEvent) => {
    if (paused || reduced.matches || !finePointer.matches || !scene) return;
    const rect = opening.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    scene.style.setProperty('--pointer-x', `${x * 16}deg`);
    scene.style.setProperty('--pointer-y', `${-y * 10}deg`);
  }, { passive: true });
  opening.addEventListener('pointerleave', resetTilt);
  card?.addEventListener('pointermove', (event: PointerEvent) => {
    if (paused || reduced.matches || !finePointer.matches) return;
    const rect = card.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    card.style.setProperty('--tilt-x', `${x * 3}deg`);
    card.style.setProperty('--tilt-y', `${-y * 3}deg`);
  }, { passive: true });
  card?.addEventListener('pointerleave', resetTilt);
  const visibility = new IntersectionObserver(([entry]) => {
    home.dataset.offscreen = String(!entry.isIntersecting || document.hidden);
  });
  visibility.observe(opening);
  document.addEventListener('visibilitychange', () => {
    home.dataset.offscreen = String(document.hidden || opening.getBoundingClientRect().bottom <= 0);
  });
}
