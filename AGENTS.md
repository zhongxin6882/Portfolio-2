# AGENTS.md — CENTER DESIGN 工程协作规范

> **适用范围：** `zhongxin6882/Portfolio-2` 仓库内的开发者、代码生成工具及 AI 编程 Agent。  
> **优先级：** 实际源码与工作流配置 > 本文档 > 历史需求记录。发现冲突时，先核验源码，修正文档，不得沿用已废弃的部署方式。  
> **核对基准：** 2026-10-23，参考 `main`、`package.json`、`vite.config.js` 及现行 CI 工作流。

本文件记录**如何安全修改工程**，而非项目宣传介绍。对外说明见 [README.md](README.md)，版本政策见 [VERSION.md](VERSION.md)。

## 1. 开发基本原则

1. **最小变更**：只修改用户明确要求的页面或功能；无授权不得顺带调整菜单、品牌、其他页面或移动端行为。
2. **一个公共功能，一处真源**：共享版权/人物标识、菜单交互、国际化逻辑应优先修改公共来源，不允许为单一页面复制另一套实现。
3. **先验证，后提交**：对修改范围运行对应构建/测试；不要将“代码已提交”描述为“线上已部署”，更不能将 CI 通过等同于视觉验收。
4. **保留桌面与移动端边界**：桌面端滚轮、移动端触摸和导航模式不同，任何改动都要检查断点两侧。
5. **保持可复查性**：小范围、明确的差异，避免对压缩文件无意义的全量格式化，避免覆盖其他并发提交。
6. **独立原型与产品隔离**：探索性 Demo 不得未经确认直接替换主站或合并到 `main`；依照任务要求决定是否需要分支。
7. **不编造结果**：外部图片、第三方代码、授权、浏览器效果、性能与发布状态必须有实际依据。

## 2. 实际工程架构（请勿使用旧版零构建说明）

| 项目 | 当前机制 | 必须遵循 |
| --- | --- | --- |
| 仓库 | `zhongxin6882/Portfolio-2` | 先检查目标分支与当前提交 |
| 开发模式 | Vite 多页面（MPA） | `npm ci` → `npm run dev` |
| 生产构建 | Vite 输出 `dist/` | `npm run build` |
| 生产基路径 | `/Portfolio-2/` | 添加资源路径时检查 GitHub Pages 子路径 |
| JavaScript | 原生经典脚本 + Vite ES modules | 保留经典脚本顺序；新模块由 Vite 处理 |
| 动效库 | npm `gsap@3.15.0` | 使用 `import { gsap } from 'gsap'`，不要恢复 CDN |
| Node.js | CI 使用 22 | 本地尽量一致；改依赖同步更新 lockfile |
| 主站发布 | GitHub Actions → GitHub Pages | 仅以构建/部署工作流及网站实际状态为准 |
| 移动端测试 | PR 定向 CI + Playwright | 不应误称每次 `main` push 都执行 |

本项目不是零依赖静态 HTML 直传站点，也不是 React SPA。`dist/` 是生成目录；尽管仓库历史中可能仍跟踪旧 `dist/` 文件，**日常功能开发应修改源码而非历史产物**。

## 3. 路由和代码归属

| 路由 | 入口 | 页面专用模块 | 主要风险 |
| --- | --- | --- | --- |
| Work `/` | `index.html` | `work.js`、`work.css` | 卡片循环、浮层、计数与移动端切换 |
| About `/about/` | `about/index.html` | `about-sprites.js`、`about-sprites.css` | 图片/精灵帧与点击状态、页内旧样式 |
| Playground `/playground.html` | `playground.html` | `playground.js` 与 `style.css` | 图片墙独立滚动、数字与素材加载 |
| Contact `/contact.html` | `contact.html` | `contact-redesign.css` | 插画底部定位、社交标识与菜单样式冲突 |
| 案例 `/fromanother.html` | `fromanother.html` | `app.js` | 独立案例、远程图片、历史页头 |

主要共享文件：

