(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("radmehr-theme");
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else {
      theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
  } catch (_) {
    // Keep the dark theme when storage or matchMedia is unavailable.
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  var logo = document.querySelector(".brand img[data-light-src][data-dark-src]");
  if (logo) {
    logo.src = theme === "light" ? logo.dataset.lightSrc : logo.dataset.darkSrc;
  }
})();