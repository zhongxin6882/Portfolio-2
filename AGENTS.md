# AGENTS.md — 九月十五 JIUYUESHIWU 作品集站点

## 2026-10-21 构建迁移（优先于下文旧的静态部署说明）

- 源码在仓库根目录；`npm ci`、`npm run dev`、`npm run build`，Vite 输出 `dist/`。
- GitHub Pages 发布源改为 **GitHub Actions**，`.github/workflows/deploy.yml` 在每次推送 `main` 后构建并部署 `dist/`；仓库里的旧 `dist/` 是历史文件，生成目录由 Vite 清空重建。
- 新动画统一从 npm 包 `gsap` 以 ES module 导入，交给 Vite 打包，不能再用 CDN。Playground 的 `playground.js` 是示例；更新依赖时同步提交 `package-lock.json`。
- 旧版经典脚本仍按页面原顺序加载；构建插件将根目录经典 JS 与本地素材复制到产物。新增经典脚本时检查构建产物；新增模块交由 Vite 处理。
- Vite 设置 `base: '/Portfolio-2/'`、五个 HTML 输入（WORK、ABOUT、PLAYGROUND、CONTACT、FROMANOTHER）。验证构建、Pages 工作流成功和线上路由后才声明已发布。
- 下文第 2 节关于“直接从 main 根目录发布”、第 3 节关于 `dist/` 不参与发布，以及第 5 节关于 GSAP CDN 的文字是迁移前说明。


> 本文件面向接手开发的 AI agent 与人类协作者。开始任何改动前先读完本文件。
> 最后核对时间：2026-10-20，对应提交见 `git log`。

## 1. 项目概况

一个纯静态、零构建、零依赖的多页作品集站点（无打包器、无框架、无 npm 安装步骤）。
所有页面都是原生 HTML + CSS + Vanilla JS，直接由 GitHub Pages 托管。

- **线上地址**：https://zhongxin6882.github.io/Portfolio-2/
- **仓库**：`zhongxin6882/Portfolio-2`
- **默认语言**：中英双语，由 `locale.js` 的运行时字典驱动（详见 §6）

## 2. 部署机制

| 项 | 值 |
|---|---|
| 托管 | GitHub Pages |
| 发布来源 | `main` 分支，**仓库根目录**（不是 `dist/`） |
| 触发方式 | `git push` 到 `main` 后自动构建 |
| 构建耗时 | 约 40–90 秒 |
| 构建状态查询 | `GET /repos/zhongxin6882/Portfolio-2/pages/builds/latest` |

**推送后必须验证构建状态**，`status` 变为 `built` 且 `commit` 等于你的提交号才算发布成功。

### ⚠️ 缓存版本号约定（最容易踩的坑）

所有 CSS / JS 引用都带 `?v=` 查询串用于缓存击穿：

```html
<link rel="stylesheet" href="style.css?v=zh-pingfang-20261019b">
<script src="locale.js?v=zh-pingfang-20261019b"></script>
```

**改了某个 css/js 文件，就必须同步提升引用它的页面上的 `?v=` 值**，否则回访用户的浏览器会继续用旧缓存，改动看起来"没生效"。版本号是自由格式字符串，惯例是 `<改动主题>-<日期>`，全站统一用同一个新值。

注意部分引用**完全没有** `?v=`（如 `playground.html` 里的 `about.js`、`fromanother.html` 里的 `page-transition.js`）。改动这些文件时要主动补上版本号。

## 3. 目录结构

