/*
  CENTER / V6B — third-page scroll integration, no library required.
  The uploaded Skater v14 remains isolated in an iframe so its hundreds of
  particle sprites, canvas ID names, CSS and scroll effects cannot conflict
  with the main portfolio. Instead of allowing an independent inner scroller,
  map the parent's third-section progress to the child's original scrollY.
  Wheel/touch gestures inside the iframe are forwarded to the main document.
*/
(() => {
  'use strict';
  const chapter=document.getElementById('make-it-matter');
  const frame=document.getElementById('skater-frame');
  if (!chapter || !frame) return;
  let ready=false, pending=false;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function sync(){
    pending=false;
    if(!ready || !frame.contentWindow) return;
    const w=frame.contentWindow;
    // Incoming panel sits BEHIND the outgoing WORK panel during the
    // overscroll transition. Hold the Skater at its original first frame
    // until WORK has faded out; only then run its unmodified particle scrub.
    const overScreens=Number(getComputedStyle(document.documentElement).getPropertyValue('--panel-overscroll-screens'))||.8;
    const overlap=innerHeight*overScreens;
    // Deliberate FULL-FIGURE HOLD: the incoming panel remains at frame 0.
    // No child scroll is mapped until the complete skater has been visible
    // for introHoldScreens viewport-heights after the overscroll handoff.
    const holdScreens=Number(getComputedStyle(document.documentElement).getPropertyValue('--skater-intro-hold-screens'))||1.1;
    const hold=innerHeight*holdScreens;
    const length=Math.max(1, chapter.offsetHeight-innerHeight-overlap-hold);
    const top=chapter.getBoundingClientRect().top;
    const raw=clamp((-top-overlap-hold)/length,0,1);
    const progress=raw;
    try {
      const childStage=w.document.getElementById('experience');
      if(!childStage)return;
      const innerLength=Math.max(1,childStage.offsetHeight-w.innerHeight);
      const desired=progress*innerLength;
      if(Math.abs(w.scrollY-desired)>.2) w.scrollTo(0,desired);
      // Some browsers do not dispatch scroll for tiny fractional movement.
      // The original child listens for scroll and applies the animation.
      w.dispatchEvent(new Event('scroll'));
    }catch(err){ console.warn('Skater chapter sync:',err); }
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(sync);}}
  function passScroll(delta){if(Number.isFinite(delta)&&delta)window.scrollBy({top:delta,behavior:'instant'});}
  function setupFrame(){
    if(ready) return;
    const w=frame.contentWindow;
    const d=w?.document;
    if(!d || !d.getElementById('experience')) return;
    ready=true;
    d.documentElement.style.scrollbarWidth='none';
    d.documentElement.style.overscrollBehavior='none';
    const style=d.createElement('style');style.textContent='::-webkit-scrollbar{display:none!important}';d.head.append(style);
    // Capture wheel before the nested document can scroll itself.
    w.addEventListener('wheel',event=>{
      if(event.cancelable)event.preventDefault();
      event.stopPropagation();
      passScroll(event.deltaY);
    },{passive:false,capture:true});
    let prevY=null;
    w.addEventListener('touchstart',event=>{prevY=event.touches[0]?.clientY??null},{passive:true,capture:true});
    w.addEventListener('touchmove',event=>{
      const y=event.touches[0]?.clientY;
      if(y==null || prevY==null)return;
      const delta=prevY-y;prevY=y;
      if(Math.abs(delta)<.1)return;
      if(event.cancelable)event.preventDefault();
      passScroll(delta);
    },{passive:false,capture:true});
    w.addEventListener('touchend',()=>{prevY=null},{passive:true});
    w.addEventListener('keydown',event=>{
      const delta={ArrowDown:80,ArrowUp:-80,PageDown:innerHeight*.8,PageUp:-innerHeight*.8,' ':innerHeight*.8}[event.key];
      if(delta===undefined)return;
      event.preventDefault();passScroll(event.shiftKey?-delta:delta);
    },{capture:true});
    schedule();
    // Sprite image dimensions are decoded asynchronously. Reapply mapping
    // when they become available; the child retains all original logic.
    w.addEventListener('load',schedule,{once:true});
  }
  frame.addEventListener('load',setupFrame);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(schedule).observe(chapter);
  if(frame.contentDocument?.readyState==='complete')setupFrame();
})();
