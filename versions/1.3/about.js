/**
 * about.js — 开场动画收尾 + 关于页交互插画
 *
 * 被三类页面加载，但只有一部分逻辑对每类页面生效：
 *   about/index.html  两段都用（插画交互依赖 .about-character 存在）
 *   playground.html   只用开场动画收尾
 *   contact.html      只用开场动画收尾
 * 后两页没有 .about-character，第二段整体被 if(portrait) 跳过，属于有意的可选降级。
 *
 * ⚠️ 这里的开场时长是 4700ms，而 work.js / app.js 用的是 5500ms，各页节奏并不统一。
 */
// ── 开场动画收尾：4700ms 后给 #intro-loader 加 .is-done 触发退场。
// prefers-reduced-motion 时立即结束，不等计时器。
const loader=document.getElementById('intro-loader');if(loader){if(matchMedia('(prefers-reduced-motion: reduce)').matches)loader.classList.add('is-done');else setTimeout(()=>loader.classList.add('is-done'),4700)}
// ── 关于页交互插画：三种展开途径叠加，由 render() 统一收敛。
// hovered（仅鼠标，触屏不触发）+ pinned（点击钉住）→ 任一为真即展开。
// 点击 .idea 气泡：标记 .is-selected 与 aria-pressed，把该气泡的 data-note 写进 .character-note，
//   并给容器加 .has-selection。Esc 键清空 pinned / hovered / 选中态。
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