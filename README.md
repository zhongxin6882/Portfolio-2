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

## 版本管理（2026-10-22）

- **当前正式版本：v1.1**；`main` 用于开发和 GitHub Pages 部署，`1.1` 保留本次确认版本的源代码快照。
- **历史保留：** `1.0` 分支，以及主干的 `versions/1.0/` 历史资料。
- **离线备份：** 用户已自行下载最新版本 ZIP 压缩包，建议另存在电脑或云盘中。
- 旧 `1.2`、`1.3` 及两个过渡 `backup/` 分支不再作为正式版本保留。
- 今后发布新版本时，先核对 `main`，再创建新快照，不要覆盖 `1.1`。