```
Portfolio-2/
├── index.html              首页：作品画廊（19 个项目的循环卡片堆叠）
├── about/index.html        关于页（canonical 路由，441 行，已格式化，含交互插画）
├── playground.html         灵感实验室：24 张实验作品图墙
├── contact.html            联系页
├── fromanother.html        单个项目的案例详情页（从首页第 1 个项目进入）
│
├── style.css               全站主样式（183 行，含 :root 字体变量）
├── work.css                首页画廊专用样式（453 行，已格式化）
│
├── work.js                 首页画廊数据 + 循环堆叠交互引擎
├── locale.js               中英双语字典 + 运行时替换引擎（i18n 核心）
├── site-header.js          全站共享页头行为（菜单 / 时钟 / 音频）
├── page-transition.js      页面转场遮罩 + 路由拦截
├── about.js                开场动画收尾 + 关于页交互插画
├── app.js                  fromanother.html 案例页专用（图墙 / 视差 / 光标）
├── playground.js           灵感实验室专用（卡片渲染 / GSAP 动画 / 计数器）
│
├── assets/work/            19 张本地作品封面图（01.jpg … 19.jpg）
├── assets/about/           关于页插画素材（portrait / watch / coffee 等 webp）
├── pusher-*.webp/svg       开场动画角色素材
│
├── dist/                   ⚠️ 历史归档，不参与发布，勿改
└── versions/1.0/           ⚠️ 1.0 版本归档，不参与发布，勿改
```

### 关于 `dist/` 和 `versions/1.0/`

这两个目录是**历史快照**，GitHub Pages 并不用它们做入口（发布源是仓库根目录）。
它们能通过 URL 直接访问到（例如 `/dist/contact.html`），因此**内容修复类改动**（联系方式、品牌名）应同步过去，避免旧信息外露；但**功能开发只改根目录文件**，不要往归档里加新特性。

> `README.md` 目前仍写着"Open `dist/index.html`"，这是过时描述，以本文件为准。

## 4. 路由表

| 路径 | 文件 | 说明 |
|---|---|---|
| `/` | `index.html` | WORK，作品画廊首页 |
| `/about/` | `about/index.html` | ABOUT，**唯一正式路由** |
| `/playground.html` | `playground.html` | PLAYGROUND |
| `/contact.html` | `contact.html` | CONTACT |
| `/fromanother.html` | `fromanother.html` | 项目案例详情页，不在主导航中 |

- `about.html`（文件形式）**已删除**，全站导航统一指向 `about/`（目录形式）。
- `page-transition.js` 的 `pageLabels` 里仍保留 `'about.html': 'About'` 映射，属于无害的死配置。
- `fromanother.html` 由 `work.js` 的 `openDetail()` 在 `i === 0` 时注入链接进入。

## 5. 脚本加载顺序（每页不同，改动前务必确认）

| 页面 | 加载的脚本（按顺序） |
|---|---|
| `index.html` | `work.js` → `site-header.js` → `page-transition.js` → `locale.js` |
| `about/index.html` | `site-header.js` → `page-transition.js` |
| `playground.html` | GSAP(CDN) → `about.js` → `playground.js` → `site-header.js` → `page-transition.js` → `locale.js` |
| `contact.html` | `about.js` → `site-header.js` → `page-transition.js` → `locale.js` |
| `fromanother.html` | `app.js` → `site-header.js` → `page-transition.js` → `locale.js` |

**顺序有含义**：

- `locale.js` **必须最后加载**。它用 `MutationObserver` 监听整个 `document.body`，需要等前面脚本把动态内容（画廊卡片、图墙）注入 DOM 后再开始翻译。虽然 observer 是持续监听、后注入的节点也能被捕获，但把它放最后可以避免首帧英文闪烁。
- `site-header.js` 的菜单和音频监听用了**捕获阶段 + `stopImmediatePropagation()`**，目的是抢在其他旧脚本的同类监听器之前独占处理权。若在别处新增 `#menuToggle` / `#audioToggle` 的监听器，注意这个优先级关系。
- `about.js` 被 `playground.html` 和 `contact.html` 复用，**只为拿到开场动画收尾逻辑**（`#intro-loader` 加 `.is-done`）。这两页并没有关于页插画，`about.js` 里的 `.about-character` 分支会因为选择器取不到元素而自动跳过。

### `about/index.html` 的 i18n 方向与其他页相反

该页文案是**用中文直接写死**的（`lang="zh-CN"`），而其他四页源文是英文、靠字典译成中文。
所以它的翻译方向是反的：

- 页内 **24 条中文** → 需要「中 → 英」映射，写在 `locale.js` 的 **`en` 显式覆盖块**里
  （反转字典覆盖不到，因为 `zh` 里没有对应的英文源文）
