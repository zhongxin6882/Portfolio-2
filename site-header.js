/**
 * site-header.js — 全站共享页头（.chrome）行为
 * 每个页面都加载。页头 markup 在各 HTML 里是复制粘贴的，本脚本是唯一的行为来源。
 *
 * 三块彼此独立的功能：菜单开关、时钟、音频开关。任一 DOM 元素缺失都只做局部降级，不影响其余两块。
 *
 * ⚠️ 菜单与音频的监听器都注册在**捕获阶段**并调用 stopImmediatePropagation()，
 *    目的是抢在其他旧脚本的同类监听器之前独占处理权。新增同元素监听器时注意这个优先级。
 */
(() => {
  const header = document.querySelector('.chrome');
  if (!header) return;
  // ── 1) 菜单开关：切换 #menu 的 .closed，同步 aria-expanded；
  // 重新展开时先移除再加回 .typing，以重放打字机动画。
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

  // ── 2) 时钟：Asia/Shanghai 时区、en-GB 24 小时制、每秒刷新。
  // ⚠️ 时区写死在此，但页头静态文案写的是 HCMC（胡志明市），两者不一致。
  const clock = header.querySelector('#clock');
  if (clock) {
    const format = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    const tick = () => { clock.textContent = format.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  // ── 3) 音频开关：用 Web Audio API 实时合成，不加载任何音频文件。
  // 8 音符正弦波循环（C4 E4 G4 C5 A4 G4 E4 D4），间隔 420ms，主增益 .045，
  // 单音符包络 0 → .5（80ms 线性）→ .001（560ms 指数衰减），osc 总时长 .58s。
  // 依赖按钮内存在 .audio-label；pagehide 时统一停止并关闭 AudioContext。
  // ⚠️ README.md 说“音频开关只是视觉效果”是过时描述，实际有真实声音输出。
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
