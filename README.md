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

## 当前版本与备份

- **当前正式版本：v1.1**，源代码以 `main` 为准，`1.1` 分支固定为发布快照。
- **完整代码备份：** [backup/center-v1.1-20261022](https://github.com/zhongxin6882/Portfolio-2/tree/backup/center-v1.1-20261022)，独立于 `main` 的 Git 分支快照，包含代码与仓库内素材。
- **整理前安全备份：** [backup/preclean-20261022-3259338](https://github.com/zhongxin6882/Portfolio-2/tree/backup/preclean-20261022-3259338)，保留整理之前的原样快照。
- **恢复方式：** 以备份分支的提交创建恢复分支，再经审核合并或部署；不要强制覆盖正在开发的分支。
- `versions/1.0/` 和 `1.0` 分支属于历史 1.0，暂不清理。旧的 1.3 工作目录已从当前主干移除。
- GitHub 备份分支都在**同一仓库内**；它们能防止日常代码覆盖，但不能替代独立仓库或离线备份。