- 页内 **17 条英文**（技能名、日期区间、共享页头文案等）→ 需要「英 → 中」映射，写在 `zh` 里

本页已配置 `data-default-language="zh"` 与 `data-language-key="jiuyueshiwu-about-language"`
（语言记忆与其他页相互独立），并在 `page-transition.js` 之后加载 `../locale.js`。


## 6. 国际化系统（`locale.js`）

这是全站最容易改坏的模块，机制如下：

### 数据结构

```js
const zh = { 'English source': '中文译文', ... };          // 主字典：英 → 中
Object.assign(zh, { ... });                                 // 可多块追加，等价于扩充 zh
const en = Object.assign(
  Object.fromEntries(Object.entries(zh).map(([e, c]) => [c, e])),  // 自动反转：中 → 英
  { '中文原文': 'English', ... }                              // 显式覆盖，用于源文本来就是中文的条目
);
const enTitles = new Map([ ... ]);                          // <title> 专用映射
```

**关键**：`en` 是在 `const en=Object.assign(` 这一行**当场**从 `zh` 反转生成的。
所以新增词条必须插在这一行**之前**，否则切回英文时不生效。

### 替换机制

`MutationObserver` 监听 `document.body`（`subtree + characterData + childList`），对每个 **TEXT_NODE** 做：

```js
const value = raw.trim().replace(/\s+/g, ' ');   // 去首尾空白 + 压缩连续空白
if (zh[value] !== undefined || en[value] !== undefined) { ...替换... }
```

**只匹配完全相等的文本节点**（规范化空白后）。这意味着：

- 字典键必须和 DOM 里的文本**逐字符一致**，包括空格、`↗`、`·`、`—` 等符号
- 拼接出来的动态文本（如模板字符串里的变量）匹配不上，需要拆成静态片段分别建词条
- **被 `<br>` 分隔的文本会变成多个独立文本节点**，必须分段建词条。
  例：`work.js` 里 `role` 字段为 `'Design Direction<br>Website Design'`，需要 `'Design Direction'` 和 `'Website Design'` **两条**词条，而不是一条整串。
- 只处理文本节点，**不碰属性**（`alt`、`aria-label`、`title`、`placeholder` 不会被翻译）

### 语言状态

```js
const pageLanguageKey = document.body.dataset.languageKey;   // 每页独立记忆（可选）
let language =
  (pageLanguageKey && localStorage.getItem(pageLanguageKey)) ||
  (pageLanguageKey ? pageDefaultLanguage : localStorage.getItem('jiuyueshiwu-language')) ||
  'en';                                                       // 最终兜底是英文
```

- 页面通过 `<body data-default-language="zh">` 指定默认语言
- **当前只有 `index.html` 设了 `data-default-language="zh"`**，其余页面兜底为 `'en'`（英文）
- 有 `data-language-key` 的页面语言记忆相互独立；没有的共用 `jiuyueshiwu-language`

### ⚠️ 字典方向规则（放错会导致两种语言都翻译错乱）

- **`zh` 的键必须是英文源文**，值是中文。
- **中文源文的文案不能放进 `zh`**，必须放进 `en` 的显式覆盖块（键中文、值英文）。
- 放错的后果是双向都错：中文模式下 `zh[中文]` 命中会把它换成英文；英文模式下反转字典又把英文换回中文。
- 键里**含**中文但整体是「混合源文 → 中文」的条目属于正常情况，例如
  `'怡视科技 · AI products':'怡视科技 · AI 产品'`（源文本身就是中英混排）。判断标准是**源文方向**，不是键里有没有汉字。

### 新增文案的标准流程

1. 在 HTML / JS 里写好**英文**源文（保持全站一致：源文用英文，中文靠字典）
2. 在 `locale.js` 的 `zh` 字典或任一 `Object.assign(zh,{...})` 块里加 `'English':'中文'`
3. 确认插入位置在 `const en=Object.assign(` **之前**
4. 若源文本身就是中文（如 `about/index.html`），则改为往 `en` 的显式覆盖块里加 `'中文':'English'`
5. 提升引用 `locale.js` 的页面上的 `?v=` 版本号

## 7. 首页画廊数据模型（`work.js`）

### 数据格式

