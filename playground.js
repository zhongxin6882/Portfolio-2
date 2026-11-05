import { gsap } from 'gsap';

/**
 * playground.js — 灵感实验室：卡片墙渲染 + GSAP 入场动画 + 计数器
 * 由 Vite 作为模块加载，GSAP 从 npm 包导入。
 *
 * 动画有两个分支：正常模式走 GSAP 时间轴，用户开启减弱动效时走降级分支。
 *    **改动画效果时两个分支都要改**，否则降级路径会与主路径表现不一致。
 *
 * 依赖的 DOM 契约：.play-grid、[data-count]、.play-tagline、.play-topline
 * （后三者缺失时各自功能静默跳过，不报错。）
 */
// ── 数据源：24 个 {title, image}。图片全部热链 framerusercontent.com，仓库内无本地副本。
const projects = [{"title": "Portfolio Experiment", "image": "https://framerusercontent.com/images/naxFhzwoin7ef9YGF7rY6T7XQ.jpg?width=1924&height=1204"}, {"title": "Portfolio Experiment 2", "image": "https://framerusercontent.com/images/BnlS57c1Eu4cm9dlc1OKgnA5Eg.jpg?scale-down-to=2048&width=2000&height=2667"}, {"title": "Portfolio Experiment 3", "image": "https://framerusercontent.com/images/VYZYGRCiQsj8Nafw6XWoluok.png?scale-down-to=2048&width=2432&height=2497"}, {"title": "CSSDA", "image": "https://framerusercontent.com/images/NAgphqz6lhWRkRpqSAGc4wABKxw.jpg?width=1500&height=2000"}, {"title": "Nominations", "image": "https://framerusercontent.com/images/XC9gUAnz4InaiktxlBF6szU4uw.jpg?width=2000&height=1500"}, {"title": "Documatic", "image": "https://framerusercontent.com/images/vliNc7DwtLZLNDQszqiwulgJIA.jpg?width=1600&height=1200"}, {"title": "Achievement Unlock", "image": "https://framerusercontent.com/images/6TEDOYyBsIihifKwTrLOeN8llU.jpg?scale-down-to=2048&width=2800&height=2100"}, {"title": "Awwwards", "image": "https://framerusercontent.com/images/ZxnFVIWoGoPPGQC3YyAcdtbeWBk.jpg?scale-down-to=2048&width=3010&height=3010"}, {"title": "CSSDA 10th", "image": "https://framerusercontent.com/images/vwgNHf2QwnxuicglISMNg18mL0o.png?width=1920&height=1920"}, {"title": "Greenbox 2", "image": "https://framerusercontent.com/images/M9RHDajKKje1jUrZHGsYX6aOVOc.jpg?width=1999&height=1999"}, {"title": "Greenbox Concept", "image": "https://framerusercontent.com/images/9FVWJ9XgNhpsRFsTRJN9hztTnEs.jpg?width=2120&height=1446"}, {"title": "Rise OS 2", "image": "https://framerusercontent.com/images/1NUod5018gLP24mRA35nibMfM.jpg?width=1920&height=1200"}, {"title": "Rise OS", "image": "https://framerusercontent.com/images/WvqNEbiojiO0AJHcV0O7EwRxFMQ.webp?width=1600&height=1200"}, {"title": "Friday Exploration", "image": "https://framerusercontent.com/images/robsPe1RoLUk4mb38a4vXgA5Y.webp?width=1504&height=1128"}, {"title": "Series Eight Concept", "image": "https://framerusercontent.com/images/tUDP8gTi0JbmIY0CKfT3tAqY0.webp?width=1600&height=1200"}, {"title": "Year in Review", "image": "https://framerusercontent.com/images/4VHAb4Kf8MnfDjtKdVNT6JJt60.webp?width=1600&height=1200"}, {"title": "Henrique", "image": "https://framerusercontent.com/images/R4mJJAe7wnYOHAuMMd5UtI7NNU.webp?width=1600&height=1200"}, {"title": "Portfolio Experiment ’24", "image": "https://framerusercontent.com/images/vMQIm8jejo1tfXQaQMI1FJ0TTrw.webp?scale-down-to=2048&width=2880&height=2160"}, {"title": "Soravia Transition", "image": "https://framerusercontent.com/images/OaeWFHLzGWF1GbyV5labsYLgaU.webp?width=2400&height=1800"}, {"title": "Soravia", "image": "https://framerusercontent.com/images/Vx1W88l9dSR0bxFvXA6oxDchTI.jpg?scale-down-to=2048&width=2223&height=2964"}, {"title": "Soravia 2", "image": "https://framerusercontent.com/images/1OC0up4qkeNs9ChETblY4wiB9c.jpg?scale-down-to=1024&width=3000&height=4001"}, {"title": "Fortress Garden", "image": "https://framerusercontent.com/images/32iOzBMUwOoqhAdnCqPkuhIia0M.jpg?scale-down-to=2048&width=2224&height=2224"}, {"title": "Fortress Garden II", "image": "https://framerusercontent.com/images/xJUPunZ3kNbrrRZ2YN1aId2O6jQ.webp?width=2048&height=1536"}, {"title": "Serious Business Concept 2", "image": "https://framerusercontent.com/images/vVYQXXLc0caBklYVkcQBtK0RK8w.jpg?scale-down-to=2048&width=2486&height=1767"}];
// 渲染纯图片卡片墙，项目名仅保留为图片替代文本；前 8 张 eager 加载，其余 lazy。
const grid=document.querySelector('.play-grid');
projects.forEach((item,index)=>{
  const card=document.createElement('article');
  card.className='play-card';
  card.innerHTML=`<div class="play-image-wrap"><img src="${item.image}" alt="${item.title}" loading="${index<8?'eager':'lazy'}"></div>`;
  grid.append(card);
});

