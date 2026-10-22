import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true});
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
        overflow:document.documentElement.scrollWidth-window.innerWidth
      }));
      assert.equal(closed.expanded,'false',route+' '+width+': menu should start closed');
      assert.equal(closed.menu,'none',route+' '+width+': nav should not flash');
      assert(closed.mark && closed.css,route+' '+width+': shared brand/css missing');
      assert(closed.overflow<=2,route+' '+width+': horizontal overflow '+closed.overflow+'px');

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
        const resume=await page.locator('.resume').boundingBox();
        assert(art.y<resume.y,'About artwork must precede resume');
      }
      console.log('PASS',width,route);
      checks++;
      await page.close();
    }
  }
  const desktop = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await desktop.goto(new URL('index.html',origin).href,{waitUntil:'domcontentloaded'});
  await desktop.addStyleTag({content:'#intro-loader,.page-transition{display:none!important}'});
  assert(await desktop.locator('#menu a').first().isVisible(),'Desktop navigation must remain visible');
  assert.equal(await desktop.locator('.work-mobile-caption').first().evaluate(el=>getComputedStyle(el).display),'none','Desktop mobile caption must remain hidden');
  await desktop.goto(new URL('playground.html',origin).href,{waitUntil:'domcontentloaded'});
  const cols=await desktop.locator('.play-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert.equal(cols,4,'Desktop Playground must retain four columns');
  checks+=2;
  console.log('PASS desktop Work + Playground');
  console.log('ALL PASS:',checks,'responsive route checks');
}finally{
  await browser.close();
}
