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

// The gallery remains native horizontal scrolling. Only arrow keys are enhanced;
// vertical wheel input is never cancelled, so the document keeps scrolling naturally.
const galleryViewport = document.querySelector(".project-showcase__viewport");
galleryViewport?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  galleryViewport.scrollBy({ left: direction * Math.max(180, galleryViewport.clientWidth * 0.65), behavior: reduceMotion ? "auto" : "smooth" });
});

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


// Lightweight native reveal motion — no library or CDN.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(
    "main > section, .section-heading, .service-tile, .project-card, .showcase-panel, .content-section > .container, .contact-page__intro, .contact-glass-panel, .site-footer__column, .site-footer__contact"
  );
  if (!targets.length) return;

  targets.forEach((item, index) => {
    item.dataset.reveal = "";
    item.style.setProperty("--reveal-delay", (index % 4) * 75 + "ms");
  });
  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

  targets.forEach((item) => observer.observe(item));
})();
