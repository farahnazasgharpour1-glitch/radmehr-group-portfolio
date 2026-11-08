"use strict";

document.documentElement.classList.add("js-ready");

// Theme preference is initialized inline before CSS is painted.
(() => {
  const themeToggle = document.querySelector("#theme-toggle");
  const themeLabel = document.querySelector("#theme-toggle-label");
  const themeIcon = document.querySelector(".theme-toggle__icon");
  const themeQuery = window.matchMedia("(prefers-color-scheme: light)");
  const storageKey = "radmehr-theme";

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch (_) {
    // Theme switching remains available when storage is blocked.
  }

  let userHasChosenTheme = savedTheme === "light" || savedTheme === "dark";

  function applyTheme(theme) {
    const isLight = theme === "light";
    const normalizedTheme = isLight ? "light" : "dark";
    document.documentElement.dataset.theme = normalizedTheme;
    document.documentElement.style.colorScheme = normalizedTheme;

    const logo = document.querySelector(".brand img[data-light-src][data-dark-src]");
    if (logo) logo.src = isLight ? logo.dataset.lightSrc : logo.dataset.darkSrc;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = isLight ? "#F7F4ED" : "#111310";
    if (themeIcon) themeIcon.textContent = isLight ? "☾" : "☼";
    if (themeLabel) themeLabel.textContent = isLight ? "حالت تیره" : "حالت روشن";
    if (themeToggle) themeToggle.setAttribute("aria-label", isLight ? "تغییر به حالت تیره" : "تغییر به حالت روشن");
  }

  applyTheme(savedTheme || (themeQuery.matches ? "light" : "dark"));

  themeToggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    userHasChosenTheme = true;
    try { localStorage.setItem(storageKey, next); } catch (_) {}
  });

  const onSystemThemeChange = (event) => {
    if (!userHasChosenTheme) applyTheme(event.matches ? "light" : "dark");
  };
  if (typeof themeQuery.addEventListener === "function") themeQuery.addEventListener("change", onSystemThemeChange);
  else if (typeof themeQuery.addListener === "function") themeQuery.addListener(onSystemThemeChange);
})();

// Keep copyright years current without a backend.
const footerYear = document.getElementById("footer-year");
if (footerYear) footerYear.textContent = String(new Date().getFullYear());

// Expandable project cards: keyboard and pointer behavior are both supported.
const projectCards = Array.from(document.querySelectorAll(".project-card"));
function setProjectCardState(card, isOpen) {
  const button = card.querySelector(".project-card__toggle");
  const label = card.querySelector(".project-card__toggle-label");
  const icon = card.querySelector(".project-card__toggle-icon");
  const content = card.querySelector(".project-card__content");
  if (!button || !label || !icon || !content) return;

  card.classList.toggle("is-open", isOpen);
  const grid = card.closest(".projects-grid");
  if (grid) {
    grid.classList.toggle("has-open-card", isOpen);
    grid.querySelectorAll(".project-card").forEach((other) => {
      const current = other === card;
      other.classList.toggle("is-collapsed", isOpen && !current);
      const otherContent = other.querySelector(".project-card__content");
      if (otherContent) otherContent.setAttribute("aria-hidden", String(isOpen && !current));
    });
  }
  button.setAttribute("aria-expanded", String(isOpen));
  label.textContent = isOpen ? "بستن جزئیات" : "جزئیات بیشتر";
  icon.textContent = isOpen ? "↙" : "↗";
  content.setAttribute("aria-hidden", String(!isOpen));
}

projectCards.forEach((card) => {
  const button = card.querySelector(".project-card__toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    const willOpen = !card.classList.contains("is-open");
    if (willOpen) projectCards.forEach((other) => { if (other !== card) setProjectCardState(other, false); });
    setProjectCardState(card, willOpen);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && card.classList.contains("is-open")) {
      setProjectCardState(card, false);
      button.focus();
    }
  });
});

