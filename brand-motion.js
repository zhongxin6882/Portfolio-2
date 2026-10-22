import { gsap } from 'gsap';

const flip = document.querySelector('.chrome .brand-flip');
if (flip && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // One half-turn per 420px of page travel. The front face is CENTER;
  // the reverse face is the normal portrait. Scrolling back reverses it.
  const rotate = gsap.quickTo(flip, 'rotationY', {
    duration: 0.28,
    ease: 'power2.out',
    overwrite: 'auto'
  });
  const update = () => rotate(window.scrollY * 180 / 420);
  window.addEventListener('scroll', update, { passive: true });
  update();
}
