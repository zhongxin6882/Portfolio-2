import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const routes = ['index.html', 'about/index.html', 'playground.html', 'contact.html', 'fromanother.html'];
const png = readFileSync(join(root, 'favicon.png'));
const ico = readFileSync(join(root, 'favicon.ico'));
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'favicon.png is not a PNG');
const dimensions = `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
assert.equal(ico.readUInt16LE(0), 0, 'favicon.ico has an invalid header');
assert.equal(ico.readUInt16LE(2), 1, 'favicon.ico is not an icon');
assert(ico.readUInt16LE(4) >= 1, 'favicon.ico contains no images');

for (const route of routes) {
  const html = readFileSync(join(dist, route), 'utf8');
  for (const type of ['image/x-icon', 'image/png']) {
    const tag = [...html.matchAll(/<link\b[^>]*rel="icon"[^>]*>/g)]
      .map(([value]) => value).find(value => value.includes(`type="${type}"`));
    assert(tag, `${route}: ${type} icon link missing`);
    const href = tag.match(/\bhref="([^"]+)"/)?.[1];
    assert(href, `${route}: icon href missing`);
    const path = new URL(href, `https://example.test/Portfolio-2/${route}`).pathname;
    assert(path.startsWith('/Portfolio-2/'), `${route}: icon escapes Pages base`);
    assert(existsSync(join(dist, path.slice('/Portfolio-2/'.length))), `${route}: ${path} was not built`);
    if (type === 'image/png') {
      assert.equal(tag.match(/\bsizes="([^"]+)"/)?.[1], dimensions,
        `${route}: PNG icon declares wrong dimensions (actual ${dimensions})`);
    }
  }
}

for (const name of ['favicon.ico', 'favicon.png', 'work-desktop-paper21.js']) {
  assert(existsSync(join(dist, name)), `${name} not copied to dist`);
}
const workHtml = readFileSync(join(dist, 'index.html'), 'utf8');
const workBundle = workHtml.match(/src="(\/Portfolio-2\/assets\/work-[^"]+\.js)"/)?.[1];
assert(workBundle, 'Work JS bundle missing from built homepage');
const bundle = readFileSync(join(dist, workBundle.slice('/Portfolio-2/'.length)), 'utf8');
for (const marker of ['work-paper-ready', 'Canvas2D Mesh', 'UNPACK_FLIP_Y_WEBGL']) {
  assert(bundle.includes(marker), `Demo 21 renderer missing from built Work bundle: ${marker}`);
}
assert.equal(readdirSync(join(dist, 'assets/work')).filter(name => /^\d{2}\.(?:jpe?g|png|webp)$/i.test(name)).length,
  19, 'Expected 19 built Work cover photos');
console.log(`Work release assets: five icon routes, ${dimensions} PNG, valid ICO, Demo 21 bundle, 19 covers OK`);
