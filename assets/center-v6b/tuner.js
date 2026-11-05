/* CENTER · interactive V6 effects tuner. Works offline with standalone.html. */
(() => {
  'use strict';
  const $ = q => document.querySelector(q);
  const toggle = $('#tuner-toggle');
  const panel = $('#tuner-panel');
  const controls = [...panel.querySelectorAll('input[data-path]')];
  const defaultConfig = JSON.parse(JSON.stringify(window.CENTER_EFFECTS));
  let feedbackTimer;
  const pathValue = path => path.split('.').reduce((object,key) => object?.[key],window.CENTER_EFFECTS);
  function setPath(path,value) {
    const [section,key]=path.split('.');
    if (window.CENTER_EFFECTS[section] && Number.isFinite(value)) window.CENTER_EFFECTS[section][key]=value;
  }
  const formatValue=(n,unit)=>`${Number(n.toFixed(2))}${unit||''}`;
  function showFeedback(text) {
    $('#tuner-feedback').textContent=text;
    clearTimeout(feedbackTimer);
    feedbackTimer=setTimeout(()=>$('#tuner-feedback').textContent='',2300);
  }
  function updateLabels() {
    controls.forEach(input=>{
      const value=Number(pathValue(input.dataset.path));
      input.value=String(value);
      panel.querySelector(`label[for="${input.id}"] output`).textContent=formatValue(value,input.dataset.unit);
    });
  }
  const setOpen = open => {
    panel.classList.toggle('is-visible',open);
    panel.setAttribute('aria-hidden',String(!open));
    panel.inert=!open;
    toggle.setAttribute('aria-expanded',String(open));
    if(open) $('#tuner-close').focus({preventScroll:true});
    else toggle.focus({preventScroll:true});
  };
  toggle.addEventListener('click',()=>setOpen(!panel.classList.contains('is-visible')));
  $('#tuner-close').addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && panel.classList.contains('is-visible'))setOpen(false)});
  controls.forEach(input=>input.addEventListener('input',()=>{
    setPath(input.dataset.path,Number(input.value));
    updateLabels();
    window.CENTER_applyEffects?.();
  }));
  panel.querySelectorAll('button[data-jump]').forEach(button=>button.addEventListener('click',()=>{
    const el=document.getElementById(button.dataset.jump) || (button.dataset.jump==='about' ? document.querySelector('main.about-page#top') : null);
    setOpen(false);
    if (el) window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY,behavior:'instant'});
  }));
  $('#tuner-reset').addEventListener('click',()=>{
    Object.keys(defaultConfig).forEach(section=>Object.assign(window.CENTER_EFFECTS[section],defaultConfig[section]));
    window.CENTER_applyEffects?.();
    updateLabels();
    showFeedback('已恢复推荐值');
  });
  $('#tuner-copy').addEventListener('click',async()=>{
    const c=window.CENTER_EFFECTS;
    const content=`请基于 CENTER About V6 源码，仅优化动画参数，保留 WORK + 01—04 同一轨道连续向左的排版、不恢复 PERSONAL INFORMATION 页面、腾讯职位与职责待提供，不虚构细节、保持离线可用和照片墙弹窗正常。

目标参数：
- WORK 简介 + 01—04 同轨每段滚动距离：${c.career.screensPerCard} 屏
- 轨道完成后的停留：${c.career.fourthHoldScreens} 屏
- Hover 图片淡入：${c.career.hoverPhotoFadeSeconds} 秒
- Hover 图片初始缩放：${c.career.hoverPhotoStartScale} 倍
- WORK → 滑板覆盖转场：${c.bridge.overscrollScreens} 屏
- 滑板人物完整展示停留：${c.bridge.introHoldScreens} 屏
- PLAYFUL DESIGN 粒子互动章节：${c.bridge.scrollScreens} 屏
- Bento 照片墙章节：${c.gallery.scrollScreens} 屏
- Bento 初始缩放：${c.gallery.startScale} 倍
- Bento 初始旋转：${c.gallery.tiltDegrees} 度
- 弹窗离线放大：${c.modal.nativeOpenMilliseconds} 毫秒

修改后输出独立 standalone.html，测试 1440px 桌面和 390px 手机端。`;
    try { if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
      else {const el=document.createElement('textarea');el.value=content;document.body.appendChild(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok) throw new Error('Clipboard unavailable')}
      showFeedback('AI 修改指令已复制');
    } catch(err) {
      // Local file:// browsers can reject clipboard permissions; provide a manual fallback.
      const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='CENTER_V6_AI_调效指令.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
      showFeedback('已导出 AI 指令文件');
    }
  });
  updateLabels();
  panel.inert=true;
})();