`projects` 是一个 19 行的数组，每行 7 个字段，顺序固定：

```js
['FROMANOTHER',            // 0 name        项目名（专有名词，不翻译）
 'Agency & Studio',        // 1 type        类型标签
 'April 2026',             // 2 date        上线时间
 'A fresh website for…',   // 3 description 一句话简介
 'Design Direction<br>Website Design',   // 4 role    职责，<br> 分段
 'Awwwards Site of the Day<br>FWA of the Day',  // 5 awards 奖项，<br> 分段
 'JK0FqSLxHpj1w22TtNIaAQwr2uc.jpg']      // 6 image   远程图源文件名
```

紧随其后的 `.map()` 会派生出实际使用的对象：

```js
{ name, type, date, description, role, awards,
  image:  `assets/work/${String(i+1).padStart(2,'0')}.${image.split('.').pop()}`,  // 本地图
  remote: `https://framerusercontent.com/images/${image}?width=1138`,                // 远程兜底
  number: i+1 }
```

**图片双源机制**：优先加载本地 `assets/work/NN.ext`（NN 是 1 起始、补零到两位的**数组序号**，与项目内容无关），`img.onerror` 时回退到 `remote`。
所以**新增或调整项目顺序时，必须同步重命名 `assets/work/` 里的图片文件**，否则封面会张冠李戴。

> ⚠️ 有一行用的是双引号：`["BY ’KIN", ...]`，因为项目名里含弯引号 `’`。解析或改写这个数组时不要假设全部是单引号。

### 顺序重排（改动数组时必须重算）

数据行之后有两次 `splice`，用于把顺序调整成参照站的次序：

```js
const [defiant] = projects.splice(9, 1); projects.splice(7, 0, defiant);  // DEFIANT 移到 MAT VOYCE 之后
const [district2, dafi] = projects.splice(17, 2); projects.push(dafi, district2);  // 循环收尾
projects.forEach((p, i) => p.number = i + 1);   // 重排后重新编号
```

**这些是硬编码的数组下标。增删任何项目都要重新核对这两个 splice，否则顺序会错乱。**

### ⚠️ 计数器分母是硬编码的

`index.html` 里写死了：

```html
<strong id="work-number">01</strong><small>/19</small>
```

而 `work.js` 里用的是 `const count = projects.length`。**增删项目时这两处必须同步**，否则左侧会显示 `07/19` 而实际只有 18 个项目。

### 交互引擎要点

| 函数 / 变量 | 作用 |
|---|---|
| `looping()` | `innerWidth > 850`。**桌面端**走循环堆叠（滚轮/触摸驱动），**移动端**走原生滚动 + `updateMobile()` |
| `wrap(n)` | 环形取模，处理 19 → 01 的回绕 |
| `distance(i, p)` | 环形最短距离（带符号），决定卡片在堆叠中的偏移方向 |
| `position` / `targetPosition` | 当前 / 目标位置，`tick()` 里按 `position += (target - position) * .16` 缓动 |
| `render()` | 把 `distance` 换算成 `--stack-x/y/rotation/yaw/scale` CSS 变量、`z-index`、`opacity`、`visibility` |
| `scheduleFrame()` / `tick()` | rAF 节流，`framePending` 防重复排帧 |
| `queueSnap()` | 停止输入 180ms 后把 `targetPosition` 吸附到整数 |
| `setActive(i)` | 更新左侧信息栏（role / date / awards / number）与右侧索引高亮、`aria-current` |
| `openFocus(i)` | 打开预览浮层（`#work-focus`），锁 `body.overflow` |
| `openDetail(i)` | 打开详情浮层（`#work-detail`），内含"下一个项目"按钮，循环 |
| `closeOverlays()` | 关闭两个浮层；Esc 键也走这里 |

- `palettes` 是 12 组配色三元组，按 `i % 12` 循环用于右侧索引卡片的色块
- 输入绑定：`wheel`（`deltaMode` 归一化）、`touchstart/move/end`、`keydown`（↑↓ / PageUp / PageDown）
- `focused >= 0` 时所有滚动/键盘输入被短路，避免浮层打开时背景还在转
- `i === 0`（FROMANOTHER）是特例：详情里额外注入 3 张远程图 + 一个指向 `fromanother.html` 的"查看完整案例"链接
- 开场动画：`#intro-loader` 在 5500ms 后加 `.is-done`；`prefers-reduced-motion` 时立即结束

