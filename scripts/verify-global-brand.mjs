import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const read = name => readFileSync(resolve(process.cwd(), name), 'utf8');
const routes = ['index.html', 'about/index.html', 'playground.html', 'contact.html'];
const template = read('brand-template.html').trim();
const placeholder = '<a class="brand" data-global-brand></a>';
const faces = ['front', 'right', 'back', 'left'];
const assets = ['copyright.svg', 'brand-person-normal.svg', 'brand-person-hover.svg'];
const brandCss = read('brand.css');
assert(!read('contact-redesign.css').includes('.contact-redesign .chrome .brand'),
  'Do not override the global brand from Contact CSS');
for (const face of faces) {
  assert(template.includes('brand-face-' + face), 'Missing template face ' + face);
  assert(brandCss.includes('.chrome .brand-face-' + face), 'Missing CSS face ' + face);
}
for (const asset of assets) {
  assert(template.includes('{{ROOT}}' + asset), 'Missing asset in brand template: ' + asset);
  assert(existsSync(resolve(asset)), 'SVG missing: ' + asset);
}
for (const page of routes) {
  const source = read(page);
  const dist = read('dist/' + page);
  const prefix = page.startsWith('about/') ? '../' : '';
  const markup = template.replaceAll('{{ROOT}}', prefix);
  assert.equal(source.split(placeholder).length - 1, 1, page + ': missing/duplicate placeholder');
  assert(!source.includes('brand-face-front'), page + ': hard-coded logo returned');
  assert(!dist.includes(placeholder), page + ': unexpanded placeholder');
  assert(dist.includes(markup), page + ': generated logo differs from global source');
  const styles = [...dist.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(x => x[0]);
  assert(styles.at(-1)?.includes('href="' + prefix + 'brand.css?'),
    page + ': shared brand.css must load last');
  assert(dist.includes('src="' + prefix + 'brand-motion.js"'), page + ': missing GSAP flip script');
  assert(dist.includes('src="' + prefix + 'site-header.js'), page + ': missing global header');
  for (const face of faces) {
    const count = (dist.match(new RegExp('class="brand-face brand-face-' + face + '"', 'g')) || []).length;
    assert.equal(count, 1, page + ': ' + face + ' face must appear exactly once');
  }
  console.log('OK: ' + page);
}
