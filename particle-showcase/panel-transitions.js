import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const frame = document.querySelector(".about-frame");
const panels = () => gsap.utils.toArray(".sequence-panel");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function syncAboutFrame() {
  if (!frame) return;
  try {
    const doc = frame.contentDocument;
    if (!doc?.documentElement) return;
    const height = Math.max(
      window.innerHeight,
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight || 0
    );
    frame.style.height = `${height}px`;

    doc.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href") || "";
      if (
        href &&
        !href.startsWith("#") &&
        !/^(mailto:|tel:)/i.test(href) &&
        link.target !== "_blank"
      ) {
        link.target = "_top";
      }
    });
  } catch {
    // Keep the iframe usable if a browser blocks same-origin measurement.
  }
}

function publishParticleProgress(progress) {
  window.dispatchEvent(new CustomEvent("particle:progress", {
    detail: { progress: Math.max(0, Math.min(1, progress)) }
  }));
}

function buildPinnedPanels() {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());

  const allPanels = panels();
  allPanels.forEach(panel => {
    panel.style.marginBottom = "";
    gsap.set(panel, { clearProps: "transform,opacity" });
  });

  if (reducedMotion || allPanels.length < 2) {
    window.__particleScrollControlled = false;
    publishParticleProgress(0);
    return;
  }

  allPanels.slice(0, -1).forEach(panel => {
    const inner = panel.querySelector(".panel-inner");
    if (!inner) return;

    const isParticlePanel = panel.classList.contains("particle-panel");
    const panelHeight = Math.max(inner.offsetHeight, inner.scrollHeight);
    const difference = panelHeight - window.innerHeight;
    const fakeScrollRatio = difference > 2
      ? difference / (difference + window.innerHeight)
      : 0;

    if (fakeScrollRatio) {
      panel.style.marginBottom = `${panelHeight * fakeScrollRatio}px`;
    }

    const end = () => {
      if (fakeScrollRatio) return `+=${Math.max(inner.offsetHeight, inner.scrollHeight)}`;
      if (isParticlePanel) return `+=${window.innerHeight * 2.6}`;
      return "bottom top";
    };

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: "bottom bottom",
        end,
        pinSpacing: false,
        pin: true,
        scrub: 0.75,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          if (isParticlePanel) publishParticleProgress(self.progress);
        },
        onRefresh(self) {
          if (isParticlePanel) publishParticleProgress(self.progress);
        }
      }
    });

    if (fakeScrollRatio) {
      timeline.to(inner, {
        yPercent: -100,
        y: window.innerHeight,
        duration: 1 / (1 - fakeScrollRatio) - 1,
        ease: "none"
      });
    }

    timeline
      .fromTo(
        panel,
        { scale: 1, opacity: 1 },
        {
          scale: isParticlePanel ? 0.93 : 0.96,
          opacity: isParticlePanel ? 0.76 : 0.82,
          duration: 0.9,
          ease: "none"
        }
      )
      .to(panel, { opacity: 0, duration: 0.1, ease: "none" });
  });

  window.__particleScrollControlled = true;
  ScrollTrigger.refresh();
}

function refreshSequence() {
  syncAboutFrame();
  buildPinnedPanels();
}

if (frame) {
  frame.addEventListener("load", refreshSequence, { once: true });
  if (frame.contentDocument?.readyState === "complete") refreshSequence();
} else {
  buildPinnedPanels();
}

let resizeCall;
window.addEventListener("resize", () => {
  syncAboutFrame();
  if (resizeCall) resizeCall.kill();
  resizeCall = gsap.delayedCall(0.18, buildPinnedPanels);
}, { passive: true });

publishParticleProgress(0);