// Continuous, seamless project gallery using the locally hosted GSAP core.
(() => {
  const gsap = window.gsap;
  const section = document.querySelector(".project-showcase");
  if (!gsap || !section) return;

  const viewport = section.querySelector(".project-showcase__viewport");
  const track = section.querySelector(".project-showcase__track");
  const toggle = section.querySelector(".project-showcase__autoplay-toggle");
  if (!viewport || !track) return;

  const originalPanels = Array.from(track.children).filter(
    (panel) => !panel.hasAttribute("data-marquee-clone")
  );
  if (originalPanels.length < 2) {
    if (toggle) toggle.hidden = true;
    return;
  }

  const motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  let reduceMotion = Boolean(motionQuery && motionQuery.matches);
  let userPaused = reduceMotion;
  let userHasInteracted = false;
  let isVisible = false;
  let clones = [];
  let animation = null;
  let observer = null;
  let resizeFrame = 0;

  function updateToggle() {
    if (!toggle) return;
    toggle.hidden = false;
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute(
      "aria-label",
      userPaused ? "ادامه حرکت خودکار گالری" : "توقف حرکت خودکار گالری"
    );
    toggle.textContent = userPaused
      ? "ادامه حرکت گالری"
      : "توقف حرکت گالری";
  }

  function updatePlayback() {
    if (!animation) return;
    const shouldPlay =
      isVisible &&
      !userPaused &&
      !document.hidden &&
      (!reduceMotion || userHasInteracted);

    if (shouldPlay) animation.play();
    else animation.pause();
  }

  function clearClones() {
    clones.forEach((clone) => clone.remove());
    clones = [];
  }

  function createClone(panel) {
    const clone = panel.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    clone.setAttribute("data-marquee-clone", "");
    clone.inert = true;

    clone.querySelectorAll("img").forEach((image) => {
      image.setAttribute("alt", "");
    });
    clone.querySelectorAll("[id]").forEach((element) => {
      element.removeAttribute("id");
    });
    return clone;
  }

  function buildAnimation() {
    if (animation) {
      animation.kill();
      animation = null;
    }

    clearClones();
    section.classList.remove("is-enhanced");
    gsap.set(track, { x: 0 });

    const styles = window.getComputedStyle(track);
    const gap =
      parseFloat(styles.columnGap) ||
      parseFloat(styles.gap) ||
      0;

    const panelsWidth = originalPanels.reduce(
      (total, panel) => total + panel.getBoundingClientRect().width,
      0
    );
    const cycleDistance = panelsWidth + gap * originalPanels.length;

    if (cycleDistance <= viewport.clientWidth + 1) {
      if (toggle) toggle.hidden = true;
      return;
    }

    clones = originalPanels.map(createClone);
    clones.forEach((clone) => track.appendChild(clone));

    section.classList.add("is-enhanced");
    if (toggle) toggle.hidden = false;

    // Same calm constant-speed GSAP marquee as the earlier project version.
    const speed = window.matchMedia("(max-width: 760px)").matches ? 32 : 40;
    // Start on the duplicate cycle and move toward the original cards (left to right).
    gsap.set(track, { x: -cycleDistance });
    animation = gsap.to(track, {
      x: 0,
      duration: cycleDistance / speed,
      ease: "none",
      repeat: -1,
      paused: true,
      force3D: true
    });

    updateToggle();
    updatePlayback();
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      userHasInteracted = true;
      userPaused = !userPaused;
      updateToggle();
      updatePlayback();
    });
  }

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        updatePlayback();
      },
      { threshold: 0.01 }
    );
    observer.observe(section);
  } else {
    isVisible = true;
  }

  const onVisibilityChange = () => updatePlayback();
  document.addEventListener("visibilitychange", onVisibilityChange);

  const onResize = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(buildAnimation);
  };
  window.addEventListener("resize", onResize, { passive: true });

  if (motionQuery) {
    const onMotionChange = (event) => {
      reduceMotion = event.matches;
      if (reduceMotion && !userHasInteracted) userPaused = true;
      if (!reduceMotion && !userHasInteracted) userPaused = false;
      updateToggle();
      updatePlayback();
    };
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionChange);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener(onMotionChange);
    }
  }

  viewport.setAttribute(
    "aria-label",
    "گالری سه تصویر معماری با حرکت خودکار؛ برای توقف یا ادامه از دکمه کنترل استفاده کنید"
  );

  buildAnimation();
  updateToggle();
  updatePlayback();
})();

// Responsive navigation, independent of all third-party libraries.
(() => {
  const toggle = document.querySelector("#nav-toggle");
  const nav = document.querySelector("#main-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
  }

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!toggle.contains(event.target) && !nav.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) setOpen(false); }, { passive: true });
})();


// Progressive native reveal: never hide content before or after intersection.
// Long page sections and large containers are intentionally excluded so a
// tall services page can never remain invisible because of an intersection threshold.
(() => {
  const reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(
    ".section-heading, .service-tile, .service-accordion, " +
    ".principle-cards > article, .project-card, .showcase-panel, " +
    ".service-detail__copy, .project-list-card__copy, " +
    ".contact-page__intro, .contact-glass-panel, " +
    ".site-footer__column, .site-footer__contact"
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-in");
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.01,
    rootMargin: "0px 0px -18px 0px"
  });

  targets.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", (index % 3) * 45 + "ms");
    observer.observe(item);
  });
})();
