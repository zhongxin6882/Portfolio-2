import { defineConfig } from 'vite';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
        if (/\.(?:js|svg|png|webp|jpg|jpeg|gif|ico)$/i.test(name)) {
          copyFileSync(resolve(root, name), resolve(output, name));
        }
      }
      if (existsSync(resolve(root, 'assets'))) {
        cpSync(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });
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
