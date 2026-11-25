import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.WORK_TEST_URL || 'http://127.0.0.1:4173/Portfolio-2/';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
});
const errors = [];

async function open(viewport, noWebGL = false) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1,
    hasTouch: viewport.width <= 760, isMobile: viewport.width <= 760 });
  page.on('pageerror', error => errors.push(error.message));
  if (noWebGL) {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (kind === 'webgl' || kind === 'experimental-webgl') return null;
        return getContext.call(this, kind, ...args);
      };
    });
  }
  await page.goto(new URL('index.html', origin).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.addStyleTag({ content: '#intro-loader,.page-transition{display:none!important}' });
  await page.waitForFunction(() => document.querySelectorAll('.work-card').length === 9);
  return page;
}

async function ready(page, engine) {
  await page.waitForFunction(() => document.body.classList.contains('work-paper-ready') &&
    window.__portfolioWorkPaper21?.state().loaded >= 3, null, { timeout: 30000 });
  const state = await page.evaluate(() => window.__portfolioWorkPaper21.state());
  if (engine) assert.equal(state.engine, engine, `Expected ${engine}, got ${state.engine}`);
  else assert(['WebGL', 'Canvas2D Mesh'].includes(state.engine), `Demo 21 did not activate: ${state.engine}`);
  assert(state.topVisible >= .65 && state.topVisible <= .75,
    `Upper card must be about 70% visible; got ${state.topVisible.toFixed(3)}`);
  assert(state.bottomVisible >= .40 && state.bottomVisible <= .50,
    `Lower card must be about 45% visible; got ${state.bottomVisible.toFixed(3)}`);
  assert(Math.abs(state.center.fold) < .001 && Math.abs(state.center.bend) < .05,
    'Center card is not flat at rest');
  assert(await page.locator('.work-paper-stage').isVisible(), 'Demo 21 canvas is hidden');
  assert.equal(await page.locator('.work-card').first().evaluate(el => getComputedStyle(el).visibility),
    'hidden', 'Original desktop card is covering Demo 21');
  return state;
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 851, height: 720 }]) {
    const page = await open(viewport);
    const state = await ready(page);
    if (viewport.width === 1440) {
      const next = page.locator('.work-paper-hotspot-neighbor').nth(1);
      await next.waitFor({ state: 'visible' });
      await next.click();
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
      await page.waitForFunction(() => Math.abs(window.__portfolioWorkPaper21.state().position - 1) < .05,
        null, { timeout: 1200 });
      assert(await page.locator('#work-focus').isHidden(), 'Adjacent photo click opened preview instead of switching');
      await page.waitForFunction(() => window.__portfolioWorkSfxState().clicks >= 1 &&
        window.__portfolioWorkSfxState().turns >= 1);
      await page.locator('.work-paper-hotspot-neighbor').first().click();
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '01');
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
      assert.equal(await page.locator('.work-index-item[aria-current="true"]').count(), 1,
        'Right-hand metadata did not follow the Work counter');
      for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '01', null,
        { timeout: 10000 });
      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '09');
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '05');
      const cover = page.locator('.work-card img').nth(4);
      const coverInfo = await cover.evaluate(async img => {
        await img.decode();
        return {src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight};
      });
      assert(coverInfo.src.includes('/neon-hound/cover-white.webp'), 'NEON HOUND cover is not the updated artwork');
      assert(Math.abs(coverInfo.height / coverInfo.width - .775) < .002,
        'NEON HOUND cover does not match the desktop card ratio');
      await page.locator('.work-paper-hotspot').hover();
      await page.waitForFunction(() => document.querySelector('.work-paper-cursor')?.classList.contains('show'));
      await page.locator('.work-paper-hotspot').click();
      await page.locator('#work-detail').waitFor({ state: 'visible' });
      await page.locator('#work-detail .reference-gallery').waitFor({ state: 'visible' });
      const images = page.locator('#work-detail .reference-gallery img');
      assert.equal(await images.count(), 16, 'NEON HOUND should show all 16 images');
      assert.deepEqual(await images.evaluateAll(els => els.map(el => new URL(el.src).pathname.split('/').pop())),
        Array.from({length:16}, (_, i) => `${String(i + 1).padStart(2, '0')}.webp`),
        'NEON HOUND images are out of order');
      assert.equal(await page.locator('#work-detail .reference-rail button').count() > 0, true, 'Project gallery navigation missing');
      await page.waitForFunction(() => document.querySelector('#work-detail')?.classList.contains('reference-ready'));
      await images.nth(0).evaluate(img => img.decode());
      await images.nth(1).evaluate(img => img.decode());
      const galleryBox = await page.locator('#work-detail .reference-gallery').boundingBox();
      assert(Math.abs(galleryBox.width - 720) < 1, `Desktop gallery width is ${galleryBox.width}, expected 720px`);
      assert(Math.abs(galleryBox.x + galleryBox.width / 2 - viewport.width / 2) < 1, 'Desktop gallery is not centered');
      const indicator = page.locator('#work-detail .reference-rail-indicator');
      await page.waitForFunction(() => document.querySelector('.reference-rail-indicator')?.dataset.progress !== undefined);
      await page.locator('#work-detail').evaluate(el => el.scrollTo({top: 350, behavior: 'instant'}));
      await page.waitForFunction(() => {
        const p = Number(document.querySelector('.reference-rail-indicator')?.dataset.progress);
        return p > .05 && p < .95;
      });
      assert(await indicator.isVisible(), 'Continuous thumbnail indicator is hidden');
      const frame = images.nth(0).locator('..');
      const frameBefore = await frame.boundingBox();
      assert.equal(await frame.evaluate(el => getComputedStyle(el).overflow), 'hidden', 'Artwork frame must clip the zoom');
      await images.nth(0).hover({position:{x:420,y:380}});
      await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('#reference-media-0')).transform).a > 1.01);
      const frameAfter = await frame.boundingBox();
      assert(Math.abs(frameBefore.width - frameAfter.width) < 0.1 && Math.abs(frameBefore.height - frameAfter.height) < 0.1, 'Artwork frame changed size on hover');
      await page.keyboard.press('Escape');
      assert(await page.locator('#work-detail').isHidden(), 'Project detail did not close');

      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '04');
      for (const project of ['xiaolu-tennis', 'kunlun', 'smart-city-vision', 'isle', 'young-reading', 'pop-visual']) {
        const coverPath = `assets/work/${project}/${project === 'young-reading' ? 'revised/' : ''}cover.webp`;
        const cover = await page.locator(`.work-card img[src="${coverPath}"]`).evaluate(async img => {
          await img.decode();
          return [img.naturalWidth, img.naturalHeight];
        });
        assert.deepEqual(cover, [1420, 1000], `Unexpected cover dimensions for ${project}`);
      }
      await page.locator('.work-paper-hotspot').click();
      await page.locator('#work-detail').waitFor({ state: 'visible' });
      const cityImages = page.locator('#work-detail .reference-gallery img');
      assert.deepEqual(await cityImages.evaluateAll(els => els.map(el => new URL(el.src).pathname.split('/').pop())),
        ['intro.webp', ...Array.from({length:11}, (_, i) => `${String(i + 1).padStart(2, '0')}.webp`)],
        'Smart City Vision images are out of order');
      await cityImages.first().evaluate(img => img.decode());
      await page.keyboard.press('Escape');
      assert(await page.locator('#work-detail').isHidden(), 'Smart City Vision detail did not close');
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('work:quick-switch', {detail:{index:8}})));
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '09');
      await page.locator('.work-paper-hotspot').click();
      const popImages = page.locator('#work-detail .reference-gallery img');
      assert.deepEqual(await popImages.evaluateAll(els => els.map(el => new URL(el.src).pathname.split('/').pop())),
        Array.from({length:9}, (_, i) => `${String(i + 1).padStart(2, '0')}.webp`), 'Pop visual images are out of order');
      await popImages.evaluateAll(els => Promise.all(els.map(img => img.decode())));
      await page.keyboard.press('Escape');
    }
    if (viewport.width === 1280) {
      await page.mouse.wheel(0, 520);
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
      await page.waitForFunction(() => window.__portfolioWorkSfxState().turns >= 1);
    }
    console.log(`Desktop ${viewport.width}x${viewport.height}: ${state.engine}, upper ${state.topVisible.toFixed(2)}, lower ${state.bottomVisible.toFixed(2)} OK`);
    await page.close();
  }

  const fallback = await open({ width: 1280, height: 720 }, true);
  await ready(fallback, 'Canvas2D Mesh');
  await fallback.locator('.work-paper-hotspot-neighbor').nth(1).click();
  await fallback.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
  await fallback.close();
  console.log('No-WebGL paper mesh fallback OK');

  for (const viewport of [{ width: 850, height: 720 }, { width: 390, height: 844 }]) {
    const phone = await open(viewport);
    assert.equal(await phone.locator('.work-card').count(), 9);
    assert(await phone.locator('.work-card').first().isVisible(), `${viewport.width}px card is hidden`);
    if (viewport.width <= 760) {
      assert(await phone.locator('.work-mobile-caption').first().isVisible(), 'Phone caption missing');
      const point = await phone.evaluate(() => {
        const button = document.querySelectorAll('.work-card button')[1], r = button.getBoundingClientRect();
        for (const yPart of [.4, .5, .3, .6, .7]) {
          const y = r.top + r.height * yPart;
          if (y < 10 || y >= innerHeight - 10) continue;
          for (const xPart of [.4, .5, .3, .6, .7]) {
            const x = r.left + r.width * xPart;
            if (x < 10 || x >= innerWidth - 10) continue;
            if (button.contains(document.elementFromPoint(x, y))) return { x, y };
          }
        }
        return null;
      });
      assert(point, 'Adjacent phone photo has no tappable exposed area');
      await phone.touchscreen.tap(point.x, point.y);
      await phone.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
      assert(await phone.locator('#work-focus').isHidden(), 'Phone photo tap opened preview instead of switching');
    }
    assert.equal(await phone.locator('.work-paper-stage').evaluate(el => getComputedStyle(el).display),
      'none', 'Desktop paper stage leaked onto mobile');
    await phone.close();
    console.log(`${viewport.width}px mobile Work fallback OK`);
  }
  assert.deepEqual(errors, [], 'Browser script errors occurred');
} finally {
  await browser.close();
}

