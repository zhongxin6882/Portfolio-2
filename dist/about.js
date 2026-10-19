document.getElementById('menuToggle')?.addEventListener('click',e=>{const nav=document.getElementById('menu'),open=e.currentTarget.getAttribute('aria-expanded')==='true';e.currentTarget.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('closed',open)});const clock=document.getElementById('clock');if(clock){const tick=()=>clock.textContent='HCMC, '+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(new Date());tick();setInterval(tick,60000)};const loader=document.getElementById('intro-loader');if(loader){if(matchMedia('(prefers-reduced-motion: reduce)').matches)loader.classList.add('is-done');else setTimeout(()=>loader.classList.add('is-done'),4700)}
const portrait=document.querySelector('.about-character');
if(portrait){
  const trigger=portrait.querySelector('.character-trigger');
  const ideas=[...portrait.querySelectorAll('.idea')];
  const note=portrait.querySelector('.character-note');
  let pinned=false,hovered=false;
  const render=()=>{const open=pinned||hovered;portrait.classList.toggle('is-open',open);trigger.setAttribute('aria-expanded',String(open))};
  portrait.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;render()}});
  portrait.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovered=false;render()}});
  trigger.addEventListener('click',()=>{pinned=!pinned;render()});
  ideas.forEach(item=>item.addEventListener('click',e=>{
    e.stopPropagation();pinned=true;
    ideas.forEach(other=>{const selected=other===item;other.classList.toggle('is-selected',selected);other.setAttribute('aria-pressed',String(selected))});
    portrait.classList.add('has-selection');note.textContent=item.dataset.note;render();
  }));
  portrait.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;hovered=false;ideas.forEach(item=>{item.classList.remove('is-selected');item.setAttribute('aria-pressed','false')});portrait.classList.remove('has-selection');render()}});
}