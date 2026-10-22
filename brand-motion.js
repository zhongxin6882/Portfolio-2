import { gsap } from 'gsap';

const flip = document.querySelector('.chrome .brand-flip');
if (flip && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // One quarter-turn per 420px: copyright, person, copyright, person.
  // The 58px-wide prism uses a 29px center-to-face offset.
  const rotate = gsap.quickTo(flip, 'rotationY', {
    duration: 0.28,
    ease: 'power2.out',
    overwrite: 'auto'
  });
  const update = () => {
    const available = document.scrollingElement.scrollHeight - window.innerHeight;
    const distance = Math.max(1, Math.min(420, available));
    rotate(-window.scrollY * 90 / distance);
  };
  window.addEventListener('scroll', update, { passive: true });
  // Playground may scroll its picture stream independently of the window.
  const pictureStream = document.querySelector('.play-grid');
  if (pictureStream) {
    const updateStream = () => {
      if (pictureStream.scrollHeight > pictureStream.clientHeight + 1) {
        rotate(-pictureStream.scrollTop * 90 / Math.min(420, pictureStream.scrollHeight - pictureStream.clientHeight));
      }
    };
    pictureStream.addEventListener('scroll', updateStream, { passive: true });
    if (pictureStream.scrollTop > 0) updateStream();
  }
  window.addEventListener('work:position', event => {
    if (window.innerWidth > 850) rotate(-event.detail.position * 90);
  });
  update();
}
