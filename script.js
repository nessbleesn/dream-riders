import { eventData, formatRubles } from "./event-config.js";

document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const finalSection = document.querySelector(".final-cta");
const ticketDock = document.querySelector("[data-ticket-dock]");
const heroVideo = document.querySelector(".hero-video");
const statValues = document.querySelectorAll(".stat-value");

const fillEventData = () => {
  document.querySelectorAll("[data-ticket-price]").forEach((node) => {
    node.textContent = formatRubles(eventData.price);
  });
  document.querySelectorAll("[data-regular-price]").forEach((node) => {
    node.textContent = formatRubles(eventData.regularPrice);
  });
  document.querySelectorAll("[data-savings]").forEach((node) => {
    node.textContent = formatRubles(eventData.regularPrice - eventData.price);
  });
  document.querySelectorAll("[data-event-date]").forEach((node) => {
    node.textContent = eventData.dateLabel;
  });

  const currentUrl = new URL(window.location.href);
  const ticketUrl = new URL(eventData.ticketUrl);
  eventData.allowedTrackingParams.forEach((name) => {
    const value = currentUrl.searchParams.get(name);
    if (value) ticketUrl.searchParams.set(name, value);
  });

  document.querySelectorAll("[data-ticket-link]").forEach((link) => {
    link.href = ticketUrl.toString();
  });
};

fillEventData();

const setupSalesMeter = () => {
  const meter = document.querySelector("[data-sales-meter]");
  if (!meter) return;

  const total = Math.max(0, Number(eventData.total) || 0);
  const sold = Math.min(total, Math.max(0, Number(eventData.sold) || 0));
  const exactPercent = total > 0 ? (sold / total) * 100 : 0;
  const roundedPercent = exactPercent < 10 ? Math.round(exactPercent * 10) / 10 : Math.round(exactPercent);
  const percentLabel = `${String(roundedPercent).replace(".", ",")}%`;
  const soldLabel = new Intl.NumberFormat("ru-RU").format(sold);
  const totalLabel = new Intl.NumberFormat("ru-RU").format(total);
  const panel = meter.querySelector(".sales-meter-panel");
  const progress = meter.querySelector("[data-sales-progress]");

  meter.querySelectorAll("[data-sales-percent]").forEach((node) => {
    node.textContent = percentLabel;
  });
  panel?.style.setProperty("--sales-ratio", String(exactPercent / 100));
  panel?.style.setProperty("--sales-position", `${exactPercent}%`);
  progress?.setAttribute("aria-valuenow", String(roundedPercent));
  progress?.setAttribute("aria-valuetext", sold === 0 ? "Продажи ещё не начались" : `Продано ${soldLabel} из ${totalLabel} билетов`);

  const fill = () => panel?.classList.add("is-filled");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    fill();
  } else {
    const progressObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        fill();
        progressObserver.disconnect();
      },
      { threshold: 0.45 }
    );
    progressObserver.observe(meter);
  }
};

setupSalesMeter();

const updateStickyUi = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
  if (!ticketDock || !hero) return;

  const pastHero = window.scrollY > hero.offsetHeight * 0.72;
  const beforeFinal = !finalSection || window.scrollY + window.innerHeight < finalSection.offsetTop + 120;
  ticketDock.classList.toggle("is-visible", pastHero && beforeFinal);
};

updateStickyUi();
window.addEventListener("scroll", updateStickyUi, { passive: true });
window.addEventListener("resize", updateStickyUi);

if (heroVideo) {
  const syncHeroVideo = (isInView = true) => {
    if (reducedMotion || document.hidden || !isInView) {
      heroVideo.pause();
    } else {
      heroVideo.play().catch(() => {});
    }
  };

  if ("IntersectionObserver" in window) {
    let videoInView = true;
    const videoObserver = new IntersectionObserver(
      ([entry]) => {
        videoInView = entry.isIntersecting;
        syncHeroVideo(videoInView);
      },
      { threshold: 0.12 }
    );
    videoObserver.observe(heroVideo);
    document.addEventListener("visibilitychange", () => syncHeroVideo(videoInView));
  } else {
    syncHeroVideo();
  }
}

const setupScrollMotion = () => {
  const motionGroups = [
    [".ticker", "up", 0],
    [".sales-meter-heading > *", "up", 100],
    [".sales-meter-panel > *", "up", 90],
    [".section-intro > *", "up", 100],
    [".proof-card", "up", 110],
    [".boomerang-visual", "left", 0],
    [".boomerang-copy > .section-label, .boomerang-copy > h2, .boomerang-copy > .boomerang-lead", "right", 90],
    [".ride-stats > div", "right", 100],
    [".experience-heading > *", "up", 100],
    [".ride-slider-viewport", "scale", 0],
    [".ride-slider-tabs > *, .ride-slider-controls > *", "up", 70],
    [".tickets-heading > *", "up", 100],
    [".ticket-brand, .ticket-date, .ticket-access, .ticket-price", "up", 90],
    [".ticket-stub > *", "right", 70],
    [".visit-heading > *", "up", 100],
    [".visit-card", "up", 100],
    [".faq-heading > *", "up", 90],
    [".faq-list details", "up", 90],
    [".final-copy > .section-label, .final-copy > h2, .final-copy > p, .footer-cta-wrap", "up", 100],
    [".footer > *", "up", 90],
  ];

  motionGroups.forEach(([selector, direction, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.dataset.motion = direction;
      element.style.setProperty("--motion-delay", `${Math.min(index * stagger, 360)}ms`);
    });
  });

  const motionTargets = document.querySelectorAll("[data-motion]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    motionTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("motion-ready");
  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        motionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8%" }
  );

  motionTargets.forEach((element) => motionObserver.observe(element));
};

