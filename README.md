# CENTER DESIGN — Portfolio

> 一个围绕 **交互设计、视觉叙事与作品展示** 构建的多页面个人作品集。  
> 项目采用 Vite 管理多页面构建，以原生 HTML、CSS、JavaScript 为基础，并使用 GSAP 完成部分动效。

[线上预览](https://zhongxin6882.github.io/Portfolio-2/) · [代码仓库](https://github.com/zhongxin6882/Portfolio-2) · [开发规范](AGENTS.md) · [版本记录](VERSION.md)

## 目录

- [项目概览](#项目概览)
- [页面与交互](#页面与交互)
- [技术架构](#技术架构)
- [本地开发](#本地开发)
- [质量检查](#质量检查)
- [部署流程](#部署流程)
- [版本与分支](#版本与分支)
- [协作及素材说明](#协作及素材说明)

## 项目概览

本项目展示精选设计案例、个人经历、交互实验和联系方式。它不是基于 React 的单页应用；页面由 Vite 以 **Multi-Page Application（MPA）** 形式构建，部分历史脚本仍以普通 `<script>` 加载，新动画模块通过 Vite 打包。

**设计原则**

1. **内容优先**：以作品图像、项目信息与个人介绍为主，动画服务于阅读与导航。
2. **交互一致**：公共导航、版权/人物翻转标识、语言与声音入口在主要页面保持一致。
3. **渐进增强**：桌面端提供丰富的滚动效果，移动端采用更适合触摸操作的布局。
4. **可维护与可回退**：共享组件尽量单一来源；发布前构建验证，稳定版本以 Git 分支保存。

## 页面与交互

| 页面 | 路径 | 主要功能 |
| --- | --- | --- |
| Work | `/` / `index.html` | 19 个精选项目；桌面端环形卡片堆叠、滚动吸附、左右信息同步，支持项目预览与详情 |
| About | `/about/` | 个人介绍、经历及交互插画；元素动画由页面脚本与雪碧图驱动 |
| Playground | `/playground.html` | 24 张实验作品图片墙、GSAP 入场与计数动画；桌面端图片流独立滚动 |
| Contact | `/contact.html` | 插画、社交标识与联系方式展示 |
| Fromanother | `/fromanother.html` | 单项目案例展示，包含图片流与视差交互；不属于主导航一级入口 |

**全局交互**

- 顶部导航：桌面端目录与当前页状态；小屏设备切换为折叠菜单。
- 公共标识：版权 SVG 与人物 SVG 构成四面翻转标识。Work、About、Playground、Contact 共用一份 HTML 模板。
- 多语言：`locale.js` 实现中文/英文运行时文本替换；各页源文本可能不同，新增文案应按实际源文维护映射。
- 音频：`site-header.js` 使用 Web Audio API 合成声音；并非仅有视觉开关。
- 动效可访问性：部分动画根据 `prefers-reduced-motion` 降级或停用。

> 功能和动画可能随 `main` 分支迭代。若要了解固定版本，应查看 [VERSION.md](VERSION.md) 指定的版本分支。

## 技术架构

| 类别 | 实际使用 |
| --- | --- |
| 页面层 | HTML5、CSS3、原生 JavaScript |
| 构建工具 | Vite `8.3.5`（以 `package.json` 为准） |
| 动画库 | GSAP `3.15.0`，通过 npm 安装并以 ES module 使用 |
| 资源形式 | 本地 SVG / PNG / WebP / JPG；个别案例或实验图片依赖远程 `framerusercontent.com` |
| 国际化 | 自定义 `locale.js` 文本节点翻译 |
| 部署 | GitHub Pages + GitHub Actions |
| Node.js | CI 使用 Node.js 22；本地建议与 CI 保持一致 |

项目主要文件：

```text
Portfolio-2/
├── index.html                 # Work
├── about/index.html           # About
├── playground.html            # Playground
├── contact.html               # Contact
├── fromanother.html           # 独立案例
├── style.css                  # 基础/通用样式
├── work.css / work.js         # Work 页面
├── mobile-responsive.css      # 移动端响应式适配
├── contact-redesign.css       # Contact 专用样式
├── brand-template.html        # 四大页面共用的版权/人物标识结构
├── brand.css / brand-motion.js # 公共标识样式与翻转动画
├── site-header.js             # 菜单、时钟、音频
├── page-transition.js        # 页面转场
├── locale.js                  # 中英文替换
├── playground.js              # Playground 渲染与动画
├── assets/                    # 插画、项目与社交资源
├── scripts/                   # 构建回归检查与素材脚本
├── vite.config.js             # 五入口构建与资源复制
├── .github/workflows/         # 发布与移动端检查流程
├── AGENTS.md                  # 开发约束与实施指南
└── VERSION.md                 # 版本定义与发布约定
```

注：仓库历史中可能存在已被 Git 跟踪的 `dist/` 文件，但当前发布流程**以新构建生成的 `dist/` 为准**，不要把历史产物当作源代码维护。

## 本地开发

**前置条件：** Git、Node.js 22（推荐）及 npm。

```bash
git clone https://github.com/zhongxin6882/Portfolio-2.git
cd Portfolio-2
npm ci
npm run dev
```

使用终端输出的本地地址访问站点。不要以直接双击源文件 `index.html` 的方式代替 Vite 开发服务器，避免 ES module 与资源路径行为不一致。

构建与本地预览：

```bash
npm run build
npm run preview
```

生产环境使用 Vite 基础路径 `/Portfolio-2/`；`dist/` 是构建输出目录，默认被 `.gitignore` 忽略。

### 修改页面时应从哪里入手？

| 需求 | 优先修改 |
| --- | --- |
| Work 卡片滚动与项目数据 | `work.js`、`work.css` |
| About 交互与雪碧图 | `about/index.html`、`about-sprites.js`、`about-sprites.css` |
| Playground 卡片墙 | `playground.js`、相关 `style.css` 规则 |
| Contact 图文排版 | `contact.html`、`contact-redesign.css` |
| 手机端响应式 | `mobile-responsive.css`、必要时 `site-header.js` |
| 导航与音频 | `site-header.js`；保留四页结构契约 |
| 中英文文案 | `locale.js` + 对应页面的源文本 |
| 公共版权/人物翻转 | `brand-template.html`、`brand.css`、`brand-motion.js` |

**禁止为单个页面复制一套新的版权标识。** Work、About、Playground、Contact 在源 HTML 中使用 `<a class="brand" data-global-brand></a>` 占位符，由 Vite 在构建阶段注入共享模板。更多约束见 [AGENTS.md](AGENTS.md)。

## 质量检查

至少执行：

```bash
npm run build
node scripts/verify-global-brand.mjs
```

第二条在成功构建后运行，检查四个主要页面的标识结构、资源引用、公共样式位置及动画入口。

仓库还包含移动端浏览器测试 `scripts/test-mobile.mjs`，并由 `.github/workflows/mobile-ci.yml` 在**匹配指定路径的 PR** 上运行。该流程安装 Playwright/Chromium，检查多个手机宽度；它并非每次推送 `main` 都自动执行。需要在本地复现时，请先阅读相应 workflow 中的依赖安装、预览服务器与测试命令。

建议发布前人工抽查：电脑端卡片滚动、手机菜单、四页版权翻转、中英切换、浮层关闭、页面路由及浏览器控制台错误。**CI 通过不等于完成全部视觉验收**。

## 部署流程

本仓库的 GitHub Pages 发布来源为 **GitHub Actions**，而不是仓库根目录：

1. 更新 `main` 触发 `.github/workflows/deploy.yml`。
2. Actions 执行 `npm ci` 和 `npm run build`。
3. 检查 Playground 构建约束及四页共享标识。
4. 成功后上传 `dist/`，调用 `actions/deploy-pages` 发布到 GitHub Pages。

发布失败时不会因为提交存在就代表线上已更新。应在 [Actions 页面](https://github.com/zhongxin6882/Portfolio-2/actions) 核实与目标提交 SHA 对应的工作流状态，并打开实际网站验证。

源码中的传统脚本由 `vite.config.js` 的复制逻辑带入输出；新模块交由 Vite 处理。样式缓存查询参数在构建时按文件内容生成短哈希，修改样式后以**构建产物**为准排查缓存问题。

## 版本与分支

- `main`：持续开发与线上部署主线，**不等于冻结的 v1.1 快照**。
- `1.1`：保留的正式版本基准。
- `1.0`：历史版本备份。
- 其他 `feature/`、`codex/` 等分支：可能用于专项开发或合并工作，不自动构成正式发布版本。

`package.json` 中的 `version: 1.1.0` 是包元数据；应与实际 Git 版本快照及线上提交区分。完整约定见 [VERSION.md](VERSION.md)。

## 协作及素材说明

- **协作规范：** 涉及结构、动画、样式、语言及构建配置的变更，请先阅读 [AGENTS.md](AGENTS.md)，控制范围并说明验证结果。
- **资源与版权：** 本仓库包含本地图片、SVG 和部分第三方远程图片引用；代码公开不代表所有作品图片、品牌标识或第三方素材可自由商用或再分发。引用前需核验授权与来源。
- **依赖稳定性：** 部分图像使用远程资源链接，可能受外部服务可用性、资源变更及跨域策略影响。
- **访问问题：** GitHub Pages 部署成功但页面显示旧内容时，先检查最新 Actions 结果、构建输出与浏览器缓存，再进行有针对性的修复。

---

**文档维护基准：2026-10-23。** 项目以 GitHub 当前代码和工作流配置为准；若实现变化，应同步更新本文件、[AGENTS.md](AGENTS.md) 与 [VERSION.md](VERSION.md) 中对应的说明。
