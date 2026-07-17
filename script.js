const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");

const readTheme = () => {
  try {
    return localStorage.getItem("dream-riders-theme");
  } catch (error) {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem("dream-riders-theme", theme);
  } catch (error) {
    // Theme still switches for the current page even when storage is blocked.
  }
};

const applyTheme = (theme) => {
  root.dataset.theme = theme;
  saveTheme(theme);
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle?.setAttribute(
    "aria-label",
    theme === "dark" ? "Переключить светлую тему" : "Переключить темную тему"
  );
};

applyTheme(readTheme() || root.dataset.theme || "light");

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });


const formatStat = (value, decimals) => {
  return value.toFixed(decimals).replace(".", ",");
};

const animateStat = (element) => {
  if (element.dataset.animated === "true") return;
  element.dataset.animated = "true";

  const target = Number(element.dataset.count || 0);
  const decimals = Number(element.dataset.decimals || 0);
  const duration = 1600;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = target * eased;
    element.textContent = formatStat(current, decimals);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatStat(target, decimals);
    }
  };

  requestAnimationFrame(tick);
};

const statValues = document.querySelectorAll(".stat-value");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  statValues.forEach((stat) => {
    stat.textContent = formatStat(Number(stat.dataset.count || 0), Number(stat.dataset.decimals || 0));
  });
} else if ("IntersectionObserver" in window) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 }
  );

  statValues.forEach((stat) => statObserver.observe(stat));
} else {
  statValues.forEach(animateStat);
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
