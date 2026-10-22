(() => {
  const FRAME_COUNT = 48;
  const COLUMNS = 8;
  const durations = {
    ball: 2400,
    coffee: 2850,
    tablet: 3150,
    gamepad: 2700,
    cat: 3100,
    watch: 3500,
    plant: 3400,
    paper: 3000
  };
  const panel = document.getElementById('art-panel');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sprites = [...document.querySelectorAll('.sprite-composition [data-sprite]')];
  let request = 0;
  let started = 0;

  const show = (sprite, frame) => {
    if (sprite.dataset.frame === String(frame)) return;
    sprite.style.setProperty('--sprite-x', `${(frame % COLUMNS) * 100 / (COLUMNS - 1)}%`);
    sprite.style.setProperty('--sprite-y', `${Math.floor(frame / COLUMNS) * 20}%`);
    sprite.dataset.frame = String(frame);
  };

  const tick = time => {
    if (!started) started = time;
    const elapsed = time - started;
    for (const sprite of sprites) {
      const duration = durations[sprite.dataset.sprite];
      const frame = Math.floor((elapsed % duration) / duration * FRAME_COUNT);
      show(sprite, frame);
    }
    request = requestAnimationFrame(tick);
  };

  const sync = () => {
    if (panel.classList.contains('is-open') && !reducedMotion.matches) {
      if (!request) {
        started = 0;
        request = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(request);
      request = 0;
      started = 0;
      sprites.forEach(sprite => show(sprite, 0));
    }
  };

  sprites.forEach(sprite => show(sprite, 0));
  new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['class'] });
  reducedMotion.addEventListener('change', sync);
  sync();
})();
