(() => {
  const FRAME_MAX = 23;
  const FRAME_INTERVAL = 1000 / 24;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.sprite-composition [data-sprite]').forEach(sprite => {
    let frame = 0;
    let target = 0;
    let request = 0;
    let lastTime = 0;
    let carry = 0;

    const show = next => {
      frame = Math.max(0, Math.min(FRAME_MAX, next));
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      sprite.style.setProperty('--sprite-x', `${column * 20}%`);
      sprite.style.setProperty('--sprite-y', `${row * 100 / 3}%`);
      sprite.dataset.frame = String(frame);
    };

    const tick = time => {
      if (!lastTime) lastTime = time;
      carry += Math.min(time - lastTime, 80);
      lastTime = time;
      while (carry >= FRAME_INTERVAL && frame !== target) {
        show(frame + Math.sign(target - frame));
        carry -= FRAME_INTERVAL;
      }
      if (frame !== target) request = requestAnimationFrame(tick);
      else { request = 0; lastTime = 0; carry = 0; }
    };

    const aim = next => {
      target = next;
      if (reducedMotion.matches) {
        cancelAnimationFrame(request);
        request = 0;
        show(target);
        return;
      }
      if (!request && frame !== target) request = requestAnimationFrame(tick);
    };

    show(0);
    sprite.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') aim(FRAME_MAX);
    });
    sprite.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') aim(0);
    });
    sprite.addEventListener('focus', () => aim(FRAME_MAX));
    sprite.addEventListener('blur', () => aim(0));
  });
})();