setupScrollMotion();

const formatStat = (value, decimals) => value.toFixed(decimals).replace(".", ",");

if (!reducedMotion) {
  statValues.forEach((stat) => {
    stat.textContent = formatStat(0, Number(stat.dataset.decimals || 0));
  });
}

const statsGroup = document.querySelector(".ride-stats");

const animateStats = () => {
  if (!statsGroup || statsGroup.dataset.animated === "true") return;
  statsGroup.dataset.animated = "true";
  statsGroup.classList.add("is-accelerating");
  const startedAt = performance.now();
  const duration = 1650;
  const stagger = 150;

  const tick = (now) => {
    let isFinished = true;

    statValues.forEach((element, index) => {
      const target = Number(element.dataset.count || 0);
      const decimals = Number(element.dataset.decimals || 0);
      const elapsed = now - startedAt - (index * stagger);
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = progress < 0.72
        ? 0.82 * Math.pow(progress / 0.72, 2.15)
        : 0.82 + (0.18 * (1 - Math.pow(1 - ((progress - 0.72) / 0.28), 3)));

      element.textContent = formatStat(target * eased, decimals);
      if (progress < 1) isFinished = false;
    });

    if (!isFinished) {
      requestAnimationFrame(tick);
      return;
    }

    statsGroup.classList.remove("is-accelerating");
    statsGroup.classList.add("is-complete");
  };

  requestAnimationFrame(tick);
};

if (reducedMotion || !("IntersectionObserver" in window)) {
  statValues.forEach((stat) => {
    stat.textContent = formatStat(Number(stat.dataset.count || 0), Number(stat.dataset.decimals || 0));
  });
  statsGroup?.classList.add("is-complete");
} else {
  if (statsGroup) {
    const statsObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        animateStats();
        statsObserver.disconnect();
      },
      { threshold: 0.35 }
    );
    statsObserver.observe(statsGroup);
  }
}

const rideSlider = document.querySelector("[data-ride-slider]");

if (rideSlider) {
  const slides = [...rideSlider.querySelectorAll(".ride-slide")];
  const tabs = [...rideSlider.querySelectorAll("[data-slide-go]")];
  const previousButton = rideSlider.querySelector("[data-slider-prev]");
  const nextButton = rideSlider.querySelector("[data-slider-next]");
  const currentLabel = rideSlider.querySelector("[data-slider-current]");
  let activeIndex = 0;
  let autoplayTimer = null;
  let pointerStartX = null;
  let isHovered = false;
  let hasFocus = false;
  let isDragging = false;
  let isInView = true;

  const shouldAutoplay = () => !reducedMotion && !document.hidden && !isHovered && !hasFocus && !isDragging && isInView;

  const scheduleAutoplay = () => {
    window.clearTimeout(autoplayTimer);
    rideSlider.classList.remove("is-playing");
    if (!shouldAutoplay()) return;
    void rideSlider.offsetWidth;
    rideSlider.classList.add("is-playing");
    autoplayTimer = window.setTimeout(() => showSlide(activeIndex + 1), 6000);
  };

  const showSlide = (requestedIndex) => {
    activeIndex = (requestedIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    const activeRide = slides[activeIndex].dataset.ride;
    tabs.forEach((tab) => {
      const matchesRide = slides[Number(tab.dataset.slideGo)].dataset.ride === activeRide;
      tab.classList.toggle("is-active", matchesRide);
      tab.setAttribute("aria-selected", String(matchesRide));
    });

    if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    scheduleAutoplay();
  };

  previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));
  tabs.forEach((tab) => tab.addEventListener("click", () => showSlide(Number(tab.dataset.slideGo))));

  rideSlider.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  rideSlider.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    isDragging = true;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("pointerup", (event) => {
    if (pointerStartX !== null) {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 52) showSlide(activeIndex + (distance < 0 ? 1 : -1));
    }
    pointerStartX = null;
    isDragging = false;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("pointercancel", () => {
    pointerStartX = null;
    isDragging = false;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("mouseenter", () => {
    isHovered = true;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("mouseleave", () => {
    isHovered = false;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("focusin", () => {
    hasFocus = true;
    scheduleAutoplay();
  });

  rideSlider.addEventListener("focusout", (event) => {
    if (event.relatedTarget && rideSlider.contains(event.relatedTarget)) return;
    hasFocus = false;
    scheduleAutoplay();
  });

  document.addEventListener("visibilitychange", scheduleAutoplay);

  if ("IntersectionObserver" in window) {
    const sliderObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        scheduleAutoplay();
      },
      { threshold: 0.2 }
    );
    sliderObserver.observe(rideSlider);
  }

  showSlide(0);
}
