import { gsap } from 'gsap';

/**
 * work.js — 首页作品画廊：数据源 + 循环卡片堆叠交互引擎
 * 仅由 index.html 加载，且必须在 site-header.js / page-transition.js / locale.js 之前。
 *
 * 依赖的 DOM 契约（缺任一元素会静默失效或抛错）：
 *   #work-stack          卡片堆叠容器，脚本往里 append <article class="work-card">
 *   #work-index-items    右侧项目索引容器，脚本往里 append <button class="work-index-item">
 *   #work-role / #work-date / #work-awards / #work-number   左侧信息栏四个填充点
 *   #work-visit          “View project” 按钮，setActive() 时重绑 onclick
 *   #work-focus / #work-detail   两级浮层，HTML 里初始带 hidden 属性
 *
 * 布局分工：桌面端与手机端（<=760）使用同一环形堆叠；
 *           761–850px 平板保持原生滚动，由 updateMobile() 同步高亮。
 * 详细架构说明见仓库根目录 AGENTS.md 第 7 节。
 */
if ('scrollRestoration' in history) history.scrollRestoration='manual';
// ── 数据源：19 个项目，每行 7 字段 [name, type, date, description, role, awards, remoteImageFile]。
// 注意第 8 行 "BY ’KIN" 用双引号（名字含弯引号）。role/awards 内的 <br> 会被拆成多个文本节点，
// 因此 locale.js 里要按 <br> 分段建词条。
const projects=[
 ['FROMANOTHER','Agency & Studio','April 2026','A fresh website for the creative agency fromanother, founded by two artists I’ve long admired, Vicki and Robin.','Design Direction<br>Website Design','Awwwards Site of the Day<br>Awwwards Site of the Month Nominee<br>CSS Design Awards Website of the Day<br>FWA of the Day','JK0FqSLxHpj1w22TtNIaAQwr2uc.jpg'],
 ['IVENTIONS','Promotional','October 2025','Teamed up with the Serious Business agency to build a new website for Iventions, an event agency based in Barcelona.','Serious Business<br>Website Design','Awwwards Site of the Day<br>Awwwards Site of the Month Nominee<br>CSSDA Website of the Day','75mCZ5SdSy2FaX0ameAhFh9ynE.jpg'],
 ['WON J. YOU STUDIOS','Personal Brand','September 2025','A website for Won J. You, a veteran designer and professor focused on training the next generation through coaching, education, and mentorship.','Design Direction<br>Design Lead','Webby Nominee<br>Awwwards Site of the Day<br>FWA of the Day<br>CSSDA Website of the Day','OUq4sSIJXVqet1DGXpjpnXuC1qc.jpg'],
 ['MIUX STUDIO','Agency & Studio','June 2025','Translated Thai-born founder Nara’s vision for her young UX studio into a digital experience.','Design Direction<br>Design Lead','Awwwards Site of the Day<br>FWA of the Day<br>CSSDA Website of the Day<br>Behance UI Gallery','QqqJqinqeONnjCz1ncYlYpFRbs.jpg'],
 ['MARK WOODLAND','Personal Brand','October 2025','Working with the talented team at Uncommon Studio to reshape entrepreneur Mark Woodland’s digital presence.','Uncommon Studio<br>Interaction','FWA of the Day<br>CSSDA Website of the Day<br>Behance UI Gallery','kyZpWmBOPtk7QyAeSE9QB3HmS2I.jpg'],
 ['EISLAB','Food & Beverage','February 2025','A colorful new digital identity for a German ice cream brand.','Art Direction<br>Design Direction','Awwwards Site of the Day<br>FWA of the Day<br>CSSDA Website of the Day','BsJb1GV0DDjj2B5ELG33XfWmQ.jpg'],
 ['MAT VOYCE','Portfolio','January 2025','A new home for the moving work of type designer Mat Voyce.','Uncommon Studio<br>Design Direction','Awwwards Site of the Day<br>FWA of the Day<br>Good Design Award','bovi8JsQWnROEtE0WYyYwqPkiE.jpg'],
 ["BY ’KIN",'Agency & Studio','November 2024','A playful digital experience for an interior and brand studio.','Art Director<br>Website Design','Awwwards Site of the Day<br>FWA of the Day<br>Behance UI Gallery','G6KRK08IYPVsspZ3za8etsb60.jpg'],
 ['SERIOUS BUSINESS','Agency & Studio','August 2024','A delicious digital expression of Serious Business’s new brand.','Serious Business<br>Website Design','Awwwards Site of the Day<br>FWA of the Day<br>CSSDA Website of the Day','ZMZlhfAKVDPaWVzDIpnuU6HVRO4.jpg'],
 ['DEFIANT','Venture Capital','January 2025','A clean, confident identity that stands apart from traditional venture capital.','Art Director<br>Website Design','CSSDA Website of the Day<br>Behance UI Gallery','JXol5lZzzYBnMZSEp2JZHIhuuI.jpg'],
 ['UNCOMMON STUDIO','Agency & Studio','July 2026','A bespoke digital experience for a Melbourne-based studio.','Design Direction<br>Website Design','Awwwards Site of the Day<br>FWA of the Day','e4NzJl004YbfnXuKnhQEuGgUPU.png'],
 ['ASCON SYSTEMS','Corporate','August 2023','A distinctive website for ASCon that stays clean and professional.','Serious Business<br>Website Design','Awwwards Site of the Day<br>CSSDA Website of the Day','Ce5CMDqNJqwWN1TC3B0xbsBq47M.jpg'],
 ['MATHIJS HANENKAMP','Photography','February 2023','A portfolio that brings a photographer’s vision and personality into pixels.','Art Director<br>Website Design','FWA Site of the Day<br>CSSDA Website of the Day','AHnUuCwiIe3u0k9N4az6316yTbU.jpg'],
 ['RLY NETWORK','Blockchain','October 2022','A bold digital ecosystem for the RLY network.','Serious Business<br>Website Design','Webby Nominee<br>Awwwards Site of the Day','FZyOyyrz0ZctFkAK2kROsql2w1A.jpg'],
 ['HUYML VOL.1','Portfolio','August 2022','An experimental portfolio with expressive typography and interaction.','Art Director<br>Website Design','Awwwards Site of the Day<br>FWA of the Day','Dr7ftrDUeUTFQY2afrDoalR8A.jpg'],
 ['BISON STUDIO','Agency & Studio','February 2022','An expressive presence for a creative studio.','Art Director<br>Website Design','CSSDA Website of the Day<br>Behance UI Gallery','FP8bs8WqEOFTFST8L2YGqot9idA.jpg'],
 ['EST POPULO','Agency & Studio','February 2022','A bold experience balancing Scandinavian aesthetics and editorial typography.','District2 Studio<br>Website Design','Behance UI Gallery','F33bHKrCMVcgpBMdUPAEP579M.jpg'],
 ['DISTRICT2 STUDIO','Agency & Studio','September 2019','The first creative studio website in the collection.','District2<br>Website Design','Awwwards Site of the Day<br>CSSDA Website of the Day','FoYPkj63CnTXaljvLBaCO9gL9dE.jpg'],
 ['DAFI TROPICDANE','Furniture','May 2019','A minimal Scandinavian-inspired furniture experience.','District2<br>Website Design','Behance UI Gallery','PbGu32LciyVQZHUuKJCNLLV2qZc.jpg']
// 派生实际使用的对象：image 指向本地 assets/work/NN.ext（NN=数组序号+1，补零两位），
// remote 是 framerusercontent 兜底地址。调整项目顺序时必须同步重命名本地图片文件。
].map(([name,type,date,description,role,awards,image],i)=>({name,type,date,description,role,awards,image:`assets/work/${String(i+1).padStart(2,'0')}.${image.split('.').pop()}`,remote:`https://framerusercontent.com/images/${image}?width=1138`,number:i+1}));
// The reference sequence places DEFIANT directly after MAT VOYCE.
// ⚠️ 顺序重排：以下两个 splice 用的是硬编码下标，增删项目后必须重新核对。
const [defiant]=projects.splice(9,1);projects.splice(7,0,defiant);
// The reference closes the loop through DAFI and then DISTRICT2 before 01.
const [district2,dafi]=projects.splice(17,2);projects.push(dafi,district2);
projects.forEach((p,i)=>p.number=i+1);
// 右侧索引卡片的配色 chips，12 组，按 i % 12 循环取用。
const palettes=[['#090f25','#f5f1db','#075ad8'],['#14151e','#d9d7ed','#8a72e9'],['#c83e35','#e3ddd3','#ffac51'],['#332c25','#efe5d4','#90a2a6'],['#251e22','#e5b59b','#dc6058'],['#d453cc','#f4e2f3','#7e319d'],['#d9d5d3','#4a3b53','#ec9d48'],['#4236ce','#f1f1ee','#111'],['#e5c2b0','#24201e','#cf4660'],['#ef6b83','#10264e','#e8dbca'],['#071b5c','#d45c7c','#f0a760'],['#b9c7bf','#26201d','#bb5248']];
// ── DOM 引用与运行时状态 ──
const stack=document.getElementById('work-stack'),list=document.getElementById('work-index-items'),info={role:document.getElementById('work-role'),date:document.getElementById('work-date'),awards:document.getElementById('work-awards'),number:document.getElementById('work-number')};
const cards=[],items=[];let active=-1,focused=-1;
// count 是真实项目数；但 index.html 里的分母 <small>/19</small> 是硬编码的，增删项目要两处同步。
const count=projects.length,phoneLooping=()=>innerWidth<=760,looping=()=>innerWidth>850||phoneLooping();
const clamp=gsap.utils.clamp;
const wrap=n=>((n%count)+count)%count;
// 环形最短距离（带符号）：决定卡片往哪个方向偏移，并处理 19 → 01 的回绕。
// Keep the shortest distance through the circular stack, including 19 → 01.
const distance=(i,p)=>wrap(i-p+count/2)-count/2;
let position=0,targetPosition=0,framePending=false,snapTimer;
let previousPosition=0,motionVelocity=0,motionBend=0;
// ── 构建卡片堆叠：每个项目一个 <article class="work-card">，内含按钮与封面图。
// 图片先加载本地 assets/work/，onerror 时回退远程；前 3 张 eager，其余 lazy。
projects.forEach((project,i)=>{const article=document.createElement('article');article.className='work-card';const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`Preview ${project.name}`);const img=new Image();img.src=project.image;img.onerror=()=>{if(img.src!==project.remote)img.src=project.remote};img.alt=project.name+' project cover';img.loading=i<3?'eager':'lazy';button.append(img);button.addEventListener('click',()=>openFocus(i));const caption=document.createElement('div');caption.className='work-mobile-caption';caption.innerHTML=`<span class="mobile-type">${project.type}</span><h2>${project.name}</h2><p>${project.description}</p><span class="work-mobile-palette" aria-hidden="true">${palettes[i%palettes.length].map(color=>`<i style="background:${color}"></i>`).join('')}</span>`;article.append(button,caption);stack.append(article);cards.push(article)});
// ── 构建右侧索引：点击后桌面端转动堆叠到该项目，移动端滚动到对应卡片。
projects.forEach((project,i)=>{const item=document.createElement('button');item.className='work-index-item';item.type='button';const colors=palettes[i%palettes.length];item.innerHTML=`<small>${project.type}</small><strong>${project.name}</strong><em></em><p>${project.description}</p><span class="work-palette" aria-hidden="true">${colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span>`;item.setAttribute('aria-label',`Go to ${project.name}`);item.addEventListener('click',()=>{if(looping()){targetPosition+=distance(i,targetPosition);scheduleFrame()}else cards[i].scrollIntoView({behavior:'smooth',block:'center'})});list.append(item);items.push(item)});
// 切换“当前项目”：刷新左侧信息栏 + 右侧索引高亮与 aria-current，并重绑 View project 按钮。
function setActive(i){if(i===active)return;active=i;const p=projects[i];info.role.innerHTML=p.role;info.date.textContent=p.date;info.awards.innerHTML=p.awards;info.number.textContent=String(i+1).padStart(2,'0');items.forEach((item,j)=>{item.classList.toggle('active',i===j);if(i===j)item.setAttribute('aria-current','true');else item.removeAttribute('aria-current')});document.getElementById('work-visit').onclick=()=>openFocus(i)}
// 核心渲染：把每个卡片与当前 position 的环形距离换算成 CSS 变量
// (--stack-x / -y / -rotation / -yaw / -scale) 以及 z-index、opacity、visibility。
// 距离超过 2.25 的卡片直接 visibility:hidden，避免无谓绘制。
function render(){
  const frameVelocity=position-previousPosition;
  previousPosition=position;
  motionVelocity+=(frameVelocity-motionVelocity)*.34;
  motionBend+=(clamp(-1,1,motionVelocity*9)-motionBend)*.24;
  setActive(wrap(Math.round(position)));
  window.dispatchEvent(new CustomEvent('work:position', {detail: {position}}));
  const width=innerWidth,height=innerHeight;
  const stackWidth=stack.clientWidth;
  const cardWidth=Math.min(stackWidth*.58,400);
  const cardHeight=cardWidth/1.25;
  // The reference stack intentionally has asymmetric breathing room: the
  // first card above keeps about 70% visible, while the first below keeps
  // about 45% visible. Further cards continue the same rhythm.
  const upperStep=cardHeight*.70;
  const lowerStep=cardHeight*.45;
  cards.forEach((card,i)=>{const d=distance(i,position),abs=Math.abs(d),shown=abs<2.25;
    if(phoneLooping()){
      const visible=abs<1.55;
      card.style.visibility=visible?'visible':'hidden';
      card.style.pointerEvents=abs<.45?'auto':'none';
      card.style.zIndex=String(100-Math.round(abs*20)+(d>0?0:1));
      card.style.opacity=visible?String(Math.max(0,1-Math.max(0,abs-1.05)*2)):'0';
      card.style.setProperty('--phone-x',`${d<0?-d*width*.34:-d*width*.37}px`);
      card.style.setProperty('--phone-y',`${d<0?d*height*.41:d*height*.45}px`);
      card.style.setProperty('--phone-rotation',`${abs*8+motionBend*abs*3}deg`);
      card.style.setProperty('--phone-yaw',`${-abs*9-motionBend*abs*5}deg`);
      card.style.setProperty('--phone-skew',`${motionBend*abs*3}deg`);
      card.style.setProperty('--phone-scale',String(1-Math.min(abs,1)*.02));
      card.style.setProperty('--mobile-caption-opacity',String(Math.max(0,1-abs*2.3)));
      if(visible)card.querySelector('img').loading='eager';
      return;
    }
    card.style.visibility=shown?'visible':'hidden';card.style.pointerEvents=abs<.75?'auto':'none';
    card.style.zIndex=String(100-Math.round(abs*12)+(d>0?0:1));
    card.style.opacity=shown?String(Math.max(0,1-Math.max(0,abs-1.65)*1.5)):'0';
    card.style.setProperty('--stack-x',`${-d*Math.min(width*.045,88)+motionBend*abs*18}px`);
    card.style.setProperty('--stack-y',`${d<0?d*upperStep:d*lowerStep}px`);
    card.style.setProperty('--stack-rotation',`${d*15+motionBend*abs*5}deg`);
    card.style.setProperty('--stack-yaw',`${-d*9-motionBend*abs*7}deg`);
    card.style.setProperty('--stack-skew',`${motionBend*abs*3.5}deg`);
    card.style.setProperty('--stack-bend',String(Math.min(1,Math.abs(motionBend)*abs)));
    card.style.setProperty('--stack-scale',String(1-Math.min(abs,2)*.035+Math.abs(motionBend)*.012));
  });
  items.forEach((item,i)=>{const d=distance(i,position),abs=Math.abs(d);item.style.visibility=abs<3.2?'visible':'hidden';item.style.pointerEvents=abs<2.8?'auto':'none';item.style.setProperty('--index-y',`${d*Math.min(height*.19,185)}px`);item.style.opacity=abs<.5?'1':String(Math.max(.16,.35-abs*.08))});
}
// ── 动画循环：rAF 节流 + 指数缓动（每帧逼近目标 16%）+ 停止输入 180ms 后吸附到整数。
function scheduleFrame(){if(framePending)return;framePending=true;requestAnimationFrame(tick)}
function tick(){position+=(targetPosition-position)*.16;if(Math.abs(targetPosition-position)<.001)position=targetPosition;render();if(position!==targetPosition||Math.abs(motionBend)>.002)requestAnimationFrame(tick);else framePending=false}
function queueSnap(){clearTimeout(snapTimer);snapTimer=setTimeout(()=>{targetPosition=Math.round(targetPosition);scheduleFrame()},180)}
// ── 输入层：滚轮。deltaMode 归一化（1=行,2=页），单次增量限制在 ±2 个项目。
// focused >= 0（浮层打开）时全部短路，防止背景跟着转。
addEventListener('wheel',e=>{if(!looping()||focused>=0||phoneLooping()&&!e.target.closest('.work-stack'))return;e.preventDefault();const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);targetPosition+=Math.max(-2,Math.min(2,dy/520));scheduleFrame();queueSnap()},{passive:false});
// ── 输入层：触摸。以半屏高度为一个项目的位移基准。
let touchStartY=0,touchStartPosition=0,touchTracking=false;
addEventListener('touchstart',e=>{touchTracking=looping()&&focused<0&&(!phoneLooping()||!!e.target.closest('.work-stack'));if(!touchTracking)return;touchStartY=e.touches[0].clientY;touchStartPosition=targetPosition},{passive:true});
addEventListener('touchmove',e=>{if(!touchTracking||focused>=0)return;e.preventDefault();targetPosition=touchStartPosition+(touchStartY-e.touches[0].clientY)/(innerHeight*.55);scheduleFrame()},{passive:false});
addEventListener('touchend',()=>{if(touchTracking&&focused<0)queueSnap();touchTracking=false},{passive:true});
addEventListener('touchcancel',()=>{touchTracking=false},{passive:true});
addEventListener('keydown',e=>{if(!looping()||focused>=0)return;const move=({ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1})[e.key];if(move){e.preventDefault();targetPosition=Math.round(targetPosition)+move;scheduleFrame()}},{passive:false});
// ── 移动端路径：不接管滚动，只根据卡片几何中心找出最接近视口中心的那个并高亮。
function updateMobile(){if(looping())return;let closest=0,best=Infinity;cards.forEach((card,i)=>{const r=card.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-innerHeight/2);if(d<best){best=d;closest=i}if(r.bottom>0&&r.top<innerHeight*1.5)card.classList.add('is-visible')});setActive(closest)}
addEventListener('scroll',updateMobile,{passive:true});
// 跨断点切换时清空桌面端写在元素上的内联样式，交还给 CSS 与移动端逻辑。
addEventListener('resize',()=>{if(looping()){render()}else{cards.forEach(c=>{c.style.visibility='';c.style.pointerEvents='';c.style.opacity='';c.style.zIndex=''});items.forEach(i=>{i.style.visibility='';i.style.pointerEvents='';i.style.opacity=''});active=-1;updateMobile()}});
if(looping())render();else updateMobile();
// ── 两级浮层：openFocus 预览 → openDetail 详情 → closeOverlays 关闭（Esc 同样触发）。
// i === 0 是特例：详情里额外注入 3 张远程图，并给出通往 fromanother.html 的案例链接。
const focus=document.getElementById('work-focus'),detail=document.getElementById('work-detail');function openFocus(i){focused=i;const p=projects[i];focus.querySelector('img').src=p.image;focus.querySelector('img').onerror=e=>e.target.src=p.remote;focus.querySelector('.focus-caption span').textContent=`${p.type}  /  ${p.date}`;focus.querySelector('h2').textContent=p.name;focus.querySelector('p').textContent=p.description;focus.hidden=false;document.body.style.overflow='hidden';focus.querySelector('.focus-cover').onclick=e=>{if(e.target.closest('.focus-close'))return;openDetail(i)};focus.querySelector('.focus-caption button').onclick=()=>openDetail(i)}
function openDetail(i){const p=projects[i],next=projects[(i+1)%projects.length];focused=i;focus.hidden=true;detail.hidden=false;document.body.style.overflow='hidden';const extra=i===0?['SbcAb0YDNv6PLqpq5XAlze41BM.jpg','F487AXTxDP4zFhdlhNPN7uwgOIk.jpg','ykCmCfzhgrEyaaT99BSLyOoMNM.jpg'].map(name=>`<img src="https://framerusercontent.com/images/${name}?width=1500" alt="${p.name} project image" loading="lazy">`).join(''):`<img src="${p.image}" alt="${p.name} project image" loading="lazy">`;detail.querySelector('.detail-body').innerHTML=`<h1>${p.name}</h1><img class="detail-hero" src="${p.image}" alt="${p.name} cover"><div class="detail-description"><span>${p.type} / ${p.date}</span><p>${p.description}<br><br>${p.role.replace(/<br>/g, ' · ')}${i===0?'<br><br><a href="fromanother.html">View full case study ↗</a>':''}</p></div><div class="detail-gallery">${extra}</div><button class="detail-next" type="button"><span>Next project</span><img src="${next.image}" alt=""><strong>${next.name}</strong><span>View next →</span></button>`;detail.querySelector('.detail-next').onclick=()=>{detail.scrollTop=0;openDetail((i+1)%projects.length)};detail.scrollTop=0}
function closeOverlays(){focus.hidden=true;detail.hidden=true;document.body.style.overflow='';focused=-1}focus.querySelector('.focus-close').onclick=closeOverlays;detail.querySelector('.detail-close').onclick=closeOverlays;addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays()});

// ── 开场动画收尾：5500ms 后加 .is-done（about.js 用的是 4700ms，两者并不统一）。
// prefers-reduced-motion 时立即结束。若由站内跳转进入，page-transition.js 会直接移除该元素。
const loader=document.getElementById('intro-loader');if(loader)setTimeout(()=>loader.classList.add('is-done'),matchMedia('(prefers-reduced-motion: reduce)').matches?0:5500);
