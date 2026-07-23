import { eventData, formatRubles } from "./event-config.js";

document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-header]");
const ticketbar = document.querySelector("[data-ticketbar]");
const heroVideo = document.querySelector(".hero-video");
const statValues = document.querySelectorAll(".stat-value");

const setupCookieConsent = () => {
  const consent = document.querySelector(".cookie-consent[data-cookie-consent]");
  const acceptButton = consent?.querySelector("[data-cookie-accept]");
  const essentialButton = consent?.querySelector("[data-cookie-essential]");
  const settingsButtons = document.querySelectorAll("[data-cookie-settings]");
  const consentKey = "dr_cookie_consent";
  const consentLifetime = 60 * 60 * 24 * 180;

  if (!consent || !acceptButton || !essentialButton) return;

  const readCookie = () => {
    const prefix = `${consentKey}=`;
    const match = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : "";
  };

  const readStoredChoice = () => {
    const cookieChoice = readCookie();
    if (cookieChoice) return cookieChoice;
    try {
      return window.localStorage.getItem(consentKey) || "";
    } catch {
      return "";
    }
  };

  const showConsent = (moveFocus = false) => {
    document.documentElement.dataset.cookieConsentOpen = "true";
    consent.hidden = false;
    consent.inert = false;
    consent.setAttribute("aria-hidden", "false");
    consent.dataset.state = "visible";
    consent.classList.remove("is-dismissed");
    requestAnimationFrame(() => {
      consent.classList.add("is-visible");
      if (moveFocus) essentialButton.focus();
    });
  };

  const hideConsent = () => {
    delete document.documentElement.dataset.cookieConsentOpen;
    consent.classList.remove("is-visible");
    consent.classList.add("is-dismissed");
    consent.inert = true;
    consent.setAttribute("aria-hidden", "true");
    consent.dataset.state = "dismissed";
  };

  const saveChoice = (choice) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${consentKey}=${encodeURIComponent(choice)}; Max-Age=${consentLifetime}; Path=/; SameSite=Lax${secure}`;
    try {
      window.localStorage.setItem(consentKey, choice);
    } catch {
      // The first-party consent cookie above remains the source of truth.
    }
    document.documentElement.dataset.cookieConsent = choice;
    hideConsent();
    window.dispatchEvent(new CustomEvent("dreamriders:cookie-consent", { detail: { choice } }));
  };

  acceptButton.addEventListener("click", () => saveChoice("accepted"));
  essentialButton.addEventListener("click", () => saveChoice("necessary"));
  settingsButtons.forEach((button) => {
    button.addEventListener("click", () => showConsent(true));
  });
  consent.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    saveChoice("necessary");
  });

  const storedChoice = readStoredChoice();
  if (storedChoice) {
    document.documentElement.dataset.cookieConsent = storedChoice;
    delete document.documentElement.dataset.cookieConsentOpen;
    consent.classList.add("is-dismissed");
    consent.inert = true;
    consent.setAttribute("aria-hidden", "true");
    consent.dataset.state = "dismissed";
  } else {
    window.setTimeout(() => showConsent(false), reducedMotion ? 0 : 450);
  }
};

setupCookieConsent();

const setupKineticBackground = () => {
  const canvas = document.querySelector("[data-kinetic-bg]");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = 0;
  let isVisible = !document.hidden;
  let laneCount = 5;
  let particleCount = 18;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const routeY = (x, lane, time, scrollProgress) => {
    const laneProgress = lane / Math.max(laneCount - 1, 1);
    const base = height * (0.14 + laneProgress * 0.72);
    const amplitude = 24 + laneProgress * 18;
    const wave = Math.sin((x / Math.max(width, 1)) * Math.PI * (2.1 + lane * 0.34) + time * (0.38 + lane * 0.11) + scrollProgress * Math.PI * 2.5);
    return base + wave * amplitude + pointer.y * (13 + lane * 2) + pointer.x * (lane % 2 ? 11 : -11);
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    laneCount = width < 600 ? 4 : 5;
    particleCount = width < 600 ? 12 : 18;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (reducedMotion) draw(0, false);
  };

  const draw = (timestamp, keepAnimating = true) => {
    const time = timestamp * 0.001;
    const maxScroll = Math.max(document.documentElement.scrollHeight - height, 1);
    const scrollProgress = Math.min(window.scrollY / maxScroll, 1);

    pointer.x += (pointer.targetX - pointer.x) * 0.045;
    pointer.y += (pointer.targetY - pointer.y) * 0.045;
    context.clearRect(0, 0, width, height);

    for (let lane = 0; lane < laneCount; lane += 1) {
      context.beginPath();
      for (let x = -24; x <= width + 24; x += 24) {
        const y = routeY(x, lane, time, scrollProgress);
        if (x === -24) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(49, 175, 227, ${0.18 + lane * 0.018})`;
      context.lineWidth = lane === 1 ? 2.5 : 1.55;
      context.stroke();
    }

    for (let index = 0; index < particleCount; index += 1) {
      const lane = index % laneCount;
      const speed = 0.018 + lane * 0.004;
      const phase = (time * speed + index * 0.091 + scrollProgress * (0.2 + lane * 0.04)) % 1;
      const x = phase * (width + 80) - 40;
      const y = routeY(x, lane, time, scrollProgress);
      const radius = index % 3 === 0 ? 4.5 : 2.4;

      context.beginPath();
      context.moveTo(x - 20, y);
      context.lineTo(x - 7, y);
      context.strokeStyle = "rgba(49, 175, 227, 0.42)";
      context.lineWidth = 1.7;
      context.stroke();

      context.beginPath();
      context.arc(x, y, radius + 4, 0, Math.PI * 2);
      context.fillStyle = "rgba(118, 207, 243, 0.14)";
      context.fill();

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = index % 3 === 0 ? "rgba(49, 175, 227, 0.88)" : "rgba(118, 207, 243, 0.68)";
      context.fill();
    }

    if (keepAnimating && isVisible) animationFrame = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (finePointer && !reducedMotion) {
    window.addEventListener("pointermove", (event) => {
      pointer.targetX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
      pointer.targetY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
    }, { passive: true });
  }

  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", () => {
      isVisible = !document.hidden;
      cancelAnimationFrame(animationFrame);
      if (isVisible) animationFrame = requestAnimationFrame(draw);
    });
  }
};

