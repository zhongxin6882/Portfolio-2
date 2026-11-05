/** CENTER About / V6B — scoped append-only integration for Portfolio-2. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import bodyMarkup from './assets/center-v6b/sections.html?raw';
import cssText from './assets/center-v6b/extension.css?raw';
import { installChapterLocalization } from './assets/center-v6b/localization.js';

async function mountCenterV6B(){
  // The existing showcase embeds About as its first panel; do not nest the new chapters inside it.
  try { if (window.parent !== window && /\/particle-showcase\/?$/.test(window.parent.location.pathname)) return; } catch {}
  const about = document.querySelector('main.about-page#top');
  if (!about || document.getElementById('center-v6b')) return;
  const sheet = document.createElement('style');
  sheet.id='center-v6b-styles';
  sheet.textContent=cssText;
  document.head.appendChild(sheet);
  const extension = document.createElement('div');
  extension.id='center-v6b';
  extension.innerHTML=bodyMarkup;
  about.insertAdjacentElement('afterend',extension);
  installChapterLocalization(extension);
  document.body.classList.add('has-about-chapters');
  const chrome = document.querySelector('.chrome');
  const controls = chrome ? [...chrome.children].filter(node => !node.matches('.brand')) : [];
  const updateHeader = () => {
    const hidden = about.getBoundingClientRect().bottom <= innerHeight * .98;
    chrome?.classList.toggle('chapters-active', hidden);
    if (hidden && chrome?.classList.contains('mobile-menu-open')) document.getElementById('menuToggle')?.click();
    for (const node of controls) node.inert = hidden;
  };
  addEventListener('scroll', updateHeader, {passive:true});
  addEventListener('resize', updateHeader, {passive:true});
  updateHeader();
  if (new URLSearchParams(location.search).get('motionTools') === '1') extension.classList.add('show-motion-tools');
  window.gsap=gsap;
  window.ScrollTrigger=ScrollTrigger;
  window.Flip=Flip;
  gsap.registerPlugin(ScrollTrigger,Flip);
  // Execute after append: these modules locate their DOM nodes at evaluation.
  await import('./assets/center-v6b/effect-config.js');
  await import('./assets/center-v6b/main.js');
  await import('./assets/center-v6b/tuner.js');
  await import('./assets/center-v6b/skater-sync.js');
  window.initGsapEnhancements?.();
  window.dispatchEvent(new Event('resize'));
}
mountCenterV6B().catch(error=>{
  console.error('CENTER V6B extension mount failed:',error);
});