## 8. 其余脚本职责

### `site-header.js` — 全站共享页头

作用于 `.chrome` 页头，三块独立功能：

1. **菜单开关** `#menuToggle` → 切换 `#menu` 的 `.closed`，同步 `aria-expanded`，重开时重新触发 `.typing` 打字动画
2. **时钟** `#clock` → `Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai'})` 24 小时制，每秒刷新。
   ⚠️ 时区**写死为 Asia/Shanghai**，但页头静态文案写的是 `HCMC`（胡志明市），两者不一致
3. **音频开关** `#audioToggle` → 用 Web Audio API **实时合成**一段 8 音符正弦波循环（C4 E4 G4 C5 A4 G4 E4 D4，间隔 420ms，主增益 .045，单音符 0→.5→.001 包络，时长 .58s）。`pagehide` 时停止。
   - 依赖按钮内存在 `.audio-label` 元素（全站 5 个页面都有）
   - ⚠️ `README.md` 里写的"audio switch is visual only"是**过时描述**，实际有真实声音输出

### `page-transition.js` — 路由转场

用 `sessionStorage`（键 `portfolio-route-transition`）在两个页面之间传递目标页名称：

- **离开时**：拦截同源、且在 `pageLabels` 白名单里的链接点击 → `preventDefault()` → 写入 label → 生成遮罩 → 600ms 后 `location.assign()`
- **到达时**：读出并**立即删除** label → 给 `<html>` 加 `.has-route-transition` → **移除 `#intro-loader`**（避免每次跳转都重放开场动画）→ 生成遮罩 → 520ms 后加 `.is-leaving` → 1450ms 后移除遮罩
- **不拦截**：`target="_blank"`、带 `download`、按住修饰键、非左键、跨域、同路径、`event.defaultPrevented`

`pageLabels` 就是路由白名单。**新增页面必须在这里登记**，否则点进去不会有转场。

### `about.js` — 开场动画 + 关于页插画

- 开场：`#intro-loader` 在 **4700ms** 后加 `.is-done`（注意与 `work.js` / `app.js` 的 5500ms 不同）
- 插画交互（仅 `about/index.html` 有 `.about-character`）：
  - 鼠标悬停展开（`pointerType === 'mouse'` 才响应，触屏不误触发）
  - 点击 `.character-trigger` 可**钉住**展开状态（`pinned`）
  - 点击 `.idea` 气泡：设 `.is-selected` + `aria-pressed`，把该元素的 `data-note` 写进 `.character-note`，并给容器加 `.has-selection`
  - Esc 重置全部状态
  - `render()` 统一根据 `pinned || hovered` 切换 `.is-open` 与 `aria-expanded`

### `app.js` — `fromanother.html` 案例页

压缩成 5 行，职责：

- 11 张图**全部远程热链** `framerusercontent.com`（无本地副本）
- 生成 `.frame` 图片块（第 3 张即 `i === 2` 加 `.tall` 变高）+ `.rail` 导航圆点
- `IntersectionObserver`（threshold `.17`）进入视口时给 frame 加 `.show`、给对应圆点加 `.active`
- 滚动视差：`translate3d(0, ((中心偏移)/视口高) * -45px, 0)`，用 `ticking` + rAF 节流，`passive: true`
- 自定义光标 `.cursor` 跟随指针（偏移 -18px 居中）
- 开场动画 5500ms
- ⚠️ 首行有 `history.scrollRestoration = 'manual'` 和 `pageshow` 时滚回顶部

### `playground.js` — 灵感实验室