- `style.css`：全局基准与历史页面样式；部分规则压缩，修改时避免无意义的整文件重排。
- `mobile-responsive.css`：手机布局、折叠菜单及各主页面响应式覆盖，当前主要断点为 `760px`；还包含更窄设备与减弱动效规则。
- `site-header.js`：导航/折叠菜单、北京时间、Web Audio 音频；旧事件监听使用捕获阶段，新增监听前必须排除冲突。
- `locale.js`：中英双语映射、语言持久化、动态文本节点监听。
- `page-transition.js`：站内页面转场，使用 `sessionStorage` 在导航前后传递状态。
- `brand-template.html` + `brand.css` + `brand-motion.js`：四个主页面的共享四面翻转标识。
- `vite.config.js`：多页面入口、全局品牌注入、经典脚本复制与 CSS 顺序/缓存哈希处理。
- `scripts/verify-global-brand.mjs`：主要页面品牌契约检查。
- `scripts/test-mobile.mjs`：移动端浏览器断点检查。
- `scripts/verify-work-release.mjs` 与 `scripts/test-work-release.mjs`：Work/图标构建契约和桌面、手机浏览器回归；相关 PR 与主线部署前运行。

**修改新页面时**：同步核对 Vite 多入口配置、所需共享资源、导航链接、语言词典与 `page-transition.js` 的路由白名单。`fromanother.html` 属于单独的历史案例页，不能假设它已使用四页共享品牌模板。

## 4. 不可破坏的公共标识契约

**范围：** Work、About、Playground、Contact。该约束是防止版权与人物翻转在某一页回退的核心机制。

### 4.1 单一结构来源

四个源 HTML 中都只保留一次：

```html
<a class="brand" data-global-brand></a>
```

构建/开发阶段由 `vite.config.js` 的 `sharedBrand()` 插件读取 `brand-template.html` 并注入四个面（front / right / back / left）。About 以 `../` 解析资源，其他三页以根目录相对路径解析。

**禁止事项：**

- 在任一页面复制完整 `brand-face-*` HTML，或恢复旧版竖排文字 LOGO；
- 为某页新增 `.chrome .brand`、`.brand-flip`、`.brand-face-*` 的页面专用覆盖；
- 在改 Contact、Playground、About 时顺便替换公用 SVG；
- 调换 `brand.css` 为页面局部 CSS 之前加载；
- 删除/替换 `brand-motion.js` 的滚动驱动而不更新其他页面。

### 4.2 结构、外观与动作的权责

| 文件 | 负责 | 不负责 |
| --- | --- | --- |
| `brand-template.html` | 统一 HTML 与 SVG 面组成 | 页面业务内容 |
| `brand.css` | 统一尺寸、透视、Hover 与响应式基本样式 | 单页排版 |
| `brand-motion.js` | GSAP Y 轴翻转与滚动事件同步 | 页面菜单、项目业务 |
| `site-header.js` | 公共菜单/时钟/音频 | 版权旋转几何 |

目前翻转会读取常规页面滚动；Work 通过 `work:position` 自定义事件同步；Playground 可监听右侧 `.play-grid` 滚动。修改任一输入逻辑时应验证另外两种场景。

### 4.3 预提交验证

```bash
npm run build
node scripts/verify-global-brand.mjs
```

CI 在部署前执行相同的全局品牌验证。如检查失败，**停止发布并修复原因**，不要删掉验证脚本或降低断言来绕过真实回归。视觉尺寸/动画曲线仍需浏览器验收，单靠文本断言不能保证像素级一致。

## 5. 页面交互的维护约束

### 5.1 Work：环形卡片堆叠

`work.js` 定义 19 项项目数据，每项包含名称、类型、日期、描述、职责、奖项、图片源等字段。衍生对象使用本地 `assets/work/NN.ext` 与远程 `framerusercontent.com` 兜底。

