# 九月十五作品集

四个主页面和案例页由 Vite 构建。Playground 的动画使用 npm 安装的 GSAP，后续新动画也请直接从 `gsap` 包导入，不再添加 CDN 脚本。

## 本地开发

```bash
npm ci
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

Vite 输出到 `dist/`，不提交生成文件。旧的普通脚本仍保持原有执行顺序，由 `vite.config.js` 在构建后复制到输出目录；新 GSAP 代码写在 Vite 模块中。生产环境项目根路径是 `/Portfolio-2/`。

## GitHub Pages

推送到 `main` 会触发 `.github/workflows/deploy.yml`：`npm ci` → `npm run build` → 部署 `dist/`。仓库 Settings → Pages → Build and deployment → Source 应设为 **GitHub Actions**。