- `projects` 是 24 个 `{title, image}` 对象，图片**全部远程热链**
- 渲染 `.play-card` 卡片墙，前 8 张 `loading="eager"`，其余 `lazy`
- GSAP 从 **jsdelivr CDN** 加载（`gsap@3.15`），`window.gsap` 存在且未开启减弱动效时才走动画分支
- 计数动画：数到 `target = 83`，用 localStorage 键 `september15-play-count-seen` 保证**只在首次访问时播放**，之后直接显示终值
- 卡片入场：前 4 张走 GSAP 时间轴，其余用 `IntersectionObserver`（threshold `.12`）滚动触发，`back.out(1.45)` 弹性缓动
- `.play-tagline` 悬停时动画 `backgroundPosition`
- **完整的无 GSAP 降级分支**：直接给卡片加 `.is-visible`、给 tagline 加 `.type-in`、计数器直接写终值。**改动画时两个分支都要改**

## 9. 样式系统

### 字体（`style.css` 的 `:root`）

```css
--font-sans:  "DM Sans","PingFang SC","苹方-简",-apple-system,BlinkMacSystemFont,
              "Microsoft YaHei","微软雅黑","Noto Sans SC","Source Han Sans SC",Arial,sans-serif;
--font-mono:  "DM Mono","PingFang SC","苹方-简",-apple-system,
              "Microsoft YaHei","微软雅黑","Noto Sans SC",monospace;
--font-serif: Georgia,"PingFang SC","苹方-简","Songti SC",serif;
```

- 全部字体声明已收口到这三个变量，**新样式一律用 `var(--font-*)`，不要再写裸字体栈**
- 拉丁字符走 DM Sans / DM Mono（Google Fonts），中文自动落到苹方（因为 DM 系列不含中文字形）
- **苹方是苹果专有字体，无法作为 webfont 嵌入**。实际效果分平台：macOS/iOS 真苹方，Windows 回退微软雅黑，Android 回退思源黑体/系统默认
- 若要求跨平台完全一致，需换成可自由嵌入的开源字体（思源黑体 / 阿里巴巴普惠体）并自托管
- Google Fonts 在中国大陆可能加载缓慢或失败；此时拉丁字符会回退到苹方的拉丁字形，不会变成宋体

### 主要色彩

| 用途 | 值 |
|---|---|
| 强调橙（关于页星号、悬停、页脚条） | `#f0532e` |
| 关于页底色 | `#e9e9e7` |
| 首页底色 | `#e9e9e9` |
| 深色段落带（关于页 approach 区） | `#1b1b1a` |
| 分隔线 | `#aaa` / `#c5c5c2` |
| 次要文字 | `#777` / `#666` |

### 文件分工

- `style.css`（183 行）：全站基础 + 开场动画 + 页头 + 关于页 + 灵感实验室 + 联系页 + 转场遮罩。**每行一条规则，行内是压缩的**
- `work.css`（453 行）：仅首页画廊。**已格式化，一属性一行**

`style.css` 里已有的分区注释（`/* Reference-inspired push reveal opening */` 等）标记了各模块边界，新增样式请放到对应分区内并沿用同样的注释风格。

## 10. 编辑注意事项

1. **HTML 文件大多是压缩成单行的**（`index.html` 3931 字节仅 9 行，`contact.html` / `playground.html` / `fromanother.html` 整个文件就是 1 行）。
   → 用**精确字符串替换**改动，不要凭肉眼在长行里找位置，也不要用编辑器自动格式化。
   → **绝不整文件重排/美化**：会让 diff 变成整文件替换，无法 review，也极易和其他人的并发改动冲突。
2. `about/index.html`（441 行）和 `work.css`（453 行）是**已格式化**的，可以正常编辑。
3. 改完 JS 一定跑 `node --check <file>`；改完 CSS 检查 `{` 与 `}` 数量是否配平。
4. 提交前先 `git pull --rebase`。这个仓库经常有并发推送，直接 push 会被拒。
5. **不要动 `dist/` 和 `versions/1.0/`** 来做功能开发（见 §3）。

## 11. 已知问题与技术债

