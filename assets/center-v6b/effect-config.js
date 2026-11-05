/**
 * CENTER ABOUT V6 · AI 动效参数中心
 * 只改这里的数字，大部分滚动/悬停/弹窗节奏会同步更新。
 * 单位说明：Screens = 整个浏览器视口高度；Seconds = 秒；Px = 像素。
 * 桌面 40/60 列比例要加起来等于 100；手机端仍保持上下分区。
 * 说明：本版默认值已从原始 V6 做轻量优化，保留原有栏目布局与交互机制。
 */
window.CENTER_EFFECTS = {
  career: {
    leftColumnPercent: 40,           // 桌面：WORK 简介在同一横向轨道中的宽度基准 (%)
    screensPerCard: 0.85,            // 从 WORK 简介到 04 的四段连续移动，每段消耗的纵向滚动屏数
    fourthHoldScreens: 0.9,        // 04 已完整进入视口后保留几屏距离，再进入第三屏
    hoverPhotoFadeSeconds: 0.35,    // 悬停照片由透明变为完全可见所需秒数
    hoverPhotoStartScale: 1.06,    // 悬停前照片放大倍数（1=原尺寸）
    hoverPhotoZoomSeconds: 0.75,   // 悬停前照片缩回原尺寸所需秒数
    detailFadeSeconds: 0.4,       // 工作内容展开/收起持续时间
    detailMaxHeightDesktopPx: 340,// 文字展开允许的最大高度；太小会裁切文字
    detailMaxHeightMobilePx: 310,
    detailMaxHeightShortScreenPx: 300
  },
  bridge: {
    overscrollScreens: 1.35,     // 第三屏自底向上覆盖 WORK 的 pinned overscroll 距离（单位视口）
    scrollScreens: 3.7,          // SKATER 粒子交互：匹配上传 demo 的 325svh 章节长度
    introHoldScreens: 1.1,     // 过渡结束后完整展示滑板人物，再开始粒子消散（视口单位）
    gsapTitleFromYpx: 16         // GSAP 在线增强时标题纵向轻移初始像素
  },
  gallery: {
    scrollScreens: 2.45,         // Bento 画廊章节总长度；超过 1 的部分用于 sticky 进场
    finishAtNativeProgress: 0.79,// 离线：滚到画廊总滚动段的约 79% 时完全展开
    finishAtGsapProgress: 0.80,  // 在线：ScrollTrigger 进度 80% 时完全展开
    fallbackClusterStrength: 0.65,// 离线：收拢至画廊中心的距离倍率
    gsapClusterStrength: 0.64,    // GSAP：同上；来源于 V6 原始实现
    fallbackVerticalOffsetPx: 42, // 离线：奇/偶卡片纵向初始错落间距
    gsapVerticalOffsetPx: 40,     // GSAP：奇/偶卡片纵向初始错落间距
    startScale: 0.56,              // 刚进入画廊时的初始缩放值
    fallbackStartOpacity: 0.22,   // 离线：初始不透明度
    gsapStartOpacity: 0.20,       // GSAP：初始不透明度
    tiltDegrees: 5,              // 聚拢状态下奇偶图片的旋转角度
    gsapStagger: 0.055,          // GSAP：每张图片在时间轴上的起始错位
    gsapTileDuration: 1.1        // GSAP：每张图在时间轴的动画时长
  },
  modal: {
    gsapOpenSeconds: 0.72,       // 有 Flip 时放大变形时长
    gsapCloseSeconds: 0.60,      // 有 Flip 时回缩变形时长
    backdropOpenSeconds: 0.37,   // 背景遮罩淡入时长
    backdropCloseSeconds: 0.40,  // 背景遮罩淡出时长
    nativeOpenMilliseconds: 320, // 离线或禁用动态效果时的放大时长
    flipEase: 'power3.inOut'     // GSAP 缓动曲线
  }
};