- 项目数据顺序与本地 `NN.ext` 图片编号有耦合；调整 `projects` 顺序时必须同时核对资源对应关系。
- 项目数组后存在基于硬编码下标的 `splice()` 重排；增删项目时需重新核对下标。
- `index.html` 内计数分母 `/19` 为硬编码；需要和项目数量同步。
- 大于 `850px` 的桌面端与不大于 `760px` 的手机端使用 `position` / `targetPosition` 驱动环形循环；`distance()` 映射到卡片偏移、旋转、缩放、透明度和层级。
- 动画使用 `requestAnimationFrame`，当前包含渐近缓动和停止输入后的整数吸附；调整手感时也要测试触控板密集事件、反向滚动和首尾循环。
- `761–850px` 的中间断点使用原生滚动配合 `updateMobile()`；`<=760px` 手机端为手势驱动的循环叠卡，卡片绝对定位、容器不原生滚动。手机浏览器测试须发送滚轮/触摸手势，不能再用 `scrollIntoView()` 断言计数变化。
- `openFocus()` / `openDetail()` 的浮层出现时会锁住背景交互；关闭、Esc、切换项目及返回状态必须独立回归。
- `work:position` 与共享标识动画存在事件耦合，不得删除而不迁移订阅端。

### 5.2 Playground：图片墙与入场动画

- `playground.js` 通过 npm ES module 导入 GSAP，负责实验图像渲染、卡片入场与数值计数。
- 主页面只保留图片墙和指定文案；**不要恢复此前删除的橙红色页脚**以及 `EXPERIMENTS AND COUNTING` 标签。
- `playground-body` 布局下桌面端仅右侧 `.play-grid` 滚动；改动溢出/固定定位时需同时测试窄屏。
- 计数动画对首次访问使用 localStorage 标记；减少动画偏好下要有合理静态状态。
- 图片源存在第三方依赖，不能将加载成功当作本地资源已经齐全。

### 5.3 About：插画和动画素材

- 首屏/简历布局由 `about/index.html` 定义；交互脚本与雪碧图素材分散在 `about-sprites.*`、`assets/about/` 等位置。
- 当前 `about-sprites.js` 使用 48 帧（8 列）循环逻辑；素材帧布局或尺寸变化时必须同步检查帧数、列数、宽高与 CSS。
- Hover 与点击应保持原有元素的位置、比例和交互区域；如仅请求文案修改，不得重新生成/替换插画。
- 切换移动端布局时确认元素没有裁切、重叠或脱离可点击区域。

### 5.4 Contact：页面排版与品牌隔离

- 页面布局、标题间距、插画、社交图标在 `contact-redesign.css` 与 `contact.html` 中维护。
- 更改底部社交元素或人物位置，**不得顺带修改 `site-header.js`、品牌模板、导航项或其他页面 CSS**。
- Contact 曾因复制公共版权样式而产生外观差异；严格维持 `brand.css` 为公共标识样式的最终来源。

### 5.5 公共菜单与响应式

- `site-header.js` 在手机断点通过 `mobile-menu-open` 实现菜单开关，保持 `aria-expanded`、`aria-controls` 和打开/关闭标签同步。
- 移动端菜单包含导航、音频、语言与联系方式。菜单默认闭合；桌面导航不能因移动端变更而隐藏。
- 对 `760px`、`850px` 两套历史断点存在交叉的功能要重点测试，例如 `760–850px` 区间。
- 在 320 / 375 / 390 / 430px 等典型手机宽度下检查横向溢出、叠层和关闭状态。

## 6. 国际化与文案修改规范

`locale.js` 为文本节点翻译机制，并非完整的属性级 i18n 框架。应优先沿用当前的词典设计，不擅自改变语义或持久化键：

1. `zh` 将英文源文本映射为中文；`en` 基于该映射反转并带有中文源文本的显式覆盖。
2. 文本替换按独立文本节点匹配，空白会规范化；标点、箭头、特殊空格等字符要精确对齐。
3. 使用 `<br>` 分开的职责或奖项是**多个文本节点**，需要逐项添加词条。
4. 新词条应在英文反向字典生成之前添加；源文为中文时应写入对应的 `en` 覆盖块，而非错误地反向放进 `zh`。
5. 新增 `data-default-language` / `data-language-key` 时要验证本地持久化状态；当前五个入口页面都标记默认语言为中文，但实际仍可能被用户存储的选择覆盖。
6. `alt`、`aria-label`、`title`、`placeholder` 等属性不会因文本节点翻译自动更新；若需双语无障碍文本，单独实现并验证。