// ── 动画前置状态：减弱动效偏好、计数目标值 83、首次访问标记的 localStorage 键。
const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const count=document.querySelector('[data-count]');
const target=83;
const key='september15-play-count-seen';
const cards=[...document.querySelectorAll('.play-card')];
const tagline=document.querySelector('.play-tagline');
const topLine=document.querySelector('.play-topline');

  // ── 主分支（GSAP 可用）：topline → tagline → 计数器 → 卡片的串行时间轴。
  // 计数器只在首次访问时播放（localStorage 标记），回访直接显示终值。
  // 前 4 张卡片进时间轴，其余交给 IntersectionObserver（threshold .12）滚动触发。
if(!prefersReducedMotion){
  const intro=gsap.timeline({defaults:{ease:'power3.out'}});
  if(topLine) intro.from(topLine,{y:12,opacity:0,duration:.55});
  if(tagline) intro.from(tagline,{y:18,opacity:0,duration:.65},'-=.24');
  if(count){
    const firstVisit=!localStorage.getItem(key);
    if(firstVisit){
      const counter={value:0};
      intro.to(counter,{value:target,duration:1.35,ease:'power2.out',onUpdate:()=>count.textContent=Math.floor(counter.value)},'-=.3');
      intro.call(()=>localStorage.setItem(key,'1'));
    }else count.textContent=target;
  }
  if(cards.length){
    gsap.set(cards,{opacity:0,y:18,scale:.985});
    const reveal=card=>gsap.to(card,{opacity:1,y:0,scale:1,duration:.72,ease:'back.out(1.45)',overwrite:true});
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target)}
    }),{threshold:.12});
    cards.forEach((card,index)=>{
      if(index<4){intro.to(card,{opacity:1,y:0,scale:1,duration:.72,ease:'back.out(1.45)'},index===0?'-=.35':'-=.54')}
      else observer.observe(card);
    });
  }
  if(tagline){
    tagline.addEventListener('pointerenter',()=>gsap.to(tagline,{backgroundPosition:'100% 50%',duration:.7,ease:'power2.out'}));
    tagline.addEventListener('pointerleave',()=>gsap.to(tagline,{backgroundPosition:'0% 50%',duration:.7,ease:'power2.out'}));
  }
  // ── 降级分支（无 GSAP 或开启减弱动效）：直接用 CSS 类完成呈现，计数器写终值。
  // 这里加的 .is-visible / .type-in 需要 style.css 里有对应的静态样式兜底。
}else{
  if(count) count.textContent=target;
  cards.forEach(card=>card.classList.add('is-visible'));
  if(tagline) tagline.classList.add('type-in');
}