const setupTiltCards = () => {
  if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    let frame = 0;
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty("--tilt-x", `${(-y * 4.5).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 4.5).toFixed(2)}deg`);
      });
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
};

setupKineticBackground();
setupTiltCards();

const getTrackedTicketUrl = (url) => {
  const currentUrl = new URL(window.location.href);
  const ticketUrl = new URL(url);
  eventData.allowedTrackingParams.forEach((name) => {
    const value = currentUrl.searchParams.get(name);
    if (value) ticketUrl.searchParams.set(name, value);
  });
  return ticketUrl.toString();
};

const fillEventData = () => {
  document.querySelectorAll("[data-ticket-price]").forEach((node) => {
    node.textContent = formatRubles(eventData.price);
  });
  document.querySelectorAll("[data-regular-price]").forEach((node) => {
    node.textContent = formatRubles(eventData.regularPrice);
  });
  document.querySelectorAll("[data-event-date]").forEach((node) => {
    node.textContent = eventData.dateLabel;
  });
  document.querySelectorAll("[data-event-address]").forEach((node) => {
    node.textContent = eventData.address.replace(/^Москва,\s*/u, "");
  });

  document.querySelectorAll("[data-ticket-link]").forEach((link) => {
    link.href = getTrackedTicketUrl(eventData.ticketUrl);
  });
};

fillEventData();

const setupTicketHeader = () => {
  if (!ticketbar) return;

  const dateNode = ticketbar.querySelector("[data-ticket-date]");
  const priceNode = ticketbar.querySelector("[data-ticketbar-price]");
  const statusNode = ticketbar.querySelector("[data-ticketbar-status]");
  const cta = ticketbar.querySelector("[data-ticketbar-cta]");
  const dates = Array.isArray(eventData.dates) ? eventData.dates : [];
  const saleStates = {
    open: { label: "Продажа открыта", ctaLabel: "Купить билет", disabled: false },
    limited: { label: "Осталось мало билетов", ctaLabel: "Купить билет", disabled: false },
    sold_out: { label: "Билеты закончились", ctaLabel: "Билеты закончились", disabled: true },
    coming_soon: { label: "Продажи скоро", ctaLabel: "Продажи скоро", disabled: true },
  };

  if (!dateNode || !priceNode || !statusNode || !cta || dates.length === 0) return;

  const applyDate = (date) => {
    const saleState = saleStates[date.saleStatus] || saleStates.coming_soon;
    const ticketUrl = getTrackedTicketUrl(date.ticketUrl);

    priceNode.textContent = formatRubles(date.price);
    statusNode.textContent = saleState.label;
    ticketbar.dataset.saleStatus = date.saleStatus;
    cta.textContent = saleState.ctaLabel;

    document.querySelectorAll("[data-ticket-price]").forEach((node) => {
      node.textContent = formatRubles(date.price);
    });
    document.querySelectorAll("[data-event-date]").forEach((node) => {
      node.textContent = date.compactLabel;
    });
    document.querySelectorAll("[data-ticket-link], [data-ticketbar-cta]").forEach((link) => {
      link.setAttribute("aria-disabled", String(saleState.disabled));
      if (saleState.disabled) {
        link.removeAttribute("href");
        link.setAttribute("tabindex", "-1");
      } else {
        link.href = ticketUrl;
        link.removeAttribute("tabindex");
      }
    });
  };

  const defaultDate = dates.find((date) => date.id === eventData.defaultDateId) || dates[0];
  dateNode.textContent = defaultDate.label;
  dateNode.setAttribute("datetime", defaultDate.id);
  applyDate(defaultDate);
};

