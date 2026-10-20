(() => {
  const header = document.querySelector('.chrome');
  if (!header) return;
  const menuButton = header.querySelector('#menuToggle');
  const menu = header.querySelector('#menu');
  // Capture the click before older page scripts so one menu action has one result.
  menuButton?.addEventListener('click', event => {
    event.stopImmediatePropagation();
    const opening = menu.classList.contains('closed');
    menu.classList.toggle('closed', !opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menu.classList.remove('typing');
    if (opening) requestAnimationFrame(() => menu.classList.add('typing'));
  }, true);

  const clock = header.querySelector('#clock');
  if (clock) {
    const format = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    const tick = () => { clock.textContent = format.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  const audio = header.querySelector('#audioToggle');
  let context, timer, voices = [];
  const stop = () => {
    clearInterval(timer);
    voices.forEach(voice => { try { voice.stop(); } catch {} });
    voices = [];
    context?.close();
    context = null;
  };
  const play = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    const master = context.createGain();
    master.gain.value = .045;
    master.connect(context.destination);
    const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
    let step = 0;
    const note = () => {
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[step++ % notes.length];
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.5, now + .08);
      gain.gain.exponentialRampToValueAtTime(.001, now + .56);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + .58);
      voices.push(osc);
      osc.onended = () => { voices = voices.filter(item => item !== osc); };
    };
    note();
    timer = setInterval(note, 420);
    return true;
  };
  audio?.addEventListener('click', event => {
    event.stopImmediatePropagation();
    const active = audio.getAttribute('aria-pressed') === 'true';
    if (active) stop();
    else if (!play()) return;
    audio.setAttribute('aria-pressed', String(!active));
    audio.querySelector('.audio-label').textContent = active ? 'Off —' : 'On';
  }, true);
  window.addEventListener('pagehide', stop);
})();
