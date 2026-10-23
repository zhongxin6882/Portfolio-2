import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const origin = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:4173/Portfolio-2/';
const routes = ['index.html', 'about/', 'playground.html', 'contact.html'];
const sizes = [390, 1440];
let passed = 0;

try {
  for (const width of sizes) {
    for (const route of routes) {
      const page = await browser.newPage({
        viewport: {width, height: 820},
        reducedMotion: 'no-preference'
      });
      await page.goto(new URL(route, origin).href, {waitUntil: 'domcontentloaded'});
      await page.addStyleTag({content: '#intro-loader,.page-transition{display:none!important}'});

      const sound = page.locator('#audioToggle');
      const wave = sound.locator('.audio-wave');
      await wave.locator('svg path').waitFor({state: 'attached',timeout:15000});

      assert.equal(await sound.getAttribute('aria-pressed'),'false');
      assert.equal(await wave.locator('i').count(),0,'Old vertical bars were not removed');
      assert.equal(await wave.evaluate(e=>getComputedStyle(e).display),'none');
      assert(await page.locator('.chrome .brand-flip').count()===1,'Shared copyright/person mark missing');

      if (width<761) {
        const toggle=page.locator('#menuToggle');
        assert.equal(await toggle.getAttribute('aria-expanded'),'false','Mobile menu must start closed');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'),'true','Mobile menu failed to open');
      } else {
        assert(await page.locator('#menu a').first().isVisible(),'Desktop navigation was hidden');
      }

      await sound.click();
      assert.equal(await sound.getAttribute('aria-pressed'),'true');
      assert.notEqual(await wave.evaluate(e=>getComputedStyle(e).display),'none');
      assert.equal(await wave.locator('svg path').count(),1,'Audio On requires one continuous line');
      // Reference adjustment: reduce 28px to 14px (50% width), 14px to 10.5px (75% height).
      const waveSize = await wave.locator('svg').evaluate(el => ({
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        viewBox: el.getAttribute('viewBox')
      }));
      assert.equal(waveSize.viewBox,'0 0 14 10.5');
      assert.equal(waveSize.width,14);
      assert.equal(waveSize.height,10.5);
      const fineTuning = await wave.locator('svg').evaluate(el => ({
        offsetY: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
        strokeWidth: el.querySelector('path')?.getAttribute('stroke-width')
      }));
      assert.equal(fineTuning.offsetY,2,'Wave must be 2px lower without moving surrounding text');
      assert.equal(fineTuning.strokeWidth,'1.24','Wave line must be 20% thinner');

      const before=await wave.locator('path').getAttribute('d');
      await page.waitForTimeout(280);
      const after=await wave.locator('path').getAttribute('d');
      assert.notEqual(before,after,'GSAP should move the sine wave while sound is On');

      await sound.click();
      assert.equal(await sound.getAttribute('aria-pressed'),'false');
      assert.equal(await wave.evaluate(e=>getComputedStyle(e).display),'none');
      const paused=await wave.locator('path').getAttribute('d');
      await page.waitForTimeout(230);
      assert.equal(await wave.locator('path').getAttribute('d'),paused,
        'The waveform should not continue animating after Audio Off');

      console.log('PASS', width, route, 'single horizontal SVG wave; On animated; Off stopped');
      passed++;
      await page.close();
    }
  }

  // Honor reduced-motion preferences without losing the active-state signal.
  const calm = await browser.newPage({
    viewport: {width: 390, height: 820},
    reducedMotion: 'reduce'
  });
  await calm.goto(new URL('contact.html', origin).href, {waitUntil: 'domcontentloaded'});
  await calm.addStyleTag({content:'#intro-loader,.page-transition{display:none!important}'});
  await calm.locator('#audioToggle .audio-wave svg path').waitFor({state:'attached',timeout:15000});
  await calm.locator('#menuToggle').click();
  await calm.locator('#audioToggle').click();
  const staticBefore=await calm.locator('#audioToggle .audio-wave path').getAttribute('d');
  await calm.waitForTimeout(250);
  assert.equal(await calm.locator('#audioToggle .audio-wave path').getAttribute('d'),staticBefore);
  console.log('PASS reduced-motion static waveform');
  passed++;
  console.log('All audio waveform checks passed:', passed);
} finally {
  await browser.close();
}