更改文案后至少切换中文、英文各一次，并测试页面转场后是否恢复预期状态。

## 7. 构建、CSS 与资源管理

- **Vite 多页面入口**：`index.html`、`about/index.html`、`playground.html`、`contact.html`、`fromanother.html`。
- **经典脚本**：历史脚本按原页面声明的顺序加载，`vite.config.js` 的 `copyClassicAssets()` 会把根目录相应静态资源与 `assets/` 复制到 `dist/`。新建脚本必须确认是否被插件复制；`playground.js` 等 ES modules 走 Vite。
- **样式顺序**：构建阶段恢复源 HTML 的样式顺序，并为本地 CSS 链接加入基于文件内容的 12 位哈希 `?v=...`。不要以源 HTML 中的旧字符串判断线上缓存版本。
- **样式边界**：`style.css` 为通用基准；`work.css`、`contact-redesign.css`、`mobile-responsive.css` 分别负责相应范围。公共版权样式始终在 `brand.css` 维护。
- **压缩文件**：已有 HTML/CSS 可能将多个规则写在单行。优先局部精准替换，避免不必要的整文件格式化和噪声差异。
- **素材**：新增图片时控制压缩、尺寸、格式及路径；检查 lazy/eager 加载与替代文本，不因试验资源覆盖原有作品素材。
- **外部资源**：远程图片不等于已获得转载/商用授权；对授权状态不明的资源，注明依赖与待确认状态。
- **版本控制**：不直接编辑 `versions/1.0/` 历史快照或 `dist/` 作为业务源文件；遵守 `.gitignore`，勿提交 `node_modules/`。

## 8. 测试和验收矩阵

| 修改范围 | 最低自动验证 | 必要人工检查 |
| --- | --- | --- |
| 文案/翻译 | `npm run build` | 中英双向切换及布局折行 |
| 全局版权 | 构建 + `verify-global-brand.mjs` | 四个页面滚动、Hover、手机尺寸 |
| Work | 构建 + Work/图标资源检查 + Playwright 桌面/手机回归 | 桌面滚轮/触控板的真实手感、层叠视觉、预览/详情及手机循环手势、中间断点原生滚动 |
| Playground | 构建 +现有 Playground CI 断言 | 图片流仅右侧滚动、计数及不出现已删页脚 |
| About | 构建 | 点击、Hover、雪碧图、触摸与元素裁切 |
| Contact | 构建 | 社交图标清晰度、标题间距、插画贴底、菜单不变 |
| 响应式/页头 | 构建 + 适用的 Playwright 手机测试 | 小屏菜单、断点切换、无横向溢出 |
| 发布/构建配置 | 构建 + 相关 CI | 与目标 SHA 对应的部署结果及在线路由 |

建议本地执行：

```bash
npm ci
npm run build
node scripts/verify-global-brand.mjs
node scripts/verify-work-release.mjs
node --check site-header.js
node --check work.js
node --check locale.js
```

`scripts/test-mobile.mjs` 依赖 Playwright 和正在服务的构建站点：仓库已有 `.github/workflows/mobile-ci.yml` 指明安装和执行方式。此浏览器检查目前通过**指定文件发生变化的 PR** 触发；`main` 的 Pages 发布流程不等同于全套移动端截图回归。`scripts/test-work-release.mjs` 同样需要 Playwright/预览服务器，但会在相关 PR 和每次主线部署前运行。

### 视觉验收最低要求

- 桌面与手机的首屏都无错位、遮挡或空白异常。
- 页面打开、滚动、切换、返回与关闭操作无明显卡顿或无法退出。
- 四页标识尺寸与翻转效果一致；公共菜单和中英文切换正常。
- 控制台无新增未处理错误；图片失败时有合理降级。
- 浏览器访问的是新部署版本，不是历史 `dist` 或缓存内容。

## 9. 任务实施与提交规范

