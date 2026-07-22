const root = document.documentElement;
const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const themeToggle = document.querySelector("[data-theme-toggle]");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    // The theme still works for the current page when storage is unavailable.
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

requestAnimationFrame(() => {
  requestAnimationFrame(() => hero?.classList.add("is-loaded"));
});

let headerFrame = 0;

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
  headerFrame = 0;
};

const requestHeaderUpdate = () => {
  if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader);
};

updateHeader();
window.addEventListener("scroll", requestHeaderUpdate, { passive: true });

const heroVideo = document.querySelector("[data-hero-video]");

const loadHeroVideo = () => {
  if (!heroVideo || motionPreference.matches || navigator.connection?.saveData) return;

  heroVideo.querySelectorAll("source[data-src]").forEach((source) => {
    source.src = source.dataset.src;
  });

  const showVideo = () => heroVideo.classList.add("is-ready");
  heroVideo.addEventListener("playing", showVideo, { once: true });
  heroVideo.addEventListener("canplay", showVideo, { once: true });
  heroVideo.load();

  const playback = heroVideo.play();
  playback?.catch(() => {
    // The optimized poster remains visible if autoplay is unavailable.
  });
};

const videoActivationEvents = ["scroll", "pointerdown", "keydown"];

const activateHeroVideo = () => {
  videoActivationEvents.forEach((eventName) => {
    window.removeEventListener(eventName, activateHeroVideo);
  });
  loadHeroVideo();
};

videoActivationEvents.forEach((eventName) => {
  window.addEventListener(eventName, activateHeroVideo, { passive: true, once: true });
});

const formatStat = (value, decimals) => value.toFixed(decimals).replace(".", ",");

const animateStat = (element) => {
  if (element.dataset.animated === "true") return;
  element.dataset.animated = "true";

  const target = Number(element.dataset.count || 0);
  const decimals = Number(element.dataset.decimals || 0);
  const duration = 1250;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = formatStat(target * eased, decimals);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatStat(target, decimals);
    }
  };

  requestAnimationFrame(tick);
};

const statValues = document.querySelectorAll(".stat-value");

if (motionPreference.matches) {
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
    { threshold: 0.5 }
  );

  statValues.forEach((stat) => statObserver.observe(stat));
} else {
  statValues.forEach(animateStat);
}

const revealItems = document.querySelectorAll(".reveal");

if (motionPreference.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const trajectory = document.querySelector("[data-trajectory]");
const trajectoryLine = document.querySelector("[data-trajectory-line]");
const trajectoryTrain = document.querySelector("[data-trajectory-train]");
const routeStops = Array.from(document.querySelectorAll("[data-route-stop]"));

if (trajectory && trajectoryLine) {
  if (motionPreference.matches) {
    routeStops.forEach((stop) => stop.classList.add("is-active"));
  } else {
    const initTrajectory = () => {
      const pathLength = trajectoryLine.getTotalLength();
      const thresholds = [0.12, 0.47, 0.8];
      let trajectoryFrame = 0;

      trajectoryLine.style.strokeDasharray = `${pathLength}`;

      const renderTrajectory = (progress) => {
        const clamped = Math.min(Math.max(progress, 0), 1);
        trajectoryLine.style.strokeDashoffset = `${pathLength * (1 - clamped)}`;

        if (trajectoryTrain) {
          const point = trajectoryLine.getPointAtLength(pathLength * clamped);
          const nextPoint = trajectoryLine.getPointAtLength(Math.min(pathLength, pathLength * clamped + 3));
          const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
          trajectoryTrain.style.left = `${(point.x / 1200) * 100}%`;
          trajectoryTrain.style.top = `${(point.y / 600) * 100}%`;
          trajectoryTrain.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        }

        routeStops.forEach((stop, index) => {
          stop.classList.toggle("is-active", clamped >= thresholds[index]);
        });
      };

      const updateTrajectory = () => {
        const rect = trajectory.getBoundingClientRect();
        const headerHeight = header?.getBoundingClientRect().height || 0;
        const travel = Math.max(rect.height - window.innerHeight + headerHeight, 1);
        const progress = (headerHeight - rect.top) / travel;
        renderTrajectory(progress);
        trajectoryFrame = 0;
      };

      const requestTrajectoryUpdate = () => {
        if (!trajectoryFrame) trajectoryFrame = requestAnimationFrame(updateTrajectory);
      };

      updateTrajectory();
      window.addEventListener("scroll", requestTrajectoryUpdate, { passive: true });
      window.addEventListener("resize", requestTrajectoryUpdate, { passive: true });
    };

    if ("IntersectionObserver" in window) {
      const trajectoryObserver = new IntersectionObserver(
        (entries, observer) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            initTrajectory();
            observer.disconnect();
          }
        },
        { rootMargin: "50% 0px" }
      );
      trajectoryObserver.observe(trajectory);
    } else {
      initTrajectory();
    }
  }
}
