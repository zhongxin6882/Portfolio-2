/**
 * page-transition.js — 页面转场遮罩 + 站内路由拦截
 * 全站每个页面都加载。位置在 locale.js 之前、业务脚本之后。
 *
 * 跨页面传递状态用的是 sessionStorage（键 'portfolio-route-transition'）：
 *   离开页写入目标页名称 → 到达页读出并立即删除 → 播放入场遮罩。
 * 到达时还会**移除 #intro-loader**，避免每次站内跳转都重放一遍开场动画。
 *
 * ⚠️ pageLabels 同时充当「路由白名单」：不在表里的链接不会被拦截，也就没有转场效果。
 *    新增页面必须在这里登记。
 */
(() => {
  const storageKey = 'portfolio-route-transition';
  // 路由白名单 + 遮罩上显示的页面名。键为路径最后一段；
  // 'about' 与 'about.html' 都登记以兼容旧链接（about.html 文件已删除，该条属无害死配置）。
  // ⚠️ 新增页面必须在此登记，否则点进去没有转场效果。
  const pageLabels = {
    'index.html': 'Work',
    'about.html': 'About',
    about: 'About',
    'playground.html': 'Playground',
    'contact.html': 'Contact'
  };

  // 取路径最后一段作为路由名；根路径回落到 'index.html'。
  const pageName = pathname => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.at(-1) || 'index.html';
  };

  // 生成全屏遮罩。role=status + aria-live=polite，让读屏软件能播报正在进入哪个页面。
  const makeOverlay = label => {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    const title = document.createElement('span');
    title.className = 'page-transition__title';
    title.textContent = label;
    overlay.append(title);
    document.body.append(overlay);
    return overlay;
  };

  // Route arrivals use the same shared panel transition on every page. Remove
  // the home intro loader before it can paint, even if an older stylesheet is cached.
  // ── 到达侧：读出上一页写入的 label 后**立刻删除**，防止刷新页面时重复播放入场动画。
  // 同时移除 #intro-loader，避免每次站内跳转都重放开场动画（即使旧样式表还在缓存里也生效）。
  let enteringLabel = '';
  try {
    enteringLabel = sessionStorage.getItem(storageKey) || '';
    sessionStorage.removeItem(storageKey);
  } catch {}

  if (enteringLabel) {
    document.documentElement.classList.add('has-route-transition');
    document.getElementById('intro-loader')?.remove();
    const overlay = makeOverlay(enteringLabel);
    requestAnimationFrame(() => setTimeout(() => overlay.classList.add('is-leaving'), 520));
    setTimeout(() => overlay.remove(), 1450);
  }

  // ── 离开侧：委托监听全站点击，只接管符合条件的站内链接。
  // 放行：非左键、带修饰键、target=_blank、download、跨域、同路径、已被 preventDefault。
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !pageLabels[pageName(destination.pathname)]) return;
    if (destination.pathname === location.pathname) return;

    event.preventDefault();
    const label = pageLabels[pageName(destination.pathname)];
    try { sessionStorage.setItem(storageKey, label); } catch {}
    makeOverlay(label);
    setTimeout(() => location.assign(destination.href), 600);
  });
})();
