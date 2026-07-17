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
