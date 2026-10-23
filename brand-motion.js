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

/*
 * Single horizontal sound wave, following the 2026-10-23 reference recording.
 * GSAP animates only the sine phase; the SVG path remains one continuous stroke.
 * The existing #audioToggle listener/Web Audio engine in site-header.js owns
 * playback and aria-pressed. A MutationObserver reflects that state here so the
 * animation never conflicts with its capture-phase event listener.
 */
const audioToggle = document.querySelector('.chrome #audioToggle');
const audioWave = audioToggle?.querySelector('.audio-wave');

if (audioToggle && audioWave) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 28 14');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '14');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.55');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  // Remove the previous five vertical bars rather than moving them with GSAP.
  audioWave.replaceChildren(svg);

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { phase: 0 };
  const width = 28, centerY = 7, amplitude = 3.8;
  function drawWave() {
    const coordinates = [];
    for (let i = 0; i <= 28; i++) {
      const x = i;
      const progress = x / width;
      // A soft envelope brings both ends of the short line back to mid-height.
      const envelope = Math.pow(Math.sin(progress * Math.PI), 0.35);
      const y = centerY - amplitude * envelope *
        Math.sin(progress * Math.PI * 2 + state.phase);
      coordinates.push((i ? 'L' : 'M') + x + ' ' + y.toFixed(2));
    }
    path.setAttribute('d', coordinates.join(' '));
  }
  drawWave();

  const waveTween = gsap.to(state, {
    phase: Math.PI * 2,
    duration: 1.75,
    repeat: -1,
    ease: 'none',
    paused: true,
    onUpdate: drawWave
  });

  const syncWave = () => {
    const active = audioToggle.getAttribute('aria-pressed') === 'true';
    const animate = active && !motionPreference.matches && !document.hidden;
    if (animate) {
      if (waveTween.paused()) waveTween.play();
    } else {
      waveTween.pause();
      // Keep a calm, static waveform when reduced motion is enabled.
      if (!active || motionPreference.matches) {
        state.phase = 0;
        drawWave();
      }
    }
  };

  const observer = new MutationObserver(syncWave);
  observer.observe(audioToggle, { attributes: true, attributeFilter: ['aria-pressed'] });
  motionPreference.addEventListener?.('change', syncWave);
  document.addEventListener('visibilitychange', syncWave);
  window.addEventListener('pagehide', () => {
    waveTween.kill();
    observer.disconnect();
  }, { once: true });
  syncWave();
}
