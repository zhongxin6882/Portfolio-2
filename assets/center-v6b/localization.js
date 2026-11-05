/* Keep dynamically mounted About chapters in step with the site's language. */
const translations = {
  'WORK':'作品', 'HISTORY':'经历', 'ABOUT':'关于', 'PLAYGROUND':'灵感实验室', 'CONTACT':'联系', '02 / EXPERIENCE':'02 / 工作经历',
  'PLAYFUL':'玩心', 'DESIGN.':'设计。', 'MAKE DESIGN FUN.':'让设计更有趣。', 'MAKE':'让', 'IT FUN.':'创意发生。', 'PLAYFUL DESIGN × CENTER':'玩心设计 × CENTER',
  '从移动端 UI、网络安全数据产品，到 AI 城市安防与新的职业阶段。向下滚动，WORK 和四段履历将作为一组内容持续向左移动。':'From mobile UI and cybersecurity data products to AI-powered urban safety and a new career chapter. Scroll down to move through the work history.',
  '华筑图文':'Huazhu Graphics', '奇安信':'Qi An Xin', '旷视科技（AI）':'Megvii (AI)', '腾讯控股':'Tencent Holdings',
  'UI 设计师':'UI Designer', '产品 UI 设计师 · 数据产品组长':'Product UI Designer · Data Product Team Lead', '交互与视觉设计师':'Interaction & Visual Designer', '职位信息待补充':'Position details pending',
  '2023.11 — 至今':'2023.11 — Present', '工作内容':'Responsibilities', '工作产出':'Deliverables', '资料说明':'Note',
  '负责“读书大事件”iOS、Android 应用的界面 UI 和交互设计；梳理客户需求、绘制人机交互界面结构，并配合开展可用性测试。':'Designed UI and interactions for the Reading Events iOS and Android apps, clarified client requirements, mapped interface structures, and supported usability testing.',
  '完成“读书大事件”V2.0 PC 端与移动端页面、两端视觉规范及竞品分析报告，同时制作宣传物料。':'Delivered desktop and mobile pages, visual guidelines, competitor analysis, and promotional materials for Reading Events V2.0.',
  '负责网络安全、舆情分析、应急响应及数据治理产品的设计构思、交互流程、业务组件与规范；根据需求调整 B 端、C 端及手持端界面和体验方案。':'Designed concepts, interaction flows, components, and standards for cybersecurity, public opinion analysis, emergency response, and data governance products across business, consumer, and handheld interfaces.',
  '输出多产品初期规划、视觉风格和交互方案，并承担 BCS 网络安全大会 Logo、VI 及线下宣传物料设计。':'Produced early product plans, visual styles, and interaction proposals, and designed the BCS cybersecurity conference logo, identity, and event materials.',
  '建设设计规范平台、设计语言指南、原子库类目及组件规范；为基于 CV 算法的城市安防、城市管理 B 端产品设计交互与视觉方案，涵盖可视化大屏、动效和定制化交互。':'Built design guidelines, an atomic library, and component standards; designed interactions and visuals for computer-vision urban safety and management products, including dashboards and motion.',
  '完成主线安防产品三个版本的 UI 与交互升级，以及 3 个 CV 算法衍生的城市安防与管理类 B 端产品；参与可用性测试及体验优化。':'Delivered UI and interaction upgrades for three versions of the core safety product and three computer-vision products, and contributed to usability testing and experience improvements.',
  '公司和任职时间来自本次确认的信息；职位、项目和具体职责尚未提供，暂不展示未经确认的细节。':'The employer and dates reflect the information provided. Position, project, and responsibility details are still pending.',
  '好玩的设计，不设标准答案。':'Playful design, without a single right answer.', '让想象力跳出框框，让设计更有趣。':'Let imagination break the mold and make design more fun.',
  '波普艺术是自由的表达。':'Pop art is a free form of expression.', '让好奇心、想象力和有趣的设计一起发生。':'Let curiosity, imagination, and playful design come together.',
  'BACK TO TOP':'返回顶部', 'LET’S':'让我们', "LET'S":'让我们', 'CONNECT':'联系',
  '调节动效':'Motion settings', '拖动参数，页面实时生效。可复制参数交给 AI 修改。':'Adjust parameters to preview motion changes. Copy the settings for further editing.', '快速跳转':'Quick navigation',
  '线上 About':'About', '02 履历':'02 Experience', '03 粒子互动':'03 Particle interaction', '04 图片墙':'04 Gallery', '同轨连续左移':'Continuous horizontal scroll',
  '横向滚动节奏':'Horizontal scroll pace', '第四张停留':'Fourth card hold', 'Hover 淡入':'Hover fade-in', '图片起始缩放':'Initial image scale', '覆盖转场长度':'Cover transition length', '人物完整展示':'Full-figure hold', '粒子章节长度':'Particle chapter length',
  '照片墙滚动长度':'Gallery scroll length', '聚合初始尺寸':'Initial cluster size', '聚合初始旋转':'Initial cluster rotation', '点击放大':'Click to enlarge', '弹窗放大速度':'Lightbox animation speed', '复制给 AI 的参数':'Copy settings', '恢复推荐值':'Reset settings', 'WORK → 滑板过渡':'Work to skater transition', '照片聚散':'Photo animation',
  '此文件离线可用；如联网加载 GSAP，照片墙和弹窗会使用 GSAP 增强。照片均为演示素材；腾讯控股职位和职责信息待补充。':'The gallery and lightbox use GSAP when available. Gallery images are illustrative; Tencent role details are pending.'
};
// Dictionary entries are expressed in their source language; maintain explicit pairs.
const pairs = Object.entries(translations).map(([source,target]) => /[\u3400-\u9fff]/.test(source) ? [source,target] : [target,source]);
const bySource = new Map(pairs.flatMap(([zh,en])=>[[zh,{zh,en}],[en,{zh,en}]]));
const originalPairs = new WeakMap();
function localizeTree(root, lang) {
  if (!root) return;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node=walker.currentNode, raw=node.nodeValue, key=raw.trim().replace(/\s+/g,' ');
    const pair=originalPairs.get(node)||bySource.get(key);
    if (pair) { originalPairs.set(node,pair); node.nodeValue=raw.replace(raw.trim(), pair[lang]); }
  }
}
export function installChapterLocalization(root) {
  const frame=root.querySelector('#skater-frame');
  const translatedAttributes = [];
  function attr(selector, name, english) {
    const element=root.querySelector(selector);
    if (element) translatedAttributes.push({element,name,zh:element.getAttribute(name),en:english});
  }
  attr('#experience','aria-label','Work introduction and four experience panels');
  attr('#career-track','aria-label','Work introduction and four career panels');
  attr('.career-aside','aria-label','Work history introduction');
  attr('#prev-card','aria-label','Previous experience');
  attr('#next-card','aria-label','Next experience');
  ['Huazhu Graphics','Qi An Xin','Megvii','Tencent Holdings'].forEach((name,i)=>attr(`.career-card[data-stage="${i}"]`,'aria-label',`View ${name} experience`));
  const photoDescriptions=[
    'Illustrative mobile UI and graphics studio, not a verified Huazhu workplace photo',
    'Illustrative cybersecurity data workspace, not an actual Qi An Xin workplace photo',
    'Illustrative AI urban safety design workspace, not an actual Megvii workplace photo',
    'Illustrative technology company office, not an actual Tencent workplace photo'
  ];
  photoDescriptions.forEach((text,i)=>attr(`.career-card[data-stage="${i}"] img`,'alt',text));
  const galleryDescriptions=['Designers collaborating around a computer','Developers reviewing code','Designers brainstorming','A product data presentation','A team hiking in the woods','Colleagues playing foosball','Colleagues watching a mountain sunset','Colleagues having a picnic'];
  galleryDescriptions.forEach((text,i)=>{attr(`.bento-tile:nth-child(${i+1})`,'aria-label',`Enlarge photo ${i+1}`);attr(`.bento-tile:nth-child(${i+1}) img`,'alt',`Illustrative scene: ${text.toLowerCase()}`);});
  attr('#make-it-matter','aria-label','Playful Design skater particle interaction');
  attr('#skater-frame','title','Playful Design skater particle interaction');
  attr('#gallery','aria-label','Photo gallery');
  attr('#photo-modal','aria-label','Enlarged photo');
  attr('#close-photo','aria-label','Close photo');
  const update=()=>{
    const lang=document.documentElement.lang.toLowerCase().startsWith('zh')?'zh':'en';
    localizeTree(root,lang);
    for (const item of translatedAttributes) item.element.setAttribute(item.name,item[lang]);
    try {if(frame.contentDocument?.body){frame.contentDocument.documentElement.lang=lang==='zh'?'zh-CN':'en'; localizeTree(frame.contentDocument.body,lang);}} catch {}
  };
  frame.addEventListener('load',update);
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  update();
}
