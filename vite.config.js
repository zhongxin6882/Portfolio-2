import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();

// Legacy page scripts are classic scripts. Keep their URLs while GSAP moves to a Vite module.
function copyClassicAssets() {
  return {
    name: 'copy-classic-assets',
    closeBundle() {
      const output = resolve(root, 'dist');
      mkdirSync(output, { recursive: true });
      for (const name of readdirSync(root)) {
        if (/^(?:vite\.config|playground)\.js$/.test(name)) continue;
        if (/\.(?:css|js|svg|png|webp|jpg|jpeg|gif|ico)$/i.test(name)) {
          copyFileSync(resolve(root, name), resolve(output, name));
        }
      }
      if (existsSync(resolve(root, 'assets'))) {
        cpSync(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });
      }
      // Keep the same stylesheet cascade as the source HTML. Vite's generated
      // links can reorder independent CSS files across multiple entry pages.
      for (const page of ['index.html', 'about/index.html', 'playground.html', 'contact.html', 'fromanother.html']) {
        const source = readFileSync(resolve(root, page), 'utf8');
        const originalStyles = [...source.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]
          .map(([tag]) => tag)
          .filter(tag => /href="(?:\.\.\/)?[^/:]+\.css(?:\?[^"]*)?"/.test(tag))
          .map(tag => tag.replace(/href="((?:\.\.\/)?[^/:]+\.css)(?:\?[^"]*)?"/, (_, path) => {
            const file = resolve(dirname(resolve(root, page)), path);
            const version = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 12);
            return 'href="' + path + '?v=' + version + '"';
          }));
        if (!originalStyles.length) continue;
        const destination = resolve(output, page);
        let built = readFileSync(destination, 'utf8');
        let inserted = false;
        const generatedStyleLink = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="\/Portfolio-2\/assets\/[^"]+\.css")[^>]*>/g;
        built = built.replace(generatedStyleLink, () => {
          if (inserted) return '';
          inserted = true;
          return originalStyles.join('');
        });
        if (!inserted) {
          const sourceStyleLink = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="(?:\/Portfolio-2\/)?(?:\.\.\/)?[^/:]+\.css(?:\?[^"]*)?")[^>]*>/g;
          const existingSourceStyles = built.match(sourceStyleLink) || [];
          if (existingSourceStyles.length) {
            let replaced = false;
            built = built.replace(sourceStyleLink, () => {
              if (replaced) return '';
              replaced = true;
              return originalStyles.join('');
            });
          } else if (built.includes('</head>')) {
            built = built.replace('</head>', originalStyles.join('') + '</head>');
          } else {
            throw new Error('Cannot restore source stylesheets in ' + page);
          }
        }
        writeFileSync(destination, built);
      }
      writeFileSync(resolve(output, '.nojekyll'), '');
    }
  };
}

export default defineConfig({
  base: '/Portfolio-2/',
  plugins: [copyClassicAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        work: resolve(root, 'index.html'),
        about: resolve(root, 'about/index.html'),
        playground: resolve(root, 'playground.html'),
        contact: resolve(root, 'contact.html'),
        fromanother: resolve(root, 'fromanother.html')
      }
    }
  }
});
