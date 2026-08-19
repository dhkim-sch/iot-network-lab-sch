(() => {
  const MOTION_DURATION = 520;
  const MOTION_STAGGER = 75;
  const MOTION_MAX_DELAY = 320;
  const COUNT_DURATION = 700;
  const HERO_EASING = 0.12;
  const HERO_SETTLE_THRESHOLD = 0.001;

  const root = document.documentElement;
  const motionPreference =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const precisePointer =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 821px) and (hover: hover) and (pointer: fine)")
      : null;

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const collectMotionTargets = () => {
    const targets = new Map();

    const addTarget = (element, delay = 0) => {
      if (!element || targets.has(element)) return;
      targets.set(element, clamp(delay, 0, MOTION_MAX_DELAY));
    };

    const addStaggered = (elements, step = MOTION_STAGGER) => {
      [...elements].filter(Boolean).forEach((element, index) => addTarget(element, index * step));
    };

    addStaggered([
      document.querySelector(".hero-content .eyebrow"),
      document.querySelector("#hero-title"),
      document.querySelector(".hero-lead"),
      document.querySelector(".hero-actions"),
      document.querySelector(".notice-board"),
    ]);

    addTarget(document.querySelector(".quick-stats"));
    document.querySelectorAll(".section-heading").forEach((element) => addTarget(element));
    addStaggered(document.querySelectorAll(".about-copy, .lab-profile"));
    addStaggered(document.querySelectorAll(".research-card"));
    addTarget(document.querySelector(".publication-controls"));
    addStaggered(document.querySelectorAll(".publication-section"));
    addTarget(document.querySelector(".professor-card"));

    const currentMembersGrid = document.querySelector(".current-members-grid");
    const currentMembersGroup = currentMembersGrid?.parentElement;
    if (currentMembersGrid && currentMembersGroup) {
      addTarget(currentMembersGroup.querySelector("h3"));
      addStaggered(currentMembersGrid.querySelectorAll(".person-card"));
    }

    const otherMemberGroups = [...document.querySelectorAll(".member-group")].filter(
      (group) => group !== currentMembersGroup
    );
    addStaggered(otherMemberGroups);

    addTarget(document.querySelector(".join-content"));
    addStaggered(document.querySelectorAll(".contact-block"));

    return targets;
  };

  const createCountController = () => {
    const counts = [...document.querySelectorAll("[data-count]")]
      .map((element) => {
        const finalText = element.textContent.trim();
        const finalValue = Number.parseInt(finalText, 10);
        return Number.isFinite(finalValue) ? { element, finalText, finalValue } : null;
      })
      .filter(Boolean);

    let animationFrame;
    let completed = false;
    let visibilityHandler;

    const finish = () => {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      counts.forEach(({ element, finalText }) => {
        element.textContent = finalText;
      });
      completed = true;
      animationFrame = undefined;

      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
        visibilityHandler = undefined;
      }
    };

    const start = () => {
      if (completed || !counts.length) return;
      if (document.hidden) {
        finish();
        return;
      }

      counts.forEach(({ element }) => {
        element.textContent = "0";
      });

      const startedAt = performance.now();
      visibilityHandler = () => {
        if (document.hidden) finish();
      };
      document.addEventListener("visibilitychange", visibilityHandler);

      const tick = (now) => {
        if (completed) return;

        try {
          const progress = Math.min((now - startedAt) / COUNT_DURATION, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          counts.forEach(({ element, finalValue }) => {
            element.textContent = String(Math.round(finalValue * easedProgress));
          });

          if (progress < 1) {
            animationFrame = requestAnimationFrame(tick);
          } else {
            finish();
          }
        } catch {
          finish();
        }
      };

      animationFrame = requestAnimationFrame(tick);
    };

    return { start, finish };
  };

  const createRevealController = (countController) => {
    if (!("IntersectionObserver" in window)) return { destroy: countController.finish };

    const targets = collectMotionTargets();
    if (!targets.size) return { destroy: countController.finish };

    const cleanupCallbacks = new Map();
    const stats = document.querySelector(".quick-stats");
    let observer;

    const resetTarget = (element) => {
      element.classList.remove("motion-reveal", "motion-visible");
      element.style.removeProperty("--motion-delay");
    };

    const scheduleCleanup = (element, delay) => {
      let cleaned = false;
      let timeoutId;

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        clearTimeout(timeoutId);
        element.removeEventListener("transitionend", handleTransitionEnd);
        resetTarget(element);
        cleanupCallbacks.delete(element);
      };

      const handleTransitionEnd = (event) => {
        if (event.target !== element || !["opacity", "transform"].includes(event.propertyName)) return;
        cleanup();
      };

      element.addEventListener("transitionend", handleTransitionEnd);
      timeoutId = window.setTimeout(cleanup, MOTION_DURATION + delay + 140);
      cleanupCallbacks.set(element, cleanup);
    };

    const destroy = () => {
      observer?.disconnect();
      [...cleanupCallbacks.values()].forEach((cleanup) => cleanup());
      targets.forEach((_delay, element) => resetTarget(element));
      countController.finish();
    };

    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const delay = targets.get(entry.target) || 0;
            if (entry.target === stats) countController.start();
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
            scheduleCleanup(entry.target, delay);
          });
        },
        {
          rootMargin: "0px 0px -6% 0px",
          threshold: 0.05,
        }
      );

      targets.forEach((delay, element) => {
        element.classList.add("motion-reveal");
        element.style.setProperty("--motion-delay", `${delay}ms`);
        observer.observe(element);
      });

      return { destroy };
    } catch {
      destroy();
      return { destroy };
    }
  };

  const createHeroController = () => {
    const hero = document.querySelector(".hero");
    if (!hero) return { destroy() {} };

    const entranceFrame = requestAnimationFrame(() => hero.classList.add("hero-network-ready"));
    let frameId;
    let visibilityObserver;
    let interactive = false;
    let heroVisible = false;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let scrollTarget = 0;
    let pointerCurrentX = 0;
    let pointerCurrentY = 0;
    let scrollCurrent = 0;

    const clearFrame = () => {
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      frameId = undefined;
    };

    const writeFrame = () => {
      frameId = undefined;
      if (!heroVisible || document.hidden) return;

      pointerCurrentX += (pointerTargetX - pointerCurrentX) * HERO_EASING;
      pointerCurrentY += (pointerTargetY - pointerCurrentY) * HERO_EASING;
      scrollCurrent += (scrollTarget - scrollCurrent) * HERO_EASING;

      hero.style.setProperty("--hero-pointer-x", pointerCurrentX.toFixed(4));
      hero.style.setProperty("--hero-pointer-y", pointerCurrentY.toFixed(4));
      hero.style.setProperty("--hero-scroll", scrollCurrent.toFixed(4));

      const unsettled =
        Math.abs(pointerTargetX - pointerCurrentX) > HERO_SETTLE_THRESHOLD ||
        Math.abs(pointerTargetY - pointerCurrentY) > HERO_SETTLE_THRESHOLD ||
        Math.abs(scrollTarget - scrollCurrent) > HERO_SETTLE_THRESHOLD;

      if (unsettled) frameId = requestAnimationFrame(writeFrame);
    };

    const scheduleFrame = () => {
      if (frameId === undefined && heroVisible && !document.hidden) {
        frameId = requestAnimationFrame(writeFrame);
      }
    };

    const updateScrollTarget = () => {
      if (!interactive || !heroVisible) return;
      const bounds = hero.getBoundingClientRect();
      scrollTarget = clamp(-bounds.top / Math.max(bounds.height, 1), 0, 1);
      scheduleFrame();
    };

    const handlePointerMove = (event) => {
      const bounds = hero.getBoundingClientRect();
      pointerTargetX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointerTargetY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
      scheduleFrame();
    };

    const handlePointerLeave = () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearFrame();
      } else if (heroVisible) {
        updateScrollTarget();
      }
    };

    const deactivate = () => {
      if (!interactive) return;
      interactive = false;
      heroVisible = false;
      clearFrame();
      visibilityObserver?.disconnect();
      visibilityObserver = undefined;
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScrollTarget);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      hero.classList.remove("hero-interactive");
      hero.style.removeProperty("--hero-pointer-x");
      hero.style.removeProperty("--hero-pointer-y");
      hero.style.removeProperty("--hero-scroll");
      pointerTargetX = 0;
      pointerTargetY = 0;
      scrollTarget = 0;
      pointerCurrentX = 0;
      pointerCurrentY = 0;
      scrollCurrent = 0;
    };

    const activate = () => {
      if (interactive || !("IntersectionObserver" in window) || !precisePointer?.matches) return;
      interactive = true;
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (!interactive) return;
          heroVisible = Boolean(entry?.isIntersecting);
          hero.classList.toggle("hero-interactive", heroVisible);

          if (heroVisible) {
            updateScrollTarget();
          } else {
            clearFrame();
          }
        },
        { threshold: 0 }
      );

      visibilityObserver.observe(hero);
      hero.addEventListener("pointermove", handlePointerMove, { passive: true });
      hero.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("scroll", updateScrollTarget, { passive: true });
      document.addEventListener("visibilitychange", handleVisibilityChange);
    };

    const handlePointerCapabilityChange = (event) => {
      if (event.matches) {
        activate();
      } else {
        deactivate();
      }
    };

    if (precisePointer) {
      if (typeof precisePointer.addEventListener === "function") {
        precisePointer.addEventListener("change", handlePointerCapabilityChange);
      } else if (typeof precisePointer.addListener === "function") {
        precisePointer.addListener(handlePointerCapabilityChange);
      }
    }

    activate();

    const destroy = () => {
      cancelAnimationFrame(entranceFrame);
      deactivate();
      if (precisePointer) {
        if (typeof precisePointer.removeEventListener === "function") {
          precisePointer.removeEventListener("change", handlePointerCapabilityChange);
        } else if (typeof precisePointer.removeListener === "function") {
          precisePointer.removeListener(handlePointerCapabilityChange);
        }
      }
      hero.classList.remove("hero-network-ready");
    };

    return { destroy };
  };

  const initHomepageMotion = () => {
    if (motionPreference?.matches) return;

    const countController = createCountController();
    const revealController = createRevealController(countController);
    const heroController = createHeroController();
    let disabled = false;

    root.classList.add("motion-enabled");

    const removePreferenceListener = () => {
      if (!motionPreference) return;
      if (typeof motionPreference.removeEventListener === "function") {
        motionPreference.removeEventListener("change", handlePreferenceChange);
      } else if (typeof motionPreference.removeListener === "function") {
        motionPreference.removeListener(handlePreferenceChange);
      }
    };

    const disableMotion = () => {
      if (disabled) return;
      disabled = true;
      revealController.destroy();
      heroController.destroy();
      root.classList.remove("motion-enabled");
      removePreferenceListener();
    };

    const handlePreferenceChange = (event) => {
      if (event.matches) disableMotion();
    };

    if (motionPreference) {
      if (typeof motionPreference.addEventListener === "function") {
        motionPreference.addEventListener("change", handlePreferenceChange);
      } else if (typeof motionPreference.addListener === "function") {
        motionPreference.addListener(handlePreferenceChange);
      }
    }
  };

  try {
    initHomepageMotion();
  } catch {
    root.classList.remove("motion-enabled");
    document.querySelectorAll("[data-count]").forEach((element) => {
      if (!element.textContent.trim()) element.textContent = "0";
    });
  }
})();
