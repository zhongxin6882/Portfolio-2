import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless:true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})
});
const origin = process.env.MOBILE_TEST_URL || 'http://127.0.0.1:4173/Portfolio-2/';
const routes = ['index.html', 'about/', 'playground.html', 'contact.html'];
let checks = 0;
try {
  for (const width of [320,375,390,430]) {
    for (const route of routes) {
      const page = await browser.newPage({viewport:{width,height:820},deviceScaleFactor:1,reducedMotion:'reduce'});
      page.on('pageerror', error => { if (!/ResizeObserver loop/.test(error.message)) console.error('[PAGE ERROR]',route,width,error.message); });
      await page.goto(new URL(route,origin).href,{waitUntil:'domcontentloaded',timeout:30000});
      await page.addStyleTag({content:'#intro-loader,.page-transition{display:none!important}'});
      await page.waitForFunction(() => document.querySelector('#menuToggle')?.getAttribute('aria-expanded') === 'false');
      const closed = await page.evaluate(() => ({
        expanded:document.querySelector('#menuToggle').getAttribute('aria-expanded'),
        menu:getComputedStyle(document.querySelector('#menu')).display,
        mark:!!document.querySelector('.chrome .brand-flip'),
        css:[...document.styleSheets].some(x => x.href?.includes('mobile-responsive.css')),
        overflow:document.documentElement.scrollWidth-window.innerWidth,
        brandText:getComputedStyle(document.querySelector('.chrome .brand'),'::after').content,
        brandFace:getComputedStyle(document.querySelector('.chrome .brand-flip')).display,
        brandPosition:getComputedStyle(document.querySelector('.chrome .brand')).position,
        menuBorder:getComputedStyle(document.querySelector('#menuToggle')).borderTopWidth,
        menuShadow:getComputedStyle(document.querySelector('#menuToggle')).boxShadow
      }));
      assert.equal(closed.expanded,'false',route+' '+width+': menu should start closed');
      assert.equal(closed.menu,'none',route+' '+width+': nav should not flash');
      assert(closed.mark && closed.css,route+' '+width+': shared brand/css missing');
      assert(closed.overflow<=2,route+' '+width+': horizontal overflow '+closed.overflow+'px');
      assert(closed.brandText.includes('CENTER©') && closed.brandFace==='none' && closed.brandPosition==='fixed',route+' '+width+': phone wordmark should stay horizontal and static');
      assert(closed.menuBorder==='0px' && closed.menuShadow==='none',route+' '+width+': phone menu still has a frame');
      const surface=await page.evaluate(() => {
        const target=document.querySelector('.about-page .art-panel,.contact-redesign,.work-home,.playground-body .play-page');
        return target && getComputedStyle(target).backgroundColor;
      });
      assert.equal(surface,'rgb(237, 237, 237)',route+' '+width+': page background differs from #EDEDED');

      await page.locator('#menuToggle').click();
      const opened = await page.evaluate(() => ({
        expanded:document.querySelector('#menuToggle').getAttribute('aria-expanded'),
        menu:getComputedStyle(document.querySelector('#menu')).display,
        bodyLocked:document.body.classList.contains('mobile-menu-open'),
        links:document.querySelectorAll('#menu a').length,
        audio:getComputedStyle(document.querySelector('.chrome .audio')).display,
        contact:getComputedStyle(document.querySelector('.chrome .inquiry')).display
      }));
      assert.equal(opened.expanded,'true');
      assert.equal(opened.menu,'flex');
      assert(opened.bodyLocked&&opened.links===4&&opened.audio!=='none'&&opened.contact!=='none',route+' '+width+': overlay missing sections');
      await page.locator('#audioToggle .audio-wave svg path').waitFor({state:'attached',timeout:15000});
      await page.locator('#audioToggle').click();
      const mobileAudio = await page.evaluate(() => {
        const button=document.querySelector('#audioToggle');
        const wave=button.querySelector('.audio-wave');
        return {
          pressed:button.getAttribute('aria-pressed'),
          label:button.querySelector('.audio-label').textContent,
          visible:getComputedStyle(wave).display!=='none',
          oldBars:wave.querySelectorAll('i').length,
          paths:wave.querySelectorAll('svg path').length,
          shape:wave.querySelector('svg path')?.getAttribute('d')
        };
      });
      assert.equal(mobileAudio.pressed,'true',route+' '+width+': audio did not turn on');
      assert.equal(mobileAudio.label,'On',route+' '+width+': audio label did not update');
      assert(mobileAudio.visible&&mobileAudio.oldBars===0&&mobileAudio.paths===1&&mobileAudio.shape?.startsWith('M'),route+' '+width+': phone audio should show one SVG line');
      await page.locator('#audioToggle').click();
      assert.equal(await page.locator('#audioToggle').getAttribute('aria-pressed'),'false',route+' '+width+': audio did not turn off');
      assert.equal(await page.locator('#audioToggle .audio-wave').evaluate(el=>getComputedStyle(el).display),'none',route+' '+width+': audio line remained visible after turning off');
      await page.locator('#menuToggle').click();
      assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
      if(route==='index.html'){
        assert(await page.locator('.work-card').count()===19,'Work lost cards');
        assert(await page.locator('.work-mobile-caption').first().isVisible(),'Work mobile caption hidden');
        // Global scroll-behavior:smooth is intentional; disable it only for the
        // regression test so counter checks target a settled scroll position.
        await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
        await page.locator('.work-card').nth(1).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
        await page.waitForFunction(() => document.querySelector('#work-number')?.textContent?.trim() !== '01',undefined,{timeout:3000});
        const current = await page.locator('#work-number').textContent();
        assert(current!=='01','Work scroll counter did not update at '+width);
      }
      if(route==='playground.html'){
        assert(await page.locator('.play-card').count()===24,'Playground cards missing');
        const cols=await page.locator('.play-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
        assert.equal(cols,1,'Playground must be single-column');
        const top=await page.locator('.play-grid').boundingBox();
        const number=await page.locator('.play-count').boundingBox();
        assert(top.y>=number.y+number.height,'Playground count must precede images');
      }
      if(route==='about/'){
        const art=await page.locator('.art-panel').boundingBox();
        const stage=await page.locator('.art-stage').boundingBox();
        const resume=await page.locator('.resume').boundingBox();
        assert(art.y<resume.y,'About artwork must precede resume');
        assert(stage.y>=65&&stage.y<=110,'About artwork has excessive top clearance at '+width);
      }
      if(route==='contact.html'){
        const intro=await page.locator('.contact-intro').boundingBox();
        assert(intro.y+intro.height<=340,'Contact illustration has excessive top clearance at '+width);
        const logos=await page.evaluate(() => ({
          zcool:document.querySelector('.zcool-logo').getBoundingClientRect().width,
          xiaohongshu:document.querySelector('.xiaohongshu-logo').getBoundingClientRect().width
        }));
        assert(Math.abs(logos.zcool-85.5)<1 && Math.abs(logos.xiaohongshu-61.2)<1,'Contact logo scaling is incorrect at '+width);
      }
      console.log('PASS',width,route);
      checks++;
      await page.close();
    }
  }
  const desktop = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  for(const route of routes){
    await desktop.goto(new URL(route,origin).href,{waitUntil:'domcontentloaded'});
    await desktop.addStyleTag({content:'#intro-loader,.page-transition{display:none!important}'});
    const desktopSurface=await desktop.evaluate(() => {
      const target=document.querySelector('.about-page .art-panel,.contact-redesign,.work-home,.playground-body .play-page');
      return target && getComputedStyle(target).backgroundColor;
    });
    assert.equal(desktopSurface,'rgb(237, 237, 237)','Desktop background differs from #EDEDED: '+route);
    assert(await desktop.locator('#menu a').first().isVisible(),'Desktop navigation must remain visible: '+route);
    assert.equal(await desktop.locator('.brand-flip').evaluate(el=>getComputedStyle(el).display),'block','Desktop rotating brand hidden: '+route);
    if(route==='index.html'){
      await desktop.locator('#audioToggle .audio-wave svg path').waitFor({state:'attached',timeout:15000});
      await desktop.locator('#audioToggle').click();
      const indicator=await desktop.locator('#audioToggle .audio-wave').evaluate(el=>({
        visible:getComputedStyle(el).display!=='none',
        oldBars:el.querySelectorAll('i').length,
        paths:el.querySelectorAll('svg path').length
      }));
      assert(indicator.visible&&indicator.oldBars===0&&indicator.paths===1,'Desktop audio indicator should show one SVG line');
      await desktop.locator('#audioToggle').click();
    }
    if(route==='index.html'){
      assert.equal(await desktop.locator('.work-mobile-caption').first().evaluate(el=>getComputedStyle(el).display),'none','Desktop mobile caption must remain hidden');
    }
    if(route==='playground.html'){
      const cols=await desktop.locator('.play-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(cols,4,'Desktop Playground must retain four columns');
    }
    if(route==='contact.html'){
      const intro=await desktop.locator('.contact-intro').boundingBox();
      const navigation=await desktop.locator('.contact-navigation').boundingBox();
      assert(navigation.x>=intro.x+intro.width-2,'Desktop Contact columns changed');
    }
    console.log('PASS desktop',route);
    checks++;
  }
  // Verify the actual stagger reveal, not just the reduced-motion fallback.
  // The desktop right-hand grid scrolls independently, leaving the left rail fixed.
  const motionPage=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await motionPage.goto(new URL('playground.html',origin).href,{waitUntil:'domcontentloaded'});
  await motionPage.addStyleTag({content:'#intro-loader,.page-transition{display:none!important}'});
  await motionPage.locator('.play-card').last().waitFor({state:'attached'});
  const initialSideY=(await motionPage.locator('.play-side').boundingBox()).y;
  await motionPage.locator('.play-card').last().evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
  await motionPage.waitForFunction(() => {
    const last=document.querySelector('.play-card:last-child');
    return last && parseFloat(getComputedStyle(last).opacity)>=.99;
  },null,{timeout:7000});
  const scrolled=await motionPage.evaluate(() => ({
    gridScroll:document.querySelector('.play-grid').scrollTop,
    windowScroll:window.scrollY,
    lastOpacity:getComputedStyle(document.querySelector('.play-card:last-child')).opacity
  }));
  const finalSideY=(await motionPage.locator('.play-side').boundingBox()).y;
  assert(scrolled.gridScroll>0,'Desktop Playground right stream did not scroll');
  assert(Math.abs(scrolled.windowScroll)<2,'Desktop Playground unexpectedly scrolled the full page');
  assert(Math.abs(finalSideY-initialSideY)<2,'Desktop Playground left rail moved');
  await motionPage.locator('.play-grid').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  assert.equal(await motionPage.locator('.play-card').last().evaluate(el=>getComputedStyle(el).opacity),'1','Staggered card disappeared after scrolling back');
  console.log('PASS desktop Playground ScrollTrigger.batch stagger');
  checks++;
  await motionPage.close();

  console.log('ALL PASS:',checks,'responsive route checks');
}finally{
  await browser.close();
}
