document.getElementById('menuToggle')?.addEventListener('click',e=>{const nav=document.getElementById('menu'),open=e.currentTarget.getAttribute('aria-expanded')==='true';e.currentTarget.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('closed',open)});const clock=document.getElementById('clock');if(clock){const tick=()=>clock.textContent='HCMC, '+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(new Date());tick();setInterval(tick,60000)};const loader=document.getElementById('intro-loader');if(loader){if(matchMedia('(prefers-reduced-motion: reduce)').matches)loader.classList.add('is-done');else setTimeout(()=>loader.classList.add('is-done'),4700)}
const portrait=document.querySelector('.about-character');
if(portrait){
  const setOpen=open=>{portrait.classList.toggle('is-open',open);portrait.setAttribute('aria-expanded',String(open))};
  portrait.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')setOpen(true)});
  portrait.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')setOpen(false)});
  portrait.addEventListener('click',e=>setOpen(e.pointerType==='mouse'?true:!portrait.classList.contains('is-open')));
  portrait.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
}
