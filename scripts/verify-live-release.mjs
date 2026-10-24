import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const site = process.env.LIVE_TEST_URL || 'https://zhongxin6882.github.io/Portfolio-2/';
const release = process.env.GITHUB_SHA || String(Date.now());
const built = readFileSync('dist/index.html', 'utf8');
const bundlePath = built.match(/src="(\/Portfolio-2\/assets\/work-[^"]+\.js)"/)?.[1];
assert(bundlePath, 'Built homepage has no Work JS bundle');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function get(path) {
  const url = new URL(path, site);
  url.searchParams.set('release', release);
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  assert(response.ok, `${url.pathname} returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

let lastError;
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const homepage = (await get('index.html')).toString('utf8');
    assert(homepage.includes(bundlePath), 'Live homepage still points to an older Work bundle');
    assert(homepage.includes('sizes="128x128"'), 'Live homepage still declares the wrong PNG icon size');
    const work = (await get(bundlePath)).toString('utf8');
    assert(work.includes('work-paper-ready') && work.includes('Canvas2D Mesh'),
      'Live Work bundle does not include Demo 21 and its fallback');
    for (const icon of ['favicon.ico', 'favicon.png']) {
      assert.equal(digest(await get(icon)), digest(readFileSync(`dist/${icon}`)),
        `Live ${icon} differs from the built release`);
    }
    for (const route of ['about/', 'playground.html', 'contact.html', 'fromanother.html']) {
      const html = (await get(route)).toString('utf8');
      assert(html.includes('sizes="128x128"'), `${route} still declares the wrong PNG icon size`);
    }
    console.log(`Live Pages confirmed: new Work bundle, five routes, ICO and PNG (attempt ${attempt})`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
throw new Error(`Pages did not serve this release after 2 minutes: ${lastError?.message}`);
