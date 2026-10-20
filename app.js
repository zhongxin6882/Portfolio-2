/**
 * app.js — fromanother.html 项目案例页专用
 *
 * 本文件是压缩过的单行代码，**请勿格式化重排**（会让 diff 变成整文件替换，无法 review）。
 * 需要修改时用精确字符串替换。
 *
 * 职责：
 *   1. 关闭浏览器滚动位置恢复（history.scrollRestoration = 'manual'），pageshow 时滚回顶部
 *   2. 用 ids 数组里的 11 个 framerusercontent 图片 ID 生成 .frame 图墙与 .rail 导航圆点
 *      —— 第 3 张（i === 2）额外加 .tall 变高；前 2 张 eager 加载，其余 lazy
 *   3. IntersectionObserver（threshold .17）：进入视口给 frame 加 .show、给对应圆点加 .active
 *   4. 滚动视差：按 frame 中心相对视口中心的偏移做 translate3d，最大 ±45px，
 *      用 ticking 标志 + requestAnimationFrame 节流，监听器为 passive
 *   5. 自定义光标 .cursor 跟随指针（-18px 偏移使其居中）
 *   6. 开场动画：5500ms 后给 #intro-loader 加 .is-done；prefers-reduced-motion 时立即结束
 *
 * ⚠️ 11 张图片全部热链 framerusercontent.com，仓库内没有本地副本（授权风险见 README.md）。
 * ⚠️ 依赖 .cursor 元素存在，否则 pointermove 里会抛错。
 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
addEventListener('pageshow', () => { if (!location.hash) scrollTo(0, 0); });
const ids=['SbcAb0YDNv6PLqpq5XAlze41BM.jpg','F487AXTxDP4zFhdlhNPN7uwgOIk.jpg','ykCmCfzhgrEyaaT99BSLyOoMNM.jpg','EoNwdwx3ZekuUUuEq2qz2xyKs.jpg','CumijdagSnZBJbds0DhbHzN6mC8.jpg','9zq6Gjzblvy4WlyHuEPdtga60.jpg','G86SeqqiZSDPrtSVR4wKSJI8c.png','0tXpYw1WwCYHCuAWYCWVFWv2zw.jpg','rxKNlFDEZmSLTHwtMWhJtirYM.jpg','76tAQEmcHIUgnYvD4xULbFXfKw.jpg','dGUd0Tyud5daPsNiOkRFsbiZD4.png'];const gallery=document.querySelector('.gallery'),rail=document.querySelector('.rail');ids.forEach((id,i)=>{const f=document.createElement('figure');f.className='frame'+(i===2?' tall':'');f.id='image-'+(i+1);const img=new Image();img.src='https://framerusercontent.com/images/'+id+'?width=1860';img.alt='FROMANOTHER project preview '+(i+1);img.loading=i<2?'eager':'lazy';f.append(img);gallery.append(f);const b=document.createElement('button');b.setAttribute('aria-label','Go to image '+(i+1));b.onclick=()=>f.scrollIntoView({behavior:'smooth',block:'center'});rail.append(b)});const frames=[...document.querySelectorAll('.frame')],dots=[...rail.children],observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');dots[frames.indexOf(e.target)]?.classList.add('active')}else dots[frames.indexOf(e.target)]?.classList.remove('active')}),{threshold:.17});frames.forEach(f=>observer.observe(f));let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const h=innerHeight;for(const f of frames){const r=f.getBoundingClientRect();if(r.bottom<0||r.top>h)continue;f.firstElementChild.style.transform=`translate3d(0,${((r.top+r.height/2-h/2)/h)*-45}px,0)`}ticking=false})},{passive:true});const c=document.querySelector('.cursor');addEventListener('pointermove',e=>{c.style.opacity='1';c.style.transform=`translate(${e.clientX-18}px,${e.clientY-18}px)`});

// Exit after the push reveal and a brief title hold.
(()=>{const loader=document.getElementById('intro-loader');if(!loader)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){loader.classList.add('is-done');return}setTimeout(()=>loader.classList.add('is-done'),5500)})();