const setupHeaderMetrics = () => {
  if (!header || !ticketbar) return;

  const sync = () => {
    document.documentElement.style.setProperty("--topbar-h", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    document.documentElement.style.setProperty("--ticketbar-h", `${Math.ceil(ticketbar.getBoundingClientRect().height)}px`);
  };

  sync();
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(header);
    resizeObserver.observe(ticketbar);
  } else {
    window.addEventListener("resize", sync, { passive: true });
  }
};

setupTicketHeader();
setupHeaderMetrics();

const setupSalesMeter = () => {
  const meter = document.querySelector("[data-sales-meter]");
  if (!meter) return;

  const panel = meter.querySelector(".sales-meter-panel");
  const progress = meter.querySelector("[data-sales-progress]");

  const render = (sales) => {
    const total = Math.max(0, Number(sales.total) || 0);
    const sold = Math.min(total, Math.max(0, Number(sales.sold) || 0));
    const exactPercent = total > 0 ? (sold / total) * 100 : 0;
    const roundedPercent = exactPercent < 10 ? Math.round(exactPercent * 10) / 10 : Math.round(exactPercent);
    const percentLabel = `${String(roundedPercent).replace(".", ",")}%`;
    const soldLabel = new Intl.NumberFormat("ru-RU").format(sold);
    const totalLabel = new Intl.NumberFormat("ru-RU").format(total);

    meter.querySelectorAll("[data-sales-percent]").forEach((node) => {
      node.textContent = percentLabel;
    });
    panel?.style.setProperty("--sales-ratio", String(exactPercent / 100));
    panel?.style.setProperty("--sales-position", `${exactPercent}%`);
    progress?.setAttribute("aria-valuenow", String(roundedPercent));
    progress?.setAttribute("aria-valuetext", sold === 0 ? "Продажи ещё не начались" : `Продано ${soldLabel} из ${totalLabel} билетов`);
  };

  render({ sold: eventData.sold, total: eventData.total });

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

  const refreshSales = async () => {
    if (!eventData.salesEndpoint) return;

    try {
      const response = await fetch(new URL(eventData.salesEndpoint, window.location.href), {
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;

      const sales = await response.json();
      if (!Number.isFinite(Number(sales?.sold)) || !Number.isFinite(Number(sales?.total))) return;
      render(sales);
    } catch {
      // Keep the last confirmed values from event-config.js when the sales source is unavailable.
    }
  };

  refreshSales();
  if (eventData.salesEndpoint && Number(eventData.salesRefreshMs) > 0) {
    window.setInterval(refreshSales, Number(eventData.salesRefreshMs));
  }
};

setupSalesMeter();

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
    [".boomerang-visual", "left", 0],
    [".boomerang-copy > .section-label, .boomerang-copy > h2, .boomerang-copy > .boomerang-lead", "right", 90],
    [".ride-stats > div", "right", 100],
    [".experience-heading > *", "up", 100],
    [".ride-slider-viewport", "scale", 0],
    [".ride-slider-tabs > *, .ride-slider-controls > *", "up", 70],
    [".tickets-heading > *", "up", 100],
    [".ticket-presenter, .ticket-brand strong, .ticket-meta > *", "up", 90],
    [".ticket-stub > *", "right", 70],
    [".location-strip > *", "up", 90],
    [".faq-heading > *", "up", 90],
    [".faq-list details", "up", 90],
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
  const sliderViewport = rideSlider.querySelector(".ride-slider-viewport");
  const previousButton = rideSlider.querySelector("[data-slider-prev]");
  const nextButton = rideSlider.querySelector("[data-slider-next]");
  const currentLabel = rideSlider.querySelector("[data-slider-current]");
  let activeIndex = 0;
  let autoplayTimer = null;
  let pointerStartX = null;
  let pointerStartY = null;
  let activePointerId = null;
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

  const resetPointer = () => {
    pointerStartX = null;
    pointerStartY = null;
    activePointerId = null;
    isDragging = false;
    sliderViewport?.classList.remove("is-dragging");
    scheduleAutoplay();
  };

  sliderViewport?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    activePointerId = event.pointerId;
    isDragging = true;
    sliderViewport.classList.add("is-dragging");
    sliderViewport.setPointerCapture?.(event.pointerId);
    scheduleAutoplay();
  });

  sliderViewport?.addEventListener("pointerup", (event) => {
    if (pointerStartX !== null && pointerStartY !== null && event.pointerId === activePointerId) {
      const distanceX = event.clientX - pointerStartX;
      const distanceY = event.clientY - pointerStartY;
      if (Math.abs(distanceX) > 44 && Math.abs(distanceX) > Math.abs(distanceY) * 1.15) {
        showSlide(activeIndex + (distanceX < 0 ? 1 : -1));
      }
    }
    if (sliderViewport.hasPointerCapture?.(event.pointerId)) sliderViewport.releasePointerCapture(event.pointerId);
    resetPointer();
  });

  sliderViewport?.addEventListener("pointercancel", resetPointer);

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