### 9.1 先检查

1. 确认目标 `main` / 功能分支及最新 SHA，避免在旧提交基础上覆盖并发修改。
2. 阅读用户明确的“不要改动”范围、现有页面、公共依赖与 CI。
3. 列出拟修改文件与风险；如任务只是独立 Demo，不触碰生产文件或自动部署。
4. 涉及现有图片/动画时先对照原素材、尺寸及行为，不以近似替换原图。

### 9.2 修改与自测

1. 最小化文件变更，避免无关的格式化、命名和内容重排。
2. 保留键盘/触摸、减弱动效、无障碍状态及错误降级路径。
3. 运行相应构建/校验；对未覆盖的视觉问题明确记录，而不是声称“完全 1:1”。
4. 复查变更对共享组件、移动端和其他页面的影响。
5. 提交信息建议采用 `docs:`、`fix(work):`、`feat(playground):`、`test:` 等可检索格式。

### 9.3 发布与反馈

1. 确认提交成功、目标分支 HEAD 指向预期 SHA。
2. 需要上线时核对 GitHub Actions 对应运行的 **conclusion = success**，并测试线上路由。
3. 说明已验证的范围与未验证项；不把构建成功解释为已经完成浏览器视觉验收。
4. 改动公共模块、项目结构、版本管理或工作流时，同步更新 README / AGENTS / VERSION 中受影响的内容。

## 10. 当前风险与技术债（维护清单）

下列项目来自当前实现或既有仓库记录，是**需继续核对/改进的事项**，不应写成已经修复的事实。

| 优先级 | 项目 | 说明 |
| --- | --- | --- |
| 高 | 四页共享标识的浏览器视觉回归 | 当前已有构建结构检查，但它不能判断肉眼可见的透视与尺寸差异 |
| 高 | 桌面与移动端断点交叉 | Work 交互约 `850px` 分界，手机导航/样式约 `760px` 分界 |
| 高 | 远程作品/实验素材依赖 | 需要确认版权授权与网络可用性；长期建议建立来源清单 |
| 中 | 计数和作品顺序硬编码 | `/19` 分母、本地图片序号、`splice` 下标易在添加作品时产生错配 |
| 中 | 旧案例页品牌实现 | `fromanother.html` 当前仍有历史页头结构，不应误称五页都共用品牌模板 |
| 中 | 国际化中的历史注释或遗留映射 | `locale.js` 内部分注释与当前默认语言/页面结构可能不同，应以实际逻辑核对 |
| 中 | 构建目录历史跟踪文件 | `dist/` 曾被跟踪；生产构建会清空再生成，避免误操作或错误引用 |
| 中 | 开场动画时长与体验一致性 | 历史页面时长和行为并不完全相同，改动时应先定义统一体验 |

## 11. 发布前核对清单

- [ ] 改动范围仅包含本任务所需文件，未改变不相关页面。
- [ ] 不存在新建的页面专属版权/人物标识或无意重复 CSS。
- [ ] 保留 Work 的滚动与浮层、Playground 右侧独立滚动、Contact 当前菜单。
- [ ] 手机 320/375/390/430px 和常见桌面尺寸没有新问题。
- [ ] 中英文、音频、路由、可访问性与 reduced-motion 未回归。
- [ ] `npm run build` 成功，`node scripts/verify-global-brand.mjs` 成功。
- [ ] 需要浏览器测试时运行相应移动端 CI/本地 Playwright 检查。
- [ ] 不提交 `node_modules/`，不把 `dist/` 当作业务真源。
- [ ] Git 提交、分支、CI 运行和部署 SHA 一致。
- [ ] 如更改版本快照/分支策略，同步更新 [VERSION.md](VERSION.md)。
- [ ] 报告中明确区分“已编码、已测试、已发布、视觉已验收”。

---

**维护原则：** 本文件是工程约束，而不是永久正确的实现描述。每次架构或发布机制发生变化时，应先核对代码，再以一个明确版本更新相关章节；不要在顶部追加一条新规则来覆盖下面一整篇相互矛盾的旧说明。
