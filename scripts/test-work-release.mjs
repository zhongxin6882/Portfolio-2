import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.WORK_TEST_URL || 'http://127.0.0.1:4173/Portfolio-2/';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
});
const errors = [];

async function open(viewport, noWebGL = false) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
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
  await page.waitForFunction(() => document.querySelectorAll('.work-card').length === 19);
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
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '02');
      assert.equal(await page.locator('.work-index-item[aria-current="true"]').count(), 1,
        'Right-hand metadata did not follow the Work counter');
      for (let i = 0; i < 18; i++) await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '01', null,
        { timeout: 10000 });
      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() => document.querySelector('#work-number')?.textContent === '19', null,
        { timeout: 10000 });
      await page.locator('.work-paper-hotspot').hover();
      await page.waitForFunction(() => document.querySelector('.work-paper-cursor')?.classList.contains('show'));
      await page.locator('.work-paper-hotspot').click();
      await page.locator('#work-focus').waitFor({ state: 'visible' });
    }
    console.log(`Desktop ${viewport.width}x${viewport.height}: ${state.engine}, upper ${state.topVisible.toFixed(2)}, lower ${state.bottomVisible.toFixed(2)} OK`);
    await page.close();
  }

  const fallback = await open({ width: 1280, height: 720 }, true);
  await ready(fallback, 'Canvas2D Mesh');
  await fallback.close();
  console.log('No-WebGL paper mesh fallback OK');

  for (const viewport of [{ width: 850, height: 720 }, { width: 390, height: 844 }]) {
    const phone = await open(viewport);
    assert.equal(await phone.locator('.work-card').count(), 19);
    assert(await phone.locator('.work-card').first().isVisible(), `${viewport.width}px card is hidden`);
    if (viewport.width <= 760) {
      assert(await phone.locator('.work-mobile-caption').first().isVisible(), 'Phone caption missing');
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
