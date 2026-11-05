/* CENTER ABOUT — Recreated V6 / GSAP 3.15 progressive-enhancement demo.
 * Works offline with native sticky scrolling. GSAP ScrollTrigger + Flip enhance
 * the chapter, photo-wall scroll, and modal whenever scripts load.
 */
(() => {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const career = $('#experience');
  const careerStage = $('.career-stage');
  const workIntro = $('.career-aside'); // First item inside the horizontal track
  const careerWindow = $('.career-window');
  const careerTrack = $('#career-track');
  const cards = $$('.career-card');
  const cardCount = cards.length;
  // VERIFIED PUBLIC PHOTO SOURCES (optional). The standalone works offline:
  // 01/02 retain the generated concept fallback until a public image loads.
  // 03 has no verified company photo; 04 has no confirmed employer at all.
  for (const img of document.querySelectorAll('.career-photo img[data-public-photo-url]')) {
    // file:// and about:blank never need network: keep the self-contained preview.
    if (location.protocol !== 'http:' && location.protocol !== 'https:') continue;
    const remote = new Image();
    remote.decoding = 'async';
    remote.onload = () => {
      if (remote.naturalWidth < 200) return;
      img.src = remote.src;
      img.alt = img.dataset.publicPhotoAlt;
      img.dataset.photoOrigin = 'public-source';
    };
    remote.onerror = () => {img.dataset.photoOrigin = 'offline-concept-fallback';};
    remote.src = img.dataset.publicPhotoUrl;
  }

  const counter = $('#active-count');
  const hud = $('#career-hud');
  const progress = $('#career-progress-bar');
  const bridge = $('#make-it-matter');
  const bridgeStage = $('.skater-sticky');
  const gallery = $('#gallery');
  const tiles = $$('.bento-tile');
  const modal = $('#photo-modal');
  const modalSlot = $('#modal-image-slot');
  const backdrop = $('.photo-backdrop');
  const closeButton = $('#close-photo');
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // AI CONFIG: effect-config.js is loaded before main.js and contains all tuning knobs.
  const tuning = window.CENTER_EFFECTS || {};
  const opt = (section, key, fallback) => {
    const value = tuning[section]?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  };
  const introOverlap = () => prefersReducedMotion.matches ? 0 : innerHeight;
  let oneCardScreens = 0.85;
  let fourthHoldScreens = 0.9;
  let overscrollScreens = 1.35;
  let introHoldScreens = 1.1;
  const rootStyle = document.documentElement.style;
  function applyLayout() {
    const left = clampPercent(opt('career','leftColumnPercent',40), 25, 70);
    oneCardScreens = innerWidth <= 760 ? 1 : Math.max(.3, opt('career','screensPerCard',.85));
    fourthHoldScreens = Math.max(0, opt('career','fourthHoldScreens',.9));
    overscrollScreens = Math.max(.25,Math.min(2.3,opt('bridge','overscrollScreens',1.35)));
    introHoldScreens = Math.max(.2,Math.min(2.8,opt('bridge','introHoldScreens',1.1)));
    // The WORK introduction travels together with 01,02,03,04: 5 stages.
    const careerTotalScreens = 1 + cards.length*oneCardScreens + fourthHoldScreens;
    rootStyle.setProperty('--career-left', `${left}%`);
    rootStyle.setProperty('--career-right', `${100-left}%`);
    // We still expose the V6B slider, but it adjusts INTRO width now.
    // Every panel remains within the same horizontal strip, including WORK.
    rootStyle.setProperty('--work-intro-width', innerWidth > 760 ? `${clampPercent(left - 4,27,57)}vw` : '100vw');
    rootStyle.setProperty('--career-card-width', `${innerWidth > 760 ? 38 : 100}vw`);
    rootStyle.setProperty('--career-photo-fade', `${opt('career','hoverPhotoFadeSeconds',.35)}s`);
    rootStyle.setProperty('--career-photo-zoom', `${opt('career','hoverPhotoZoomSeconds',.75)}s`);
    rootStyle.setProperty('--career-photo-scale', opt('career','hoverPhotoStartScale',1.06));
    rootStyle.setProperty('--career-detail-time', `${opt('career','detailFadeSeconds',.4)}s`);
    rootStyle.setProperty('--career-detail-height-desktop', `${opt('career','detailMaxHeightDesktopPx',340)}px`);
    rootStyle.setProperty('--career-detail-height-mobile', `${opt('career','detailMaxHeightMobilePx',310)}px`);
    rootStyle.setProperty('--career-detail-height-short', `${opt('career','detailMaxHeightShortScreenPx',300)}px`);
    // GSAP pinned-panels-with-overscroll principle: keep the outgoing
    // WORK panel sticky beyond its normal hold, and let the incoming
    // Skater panel occupy the SAME viewport behind it for this interval.
    // Real normal-flow geometry (no injected clone, no fake scroll listener).
    career.style.height = `${(careerTotalScreens + overscrollScreens + (prefersReducedMotion.matches ? 0 : 1)) * 100}svh`;
    rootStyle.setProperty('--panel-overlap-neg', `${-(1 + overscrollScreens) * 100}svh`);
    rootStyle.setProperty('--panel-overscroll-screens', `${overscrollScreens}`);
    rootStyle.setProperty('--skater-intro-hold-screens', `${introHoldScreens}`);
    bridge.style.height = `${(Math.max(2.2, opt('bridge','scrollScreens',3.7)) + overscrollScreens + introHoldScreens)*100}svh`;
    gallery.style.height = `${Math.max(1, opt('gallery','scrollScreens',2.45))*100}svh`;
    lastRailX = Number.NaN;
  }
  let activeIndex = 0;
  let lastRailX = Number.NaN;
  let galleryTween = null;
  let galleryTrigger = null;
  let titleTween = null;
  let enhanced = false;
  let busy = false;
  let activePhoto = null;
  let activeTile = null;
  let oldBodyOverflow = '';
  let oldFocus = null;
  let scheduled = false;
  applyLayout();

  function clampPercent(n,min,max) { return Math.max(min,Math.min(max,n)); }
  const topOf = (element) => element.getBoundingClientRect().top + scrollY;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const scrollProgress = (section, remainingScroll) => clamp((scrollY - topOf(section)) / Math.max(1, remainingScroll), 0, 1);

  // Faithful to the video: WORK INTRO + 01..04 are 5 neighboring columns in
  // the SAME track; the entire track translates continuously, including WORK.
  // Sticky holds the complete 5-column strip in view, never the intro alone.
  // No snap, no clones and no endless loop. At the far end the next section
  // follows by native document flow.
  const railDistance = () => Math.max(0, careerTrack.scrollWidth - careerWindow.clientWidth);
  const slideScrollDistance = () => Math.max(1, innerHeight * oneCardScreens * cardCount); // intro + four cards
  const railFraction = () => clamp((scrollY - topOf(career) - introOverlap()) / slideScrollDistance(), 0, 1);
  function phaseForCard(i) {
    const d = railDistance();
    if (!d) return 0;
    const card = cards[i];
    const desired = clamp(card.offsetLeft + card.offsetWidth / 2 - careerWindow.clientWidth / 2, 0, d);
    return desired / d;
  }
  function smoothstep(t) {t=clamp(t,0,1);return t*t*(3-2*t);}
  // Pinned panels with overscroll: the incoming Skater panel slides UP
  // OVER the still-pinned WORK panel. The outgoing panel stays full-size.
  // This is intentionally a different layering timeline from the previous
  // (incorrect) shrinking/fading foreground interpretation.
  function updatePinnedOverscroll() {
    const distance = Math.max(1, innerHeight * overscrollScreens);
    const p = clamp((scrollY - topOf(bridge)) / distance, 0, 1);
    const rise = smoothstep(p);
    careerWindow.style.transform = '';
    careerWindow.style.opacity = '1';
    careerWindow.style.borderRadius = '0px';
    bridgeStage.style.transform = `translate3d(0,${(1-rise)*100}%,0)`;
    bridgeStage.style.borderRadius = `${Math.round(18*(1-rise))}px ${Math.round(18*(1-rise))}px 0 0`;
    bridge.style.pointerEvents = p < .45 ? 'none' : 'auto';
    careerStage.style.pointerEvents = p >= .99 ? 'none' : 'auto';
    bridgeStage.dataset.overscrollProgress = p.toFixed(3);
  }

  function updateCareer() {
    const p = railFraction();
    const distance = railDistance();
    const x = -distance * p;
    if (!Number.isFinite(lastRailX) || Math.abs(x - lastRailX) > .04) {
      careerTrack.style.transform = `translate3d(${x}px,0,0)`;
      lastRailX = x;
    }
    // Track actual on-screen card centers, not a hardcoded step counter.
    const center = careerWindow.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    cards.forEach((card,idx) => {
      const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 + x - center);
      if (delta < best) {best=delta;nearest=idx;}
    });
    activeIndex = nearest;
    counter.textContent = `${String(activeIndex + 1).padStart(2,'0')} / 04`;
    hud.textContent = `WORK + ${String(activeIndex + 1).padStart(2,'0')} / 04 · ${p >= .999 ? 'LAST PANEL · NEXT ↓' : 'CONTINUOUS ←'}`;
    progress.style.width = `${p * 100}%`;
    cards.forEach((card,idx) => card.setAttribute('aria-current',idx===activeIndex ? 'true':'false'));
  }


  function gridOffsets(tile) {
    // offsetLeft/Top is layout geometry, unaffected by a previous transform.
    // This prevents Bento images drifting when the user scrolls up and down.
    const grid = $('#bento-grid');
    return {
      dx:(grid.offsetLeft+grid.clientWidth/2) - (tile.offsetLeft+tile.offsetWidth/2),
      dy:(grid.offsetTop+grid.clientHeight/2) - (tile.offsetTop+tile.offsetHeight/2)
    };
  }

  function updateGalleryFallback() {
    if (enhanced) return;
    const percent = scrollProgress(gallery, Math.max(1, gallery.offsetHeight - innerHeight));
    const p = clamp(percent / Math.max(.05,opt('gallery','finishAtNativeProgress',.79)), 0, 1);
    tiles.forEach((tile, i) => {
      const pos = gridOffsets(tile);
      const initialX = pos.dx * opt('gallery','fallbackClusterStrength',.65);
      const initialY = pos.dy * opt('gallery','fallbackClusterStrength',.65) + (i % 2 ? 1 : -1)*opt('gallery','fallbackVerticalOffsetPx',42);
      tile.style.transform = `translate3d(${initialX*(1-p)}px, ${initialY*(1-p)}px,0) scale(${opt('gallery','startScale',.56)+(1-opt('gallery','startScale',.56))*p}) rotate(${(i%2?1:-1)*opt('gallery','tiltDegrees',5)*(1-p)}deg)`;
      tile.style.opacity = String(opt('gallery','fallbackStartOpacity',.22)+(1-opt('gallery','fallbackStartOpacity',.22))*p);
    });
  }

  function update() {
    scheduled = false;
    updateCareer();
    updatePinnedOverscroll();
    updateGalleryFallback();
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', () => {lastRailX = Number.NaN;schedule();}, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(() => {lastRailX = Number.NaN;schedule();}).observe(careerWindow);

  function goToCard(index) {
    const i = clamp(index, 0, cardCount - 1);
    const target = topOf(career) + introOverlap() + phaseForCard(i) * slideScrollDistance();
    scrollTo({top:target, behavior:prefersReducedMotion.matches ? 'instant' : 'smooth'});
    if (innerWidth <= 760) {
      cards.forEach(card => card.classList.remove('is-open'));
      cards[i].classList.add('is-open');
    }
  }

  $('#prev-card').addEventListener('click', () => goToCard(activeIndex - 1));
  $('#next-card').addEventListener('click', () => goToCard(activeIndex + 1));
  cards.forEach(card => {
    const toggle = () => {
      const wasOpen = card.classList.contains('is-open');
      cards.forEach(item => item.classList.remove('is-open'));
      if (!wasOpen) card.classList.add('is-open');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
    });
  });

  // Modal always works without the CDN. GSAP Flip morphs the same <img>
  // between parent containers when the plugin becomes available.
  const canFlip = () => !!(window.gsap && window.Flip && !prefersReducedMotion.matches);
  // Fit lightbox to each photo's actual intrinsic ratio (rather than to a fixed
  // rectangular panel). The X stays at the image's upper-right corner.
  function sizeToPhoto(img) {
    if (!img) return;
    const shell = modalSlot.parentElement;
    const maxWidth = Math.max(180,Math.min(innerWidth - (innerWidth <= 760 ? 90 : 112), 1180));
    const maxHeight = Math.max(120,Math.min(innerHeight - (innerWidth <= 760 ? 112 : 140), 820));
    const intrinsicW = img.naturalWidth || 3;
    const intrinsicH = img.naturalHeight || 2;
    const ratio = intrinsicW / intrinsicH;
    const width = Math.min(maxWidth, maxHeight * ratio);
    const height = width / ratio;
    shell.style.width = `${Math.round(width*100)/100}px`;
    shell.style.height = `${Math.round(height*100)/100}px`;
  }
  addEventListener('resize', () => { if (activePhoto && !modal.hidden) sizeToPhoto(activePhoto); }, {passive:true});
  function openPhoto(tile) {
    if (busy || activePhoto) return;
    busy = true;
    oldFocus = document.activeElement;
    activeTile = tile;
    activePhoto = tile.querySelector('img');
    sizeToPhoto(activePhoto);
    const state = canFlip() ? Flip.getState(activePhoto) : null;
    oldBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.hidden = false;
    modal.classList.remove('closing');
    tile.classList.add('is-source');
    modalSlot.appendChild(activePhoto);
    backdrop.style.opacity = '1';
    requestAnimationFrame(() => closeButton.focus({preventScroll:true}));
    if (state) {
      gsap.from(backdrop, {opacity:0,duration:opt('modal','backdropOpenSeconds',.37)});
      Flip.from(state,{duration:opt('modal','gsapOpenSeconds',.66),ease:tuning.modal?.flipEase || 'power3.inOut',absolute:true,scale:true,onComplete:()=>{busy=false;}});
    } else {
      // Native fallback: allow close/Escape immediately, even during the
      // short intro animation. Cancel any remaining animation on close.
      modalSlot.animate([{transform:'scale(.92)',opacity:.5},{transform:'none',opacity:1}],{duration:prefersReducedMotion.matches?1:opt('modal','nativeOpenMilliseconds',260),easing:'ease-out'}).finished.catch(()=>{});
      busy = false;
    }
  }
  function closePhoto() {
    if (!activePhoto || busy) return;
    busy = true;
    const tile = activeTile;
    const photo = activePhoto;
    const state = canFlip() ? Flip.getState(photo) : null;
    modal.classList.add('closing');
    if (!state) modalSlot.getAnimations().forEach(anim => anim.cancel());
    tile.appendChild(photo);
    const cleanup = () => {
      tile.classList.remove('is-source');
      modal.hidden = true;
      modal.classList.remove('closing');
      document.body.style.overflow = oldBodyOverflow;
      activePhoto = null;
      activeTile = null;
      busy = false;
      if (oldFocus?.focus) oldFocus.focus({preventScroll:true});
    };
    if (state) {
      gsap.to(backdrop,{opacity:0,duration:opt('modal','backdropCloseSeconds',.4)});
      Flip.from(state,{duration:opt('modal','gsapCloseSeconds',.6),ease:tuning.modal?.flipEase || 'power3.inOut',absolute:true,scale:true,onComplete:cleanup});
    } else cleanup();
  }
  tiles.forEach(tile => tile.addEventListener('click', () => openPhoto(tile)));
  closeButton.addEventListener('click', closePhoto);
  backdrop.addEventListener('click', closePhoto);
  document.addEventListener('keydown', ev => {
    if (modal.hidden) return;
    if (ev.key === 'Escape') {ev.preventDefault();closePhoto();}
    if (ev.key === 'Tab') {ev.preventDefault();closeButton.focus({preventScroll:true});}
  });

  function setupGsapScrollEffects() {
    // Dynamic reinitialization keeps all sliders working even with GSAP active.
    if (galleryTrigger) galleryTrigger.kill();
    if (titleTween) titleTween.kill();
    if (galleryTween) galleryTween.kill();
    gsap.killTweensOf(tiles);
    gsap.set(tiles,{clearProps:'transform,opacity,visibility'});
    galleryTween = gsap.timeline({paused:true});
    tiles.forEach((tile,i) => {
      const initialPosition = () => {
        const pos = gridOffsets(tile);
        return {x:pos.dx*opt('gallery','gsapClusterStrength',.64), y:pos.dy*opt('gallery','gsapClusterStrength',.64)+(i%2?1:-1)*opt('gallery','gsapVerticalOffsetPx',40)};
      };
      galleryTween.fromTo(tile,{
        x:()=>initialPosition().x,y:()=>initialPosition().y,
        scale:opt('gallery','startScale',.56),rotation:(i%2?1:-1)*opt('gallery','tiltDegrees',5),autoAlpha:opt('gallery','gsapStartOpacity',.2)
      },{x:0,y:0,scale:1,rotation:0,autoAlpha:1,duration:opt('gallery','gsapTileDuration',1.1),ease:'none',immediateRender:true},i*opt('gallery','gsapStagger',.055));
    });
    galleryTrigger = ScrollTrigger.create({trigger:gallery,start:'top top',end:'bottom bottom',onUpdate:self=>galleryTween.progress(clamp(self.progress/Math.max(.05,opt('gallery','finishAtGsapProgress',.8)),0,1)),invalidateOnRefresh:true});
    // Previous MAKE IT MATTER text no longer exists. The uploaded skater scene
    // owns its own timeline; only the Bento Gallery still uses GSAP here.
    if (document.querySelector('.bridge-title')) {
      titleTween = gsap.fromTo('.bridge-title',{y:opt('bridge','gsapTitleFromYpx',16),opacity:.93},{y:0,opacity:1,ease:'none',scrollTrigger:{trigger:bridge,start:'top top',end:'bottom bottom',scrub:true}});
    }
    ScrollTrigger.refresh();
  }

  // Public hook for the interactive tuning panel (no page reload needed).
  window.CENTER_applyEffects = () => {
    applyLayout();
    if (enhanced) setupGsapScrollEffects();
    schedule();
  };

  window.initGsapEnhancements = () => {
    if (enhanced || !window.gsap || !window.ScrollTrigger || !window.Flip || prefersReducedMotion.matches) return;
    enhanced = true;
    gsap.registerPlugin(ScrollTrigger,Flip);
    setupGsapScrollEffects();
    document.documentElement.dataset.animator = 'GSAP-ScrollTrigger-Flip';
    update();
  };
  document.documentElement.dataset.animator = 'native-sticky';
  window.initGsapEnhancements();
  addEventListener('load', () => {window.initGsapEnhancements();schedule();});
  schedule();
})();
