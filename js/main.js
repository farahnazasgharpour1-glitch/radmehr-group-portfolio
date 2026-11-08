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

// Native horizontal gallery with automatic progression and clear pause controls.
(() => {
  const viewport = document.querySelector(".project-showcase__viewport");
  if (!viewport) return;

  const track = viewport.querySelector(".project-showcase__track");
  const panels = track ? Array.from(track.querySelectorAll(".showcase-panel")) : [];
  const toggle = document.querySelector(".project-showcase__autoplay-toggle");
  if (panels.length < 2) {
    if (toggle) toggle.hidden = true;
    return;
  }

  const motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  const reducedMotion = !!(motionQuery && motionQuery.matches);
  let userPaused = reducedMotion;
  let pointerPaused = false;
  let focusPaused = false;
  let userStartedMotion = false;

  function isPaused() {
    return userPaused || pointerPaused || focusPaused || document.hidden;
  }

  function updateToggle() {
    if (!toggle) return;
    const paused = isPaused();
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute("aria-label", paused
      ? "ادامه حرکت خودکار گالری"
      : "توقف حرکت خودکار گالری");
    toggle.textContent = paused ? "ادامه حرکت گالری" : "توقف حرکت گالری";
  }

  function nearestPanelIndex() {
    const viewportLeft = viewport.getBoundingClientRect().left;
    let bestIndex = 0;
    let bestDistance = Infinity;

    panels.forEach((panel, index) => {
      const distance = Math.abs(panel.getBoundingClientRect().left - viewportLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function advanceGallery() {
    if (isPaused()) return;

    const current = nearestPanelIndex();
    const nextIndex = (current + 1) % panels.length;
    const target = panels[nextIndex];
    const left = Math.max(
      0,
      viewport.scrollLeft + target.getBoundingClientRect().left -
        viewport.getBoundingClientRect().left
    );

    viewport.scrollTo({
      left,
      behavior: reducedMotion && !userStartedMotion ? "auto" : "smooth"
    });
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      if (!userPaused) userStartedMotion = true;
      updateToggle();
    });
  }

  viewport.addEventListener("mouseenter", () => {
    pointerPaused = true;
    updateToggle();
  });
  viewport.addEventListener("mouseleave", () => {
    pointerPaused = false;
    updateToggle();
  });
  viewport.addEventListener("focusin", () => {
    focusPaused = true;
    updateToggle();
  });
  viewport.addEventListener("focusout", (event) => {
    focusPaused = viewport.contains(event.relatedTarget);
    updateToggle();
  });
  viewport.addEventListener("touchstart", () => {
    userPaused = true;
    updateToggle();
  }, { passive: true });

  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    userPaused = true;
    updateToggle();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const step = Math.max(180, viewport.clientWidth * 0.65);
    const reduceNow = motionQuery && motionQuery.matches;
    viewport.scrollBy({
      left: direction * step,
      behavior: reduceNow && !userStartedMotion ? "auto" : "smooth"
    });
  });

  if (motionQuery && typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", (event) => {
      if (event.matches && !userStartedMotion) userPaused = true;
      updateToggle();
    });
  } else if (motionQuery && typeof motionQuery.addListener === "function") {
    motionQuery.addListener((event) => {
      if (event.matches && !userStartedMotion) userPaused = true;
      updateToggle();
    });
  }

  document.addEventListener("visibilitychange", updateToggle);
  updateToggle();
  window.setInterval(advanceGallery, 6200);
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