| # | 问题 | 位置 | 影响 |
|---|---|---|---|
| ~~1~~ | ~~`about/index.html` 语言切换按钮无效~~ | — | ✅ **已修复**：已接入 `locale.js` + `data-language-key`，24 条中文全部补上「中→英」映射 |
| ~~2~~ | ~~只有首页默认中文~~ | — | ✅ **已修复**：五个页面全部 `data-default-language="zh"`，且已验证双向覆盖率 100% |
| ~~3~~ | ~~页头写 `HCMC` 但时区是 `Asia/Shanghai`~~ | — | ✅ **已修复**：`contact.html` 顶栏改为 `WORKING GLOBALLY · BEIJING`，词典同步 |
| 4 | `README.md` 内容过时：说"Open `dist/index.html`"、说音频是视觉-only | `README.md` | 误导协作者 |
| 5 | 部分 css/js 引用没有 `?v=` 版本号 | `playground.html`、`fromanother.html` | 改动可能不生效 |
| 6 | `app.js`、`playground.js` 的图片全部热链 `framerusercontent.com` | 同左 | 依赖第三方 CDN，有失效与授权风险 |
| 7 | 画廊计数器分母 `/19` 在 HTML 里硬编码 | `index.html` | 增删项目易漏改 |
| 8 | `page-transition.js` 仍保留已删除的 `about.html` 路由映射 | `page-transition.js` | 死配置，无害 |
| 9 | 三个脚本的开场动画时长不一致（4700ms / 5500ms） | `about.js` vs `work.js`、`app.js` | 各页开场节奏不统一 |
| 10 | `zh` 词典里残留大量旧英文版关于页的死词条（`ABOUT MY PRACTICE`、`01 / EXPERIENCE`、`YEARS IN UI/UX` 等），当前页面已不用 | `locale.js` | 无害，但词典体积虚高、易误判覆盖率 |
| 11 | `enTitles` Map 声明后从未被使用（标题实际走 `zh`/`en` + `data-en-title`） | `locale.js` | 死代码 |
| 12 | `contact.html` 的 `.contact-credits` 署名区仍是模板原作者团队 | `contact.html` | 待确认授权后再决定去留 |

## 12. 常见任务操作指引

### 新增一个作品项目

1. 在 `work.js` 的 `projects` 数组里加一行，7 个字段按 §7 的顺序填
2. 把封面图放进 `assets/work/`，**按新的数组序号重命名**为 `NN.ext`（补零两位）
3. 重算两处 `splice` 的下标（§7）
4. 更新 `index.html` 里 `<small>/19</small>` 的分母
5. 在 `locale.js` 补词条：`type`、`date`、`description`、`role` 各段、`awards` 各段（`<br>` 要拆开）
6. 提升 `work.js` 和 `locale.js` 的 `?v=` 版本号
7. `node --check work.js locale.js`，提交，`git pull --rebase`，推送，验证 Pages 构建

### 新增一个页面

1. 建 HTML，复制任一现有页面的 `.chrome` 页头和 `#intro-loader` 结构
2. 在 `page-transition.js` 的 `pageLabels` 里登记路由（否则没有转场动画）
3. 在所有页面的 `<nav id="menu">` 里加入口
4. 按 §5 的顺序引入脚本，`locale.js` 放最后
5. 设 `data-default-language`，需要独立语言记忆就再加 `data-language-key`
6. 在 `locale.js` 补该页所有文案词条（含 `<title>`，需要的话进 `enTitles`）

### 改文案

- 英文源文改在 HTML / JS 里，中文改在 `locale.js` 字典里，**两边都要改**
- 字典键必须与 DOM 文本逐字符一致（§6）
- 别忘了提升 `?v=`

## 13. 推送前检查清单

- [ ] `node --check` 通过所有改动过的 `.js`
- [ ] CSS 的 `{` / `}` 数量配平
- [ ] HTML 的 `<div>` / `</div>` 数量配平
- [ ] 改动过的 css/js，其引用处的 `?v=` 已提升
- [ ] 新增文案已进 `locale.js`，且插在 `const en=Object.assign(` 之前
- [ ] 增删项目时：`splice` 下标、`assets/work/` 图片名、`/19` 分母三处已同步
- [ ] `git pull --rebase` 已执行，无冲突
- [ ] 未误改 `dist/` 和 `versions/1.0/` 的功能代码
- [ ] 推送后确认 Pages `status: built` 且 commit 号一致
- [ ] 线上抽查：强制刷新（Cmd/Ctrl + Shift + R）后中英文切换正常
