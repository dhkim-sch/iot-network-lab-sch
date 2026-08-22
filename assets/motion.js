(() => {
  const MOTION_DURATION = 520;
  const MOTION_STAGGER = 75;
  const MOTION_MAX_DELAY = 320;
  const COUNT_DURATION = 700;
  const HERO_EASING = 0.12;
  const HERO_SETTLE_THRESHOLD = 0.001;
  const JOURNEY_STAGGER = 70;
  const JOURNEY_MAX_DELAY = 280;
  const JOURNEY_ACTIVE_LINE = 0.58;
  const JOURNEY_PULSE_DURATION = 420;
  const SCENE_ALIGN_DURATION = 160;
  const CARD_RESET_DURATION = 220;
  const JOURNEY_IDS = ["about", "research", "publications", "members", "join", "contact"];

  const root = document.documentElement;
  const motionPreference =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const precisePointer =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 821px) and (hover: hover) and (pointer: fine)")
      : null;
  const journeyDesktop =
    typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 821px)") : null;

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
  const resolveActiveCheckpoint = (checkpoints, activationY) => {
    if (!checkpoints.length) return null;

    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    if (activationY >= lastCheckpoint.documentY) return lastCheckpoint.id;

    const nearest = checkpoints.reduce((closest, checkpoint) => {
      const distance = Math.abs(checkpoint.documentY - activationY);
      return !closest || distance < closest.distance ? { checkpoint, distance } : closest;
    }, null);
    const maximumDistance = Math.max(120, window.innerHeight * 0.28);
    return nearest && nearest.distance <= maximumDistance ? nearest.checkpoint.id : null;
  };
  const safelyNotify = (callback, value) => {
    if (typeof callback !== "function") return;
    try {
      callback(value);
    } catch {
      // Optional enhancement callbacks must not affect the owning controller.
    }
  };

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
    addStaggered(document.querySelectorAll(".publication-section"));

    const currentMembersGrid = document.querySelector(".current-members-grid");
    const currentMembersGroup = currentMembersGrid?.parentElement;
    const otherMemberGroups = [...document.querySelectorAll(".member-group")].filter(
      (group) => group !== currentMembersGroup
    );
    addStaggered(otherMemberGroups);

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

  const createSceneController = ({ reduced = false } = {}) => {
    const main = document.querySelector("main#home");
    const ambient = document.querySelector("[data-scene-ambient]");
    const emptyController = {
      setActive() {},
      setGeometry() {},
      destroy() {},
    };

    if (reduced || !main || !ambient || !journeyDesktop) return emptyController;

    const groups = JOURNEY_IDS.map((id) => {
      const checkpoint = document.querySelector(
        '[data-journey-checkpoint="' + id + '"]'
      );
      const section = checkpoint?.closest("section");
      return checkpoint && section ? { id, checkpoint, section } : null;
    }).filter(Boolean);

    if (!groups.length) return emptyController;

    let geometry;
    let activeId = null;
    let renderedId = null;
    let initialized = false;
    let destroyed = false;
    let transitionFrame;
    let alignTimer;
    let fallbackFrame;
    let fallbackResizeObserver;
    let fallbackActive = false;
    let fallbackGeometryDirty = true;

    const pageScrollY = () => window.scrollY || window.pageYOffset || 0;
    const formatCoordinate = (value) => Number(value.toFixed(2)) + "px";

    const clearTransitionFrame = () => {
      if (transitionFrame !== undefined) cancelAnimationFrame(transitionFrame);
      transitionFrame = undefined;
    };

    const clearAlignTimer = () => {
      if (alignTimer !== undefined) window.clearTimeout(alignTimer);
      alignTimer = undefined;
      ambient.classList.remove("scene-aligning");
    };

    const hideScene = () => {
      clearTransitionFrame();
      clearAlignTimer();
      ambient.classList.remove("scene-ready");
      main.removeAttribute("data-active-scene");
      renderedId = null;
    };

    const writeScene = () => {
      if (destroyed || !activeId || !geometry) {
        hideScene();
        return;
      }

      const checkpoint = geometry.checkpoints.find(({ id }) => id === activeId);
      if (!checkpoint) {
        hideScene();
        return;
      }

      const top = Math.max(checkpoint.sceneTop, 0);
      const height = Math.max(checkpoint.sceneEnd - top, 160);
      const sameScene = renderedId === activeId;
      const placeBeforeReveal = !initialized || renderedId === null;

      clearAlignTimer();
      if (initialized && sameScene) {
        ambient.classList.add("scene-aligning");
        alignTimer = window.setTimeout(() => {
          ambient.classList.remove("scene-aligning");
          alignTimer = undefined;
        }, SCENE_ALIGN_DURATION + 40);
      }

      if (placeBeforeReveal) {
        clearTransitionFrame();
        ambient.classList.remove("scene-ready", "scene-animated");
      }

      ambient.style.setProperty("--scene-top", formatCoordinate(top));
      ambient.style.setProperty("--scene-height", formatCoordinate(height));
      main.dataset.activeScene = activeId;
      renderedId = activeId;

      if (placeBeforeReveal) {
        initialized = true;
        transitionFrame = requestAnimationFrame(() => {
          ambient.classList.add("scene-animated");
          transitionFrame = requestAnimationFrame(() => {
            ambient.classList.add("scene-ready");
            transitionFrame = undefined;
          });
        });
      } else {
        ambient.classList.add("scene-ready");
      }
    };

    const applyGeometry = (nextGeometry) => {
      if (
        !nextGeometry ||
        !Array.isArray(nextGeometry.checkpoints) ||
        !nextGeometry.checkpoints.length
      ) {
        geometry = undefined;
        hideScene();
        return;
      }

      geometry = nextGeometry;
      if (activeId) writeScene();
    };

    const applyActive = (nextId) => {
      const validId = JOURNEY_IDS.includes(nextId) ? nextId : null;
      if (validId === activeId) return;
      activeId = validId;
      writeScene();
    };

    const measureFallbackGeometry = () => {
      const scrollY = pageScrollY();
      const mainBounds = main.getBoundingClientRect();
      const mainDocumentTop = mainBounds.top + scrollY;
      const mainHeight = Math.max(main.scrollHeight, mainBounds.height, 1);
      const publicationControls = document.querySelector(".publication-controls");
      const publicationControlsBounds = publicationControls?.getBoundingClientRect();
      const publicationListBounds = document
        .querySelector("#publication-list")
        ?.getBoundingClientRect();
      const membersSection = document.querySelector("#members");
      const professorBounds = membersSection
        ?.querySelector(".professor-card")
        ?.getBoundingClientRect();
      const currentMembersGrid = membersSection?.querySelector(".current-members-grid");
      const currentMembersGroup = currentMembersGrid?.closest(".member-group");
      const currentMembersBounds = currentMembersGroup?.getBoundingClientRect();

      const checkpoints = groups.map(({ id, checkpoint, section }) => {
        const kicker = checkpoint.querySelector(".section-kicker") || checkpoint;
        const kickerBounds = kicker.getBoundingClientRect();
        const sectionBounds = section.getBoundingClientRect();
        const sceneTop = sectionBounds.top + scrollY - mainDocumentTop;
        const sectionEnd = sectionBounds.bottom + scrollY - mainDocumentTop;
        let sceneEnd = sectionEnd;

        if (id === "publications" && publicationControlsBounds) {
          sceneEnd = Math.min(
            sectionEnd,
            publicationControlsBounds.bottom + scrollY - mainDocumentTop + 36,
            publicationListBounds
              ? publicationListBounds.top + scrollY - mainDocumentTop - 10
              : sectionEnd
          );
        }

        if (id === "members") {
          const memberContentEnd = Math.max(
            professorBounds ? professorBounds.bottom + scrollY - mainDocumentTop : sceneTop,
            currentMembersBounds
              ? currentMembersBounds.bottom + scrollY - mainDocumentTop
              : sceneTop
          );
          sceneEnd = Math.min(sectionEnd, memberContentEnd + 36);
        }

        return {
          id,
          documentY: kickerBounds.top + scrollY + kickerBounds.height / 2,
          sceneTop,
          sceneEnd: clamp(Math.max(sceneEnd, sceneTop + 160), sceneTop + 160, mainHeight),
          side: checkpoint.dataset.journeySide === "right" ? "right" : "left",
        };
      });

      return { mainDocumentTop, mainHeight, checkpoints };
    };

    const stopFallbackFrame = () => {
      if (fallbackFrame !== undefined) cancelAnimationFrame(fallbackFrame);
      fallbackFrame = undefined;
    };

    const runFallbackFrame = () => {
      fallbackFrame = undefined;
      if (!fallbackActive || document.hidden) return;

      try {
        const geometryChanged = fallbackGeometryDirty || !geometry;
        if (geometryChanged) {
          geometry = measureFallbackGeometry();
          fallbackGeometryDirty = false;
        }

        const activationY = pageScrollY() + window.innerHeight * JOURNEY_ACTIVE_LINE;
        const nextId = resolveActiveCheckpoint(geometry.checkpoints, activationY);
        const sceneChanged = nextId !== activeId;
        activeId = nextId;

        if (sceneChanged || geometryChanged) writeScene();
      } catch {
        stopFallback();
        hideScene();
      }
    };

    const scheduleFallbackFrame = () => {
      if (fallbackFrame === undefined && fallbackActive && !document.hidden) {
        fallbackFrame = requestAnimationFrame(runFallbackFrame);
      }
    };

    const markFallbackGeometryDirty = () => {
      fallbackGeometryDirty = true;
      scheduleFallbackFrame();
    };

    const handleFallbackVisibility = () => {
      if (document.hidden) {
        stopFallbackFrame();
      } else {
        scheduleFallbackFrame();
      }
    };

    function stopFallback(clear = true) {
      if (fallbackActive) {
        fallbackActive = false;
        stopFallbackFrame();
        fallbackResizeObserver?.disconnect();
        fallbackResizeObserver = undefined;
        window.removeEventListener("scroll", scheduleFallbackFrame);
        window.removeEventListener("resize", markFallbackGeometryDirty);
        window.removeEventListener("load", markFallbackGeometryDirty);
        document.removeEventListener("visibilitychange", handleFallbackVisibility);
      }

      if (clear) {
        geometry = undefined;
        activeId = null;
        hideScene();
      }
    }

    const startFallback = () => {
      if (
        fallbackActive ||
        destroyed ||
        typeof window.IntersectionObserver !== "function"
      ) {
        return;
      }

      fallbackActive = true;
      fallbackGeometryDirty = true;
      window.addEventListener("scroll", scheduleFallbackFrame, { passive: true });
      window.addEventListener("resize", markFallbackGeometryDirty, { passive: true });
      if (document.readyState !== "complete") {
        window.addEventListener("load", markFallbackGeometryDirty);
      }
      document.addEventListener("visibilitychange", handleFallbackVisibility);

      if (typeof window.ResizeObserver === "function") {
        try {
          fallbackResizeObserver = new ResizeObserver(markFallbackGeometryDirty);
          const observedElements = new Set([
            main,
            document.querySelector("#publication-list"),
            ...groups.map(({ section }) => section),
          ]);
          observedElements.forEach((element) => {
            if (element) fallbackResizeObserver.observe(element);
          });
        } catch {
          fallbackResizeObserver?.disconnect();
          fallbackResizeObserver = undefined;
        }
      }

      scheduleFallbackFrame();
    };

    const handleDesktopChange = (event) => {
      if (event.matches) {
        stopFallback();
      } else {
        startFallback();
      }
    };

    if (typeof journeyDesktop.addEventListener === "function") {
      journeyDesktop.addEventListener("change", handleDesktopChange);
    } else if (typeof journeyDesktop.addListener === "function") {
      journeyDesktop.addListener(handleDesktopChange);
    }

    if (journeyDesktop.matches) {
      hideScene();
    } else {
      startFallback();
    }

    const setGeometry = (nextGeometry) => {
      if (destroyed || !journeyDesktop.matches) return;
      applyGeometry(nextGeometry);
    };

    const setActive = (nextId) => {
      if (destroyed || !journeyDesktop.matches) return;
      applyActive(nextId);
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      stopFallback();
      clearTransitionFrame();
      clearAlignTimer();
      if (typeof journeyDesktop.removeEventListener === "function") {
        journeyDesktop.removeEventListener("change", handleDesktopChange);
      } else if (typeof journeyDesktop.removeListener === "function") {
        journeyDesktop.removeListener(handleDesktopChange);
      }
      ambient.classList.remove("scene-ready", "scene-animated", "scene-aligning");
      ambient.style.removeProperty("--scene-top");
      ambient.style.removeProperty("--scene-height");
      main.removeAttribute("data-active-scene");
    };

    return { setActive, setGeometry, destroy };
  };

  const createCardController = () => {
    const targetElements = [
      ...document.querySelectorAll(
        ".research-card, .lab-profile, .professor-card, " +
          ".current-members-grid .person-card, .contact-block"
      ),
    ];
    const emptyController = { destroy() {} };
    if (!targetElements.length || !precisePointer) return emptyController;

    const targets = new Map(
      targetElements.map((element) => [
        element,
        { maximumTilt: element.classList.contains("research-card") ? 2 : 1.2 },
      ])
    );
    const handlers = new Map();
    const resetTimers = new Map();
    let activeCard;
    let activeBounds;
    let boundsDirty = true;
    let pointerX = 0;
    let pointerY = 0;
    let animationFrame;
    let visibilityObserver;
    let interactive = false;

    const clearFrame = () => {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    };

    const removeCardProperties = (card) => {
      card.style.removeProperty("--card-spot-x");
      card.style.removeProperty("--card-spot-y");
      card.style.removeProperty("--card-tilt-x");
      card.style.removeProperty("--card-tilt-y");
    };

    const cancelResetTimer = (card) => {
      const timer = resetTimers.get(card);
      if (timer !== undefined) window.clearTimeout(timer);
      resetTimers.delete(card);
    };

    const resetCard = (card, immediate = false) => {
      if (!card) return;
      cancelResetTimer(card);
      card.classList.remove("card-active");
      card.style.setProperty("--card-spot-x", "50%");
      card.style.setProperty("--card-spot-y", "50%");
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");

      if (immediate) {
        removeCardProperties(card);
      } else {
        const timer = window.setTimeout(() => {
          removeCardProperties(card);
          resetTimers.delete(card);
        }, CARD_RESET_DURATION);
        resetTimers.set(card, timer);
      }

      if (activeCard === card) {
        clearFrame();
        activeCard = undefined;
        activeBounds = undefined;
        boundsDirty = true;
      }
    };

    const writeCardFrame = () => {
      animationFrame = undefined;
      if (!activeCard || !activeBounds || document.hidden) return;

      const { maximumTilt } = targets.get(activeCard);
      const normalizedX = clamp(
        (pointerX - activeBounds.left) / Math.max(activeBounds.width, 1),
        0,
        1
      );
      const normalizedY = clamp(
        (pointerY - activeBounds.top) / Math.max(activeBounds.height, 1),
        0,
        1
      );
      const rotateX = (0.5 - normalizedY) * maximumTilt * 2;
      const rotateY = (normalizedX - 0.5) * maximumTilt * 2;

      activeCard.style.setProperty(
        "--card-spot-x",
        (normalizedX * 100).toFixed(1) + "%"
      );
      activeCard.style.setProperty(
        "--card-spot-y",
        (normalizedY * 100).toFixed(1) + "%"
      );
      activeCard.style.setProperty("--card-tilt-x", rotateX.toFixed(3) + "deg");
      activeCard.style.setProperty("--card-tilt-y", rotateY.toFixed(3) + "deg");
    };

    const scheduleCardFrame = () => {
      if (animationFrame === undefined && activeCard && !document.hidden) {
        animationFrame = requestAnimationFrame(writeCardFrame);
      }
    };

    const updatePointer = (event) => {
      if (!activeCard) return;
      if (boundsDirty || !activeBounds) {
        activeBounds = activeCard.getBoundingClientRect();
        boundsDirty = false;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleCardFrame();
    };

    const markBoundsDirty = () => {
      if (activeCard) boundsDirty = true;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && activeCard) resetCard(activeCard, true);
    };

    const activate = () => {
      if (
        interactive ||
        !precisePointer.matches ||
        typeof window.IntersectionObserver !== "function"
      ) {
        return;
      }

      interactive = true;
      visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.target === activeCard) {
            resetCard(activeCard, true);
          }
        });
      });

      targets.forEach((_config, card) => {
        const handlePointerEnter = (event) => {
          if (activeCard && activeCard !== card) resetCard(activeCard);
          cancelResetTimer(card);
          activeCard = card;
          activeBounds = card.getBoundingClientRect();
          boundsDirty = false;
          card.classList.add("card-active");
          updatePointer(event);
        };
        const handlePointerMove = (event) => {
          if (activeCard !== card) return;
          updatePointer(event);
        };
        const handlePointerLeave = () => {
          if (activeCard === card) resetCard(card);
        };

        handlers.set(card, { handlePointerEnter, handlePointerMove, handlePointerLeave });
        card.classList.add("card-interactive");
        card.addEventListener("pointerenter", handlePointerEnter, { passive: true });
        card.addEventListener("pointermove", handlePointerMove, { passive: true });
        card.addEventListener("pointerleave", handlePointerLeave);
        card.addEventListener("pointercancel", handlePointerLeave);
        visibilityObserver.observe(card);
      });

      window.addEventListener("scroll", markBoundsDirty, { passive: true });
      window.addEventListener("resize", markBoundsDirty, { passive: true });
      document.addEventListener("visibilitychange", handleVisibilityChange);
    };

    const deactivate = () => {
      if (!interactive) return;
      interactive = false;
      clearFrame();
      visibilityObserver?.disconnect();
      visibilityObserver = undefined;
      window.removeEventListener("scroll", markBoundsDirty);
      window.removeEventListener("resize", markBoundsDirty);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      targets.forEach((_config, card) => {
        const cardHandlers = handlers.get(card);
        if (cardHandlers) {
          card.removeEventListener("pointerenter", cardHandlers.handlePointerEnter);
          card.removeEventListener("pointermove", cardHandlers.handlePointerMove);
          card.removeEventListener("pointerleave", cardHandlers.handlePointerLeave);
          card.removeEventListener("pointercancel", cardHandlers.handlePointerLeave);
        }
        cancelResetTimer(card);
        card.classList.remove("card-interactive", "card-active");
        removeCardProperties(card);
      });

      handlers.clear();
      activeCard = undefined;
      activeBounds = undefined;
      boundsDirty = true;
    };

    const handlePointerCapabilityChange = (event) => {
      if (event.matches) {
        activate();
      } else {
        deactivate();
      }
    };

    if (typeof precisePointer.addEventListener === "function") {
      precisePointer.addEventListener("change", handlePointerCapabilityChange);
    } else if (typeof precisePointer.addListener === "function") {
      precisePointer.addListener(handlePointerCapabilityChange);
    }

    activate();

    const destroy = () => {
      deactivate();
      if (typeof precisePointer.removeEventListener === "function") {
        precisePointer.removeEventListener("change", handlePointerCapabilityChange);
      } else if (typeof precisePointer.removeListener === "function") {
        precisePointer.removeListener(handlePointerCapabilityChange);
      }
    };

    return { destroy };
  };

  const createJourneyController = ({
    reduced = false,
    onActiveChange,
    onGeometryChange,
  } = {}) => {
    const main = document.querySelector("main#home");
    const checkpointElements = new Map(
      JOURNEY_IDS.map((id) => [id, document.querySelector(`[data-journey-checkpoint="${id}"]`)])
    );
    const nodeElements = new Map(
      JOURNEY_IDS.map((id) => [id, document.querySelector(`[data-journey-node="${id}"]`)])
    );
    const segmentDefinitions = [
      { name: "primary", ids: ["about", "research", "publications"] },
      { name: "secondary", ids: ["members", "join", "contact"] },
    ].map((definition) => {
      const element = document.querySelector(`[data-journey-segment="${definition.name}"]`);
      return {
        ...definition,
        element,
        track: element?.querySelector(".journey-track"),
        progress: element?.querySelector(".journey-progress"),
        startDocumentY: 0,
        endDocumentY: 0,
        valid: false,
      };
    });

    if (!main) return { reduce() {}, destroy() {} };

    const getGroupContent = (id, section) => {
      if (!section) return [];

      if (id === "about") {
        return [section.querySelector(".about-copy"), section.querySelector(".lab-profile")];
      }

      if (id === "research") return [...section.querySelectorAll(".research-card")];
      if (id === "publications") return [section.querySelector(".publication-controls")];

      if (id === "members") {
        const currentMembersGrid = section.querySelector(".current-members-grid");
        const currentMembersGroup = currentMembersGrid?.parentElement;
        return [
          section.querySelector(".professor-card"),
          currentMembersGroup?.querySelector("h3"),
          ...(currentMembersGrid ? [...currentMembersGrid.querySelectorAll(".person-card")] : []),
        ];
      }

      if (id === "contact") return [...section.querySelectorAll(".contact-block")];
      return [];
    };

    const groups = JOURNEY_IDS.map((id) => {
      const checkpoint = checkpointElements.get(id);
      const section = checkpoint?.closest("section");
      if (!checkpoint || !section) return null;
      const side = checkpoint.dataset.journeySide === "right" ? "right" : "left";
      const content = getGroupContent(id, section).filter(Boolean);
      let contentIndex = 0;
      const targets = [checkpoint, ...content].map((element, index) => {
        if (index === 0) return { element, type: "title", delay: 0 };

        const directionOffset = side === "right" ? 1 : 0;
        const direction = (contentIndex + directionOffset) % 2 === 0 ? "left" : "right";
        contentIndex += 1;
        return {
          element,
          type: direction,
          delay: Math.min(contentIndex * JOURNEY_STAGGER, JOURNEY_MAX_DELAY),
        };
      });

      return { id, checkpoint, section, targets, revealed: false };
    }).filter(Boolean);

    if (!groups.length) return { reduce() {}, destroy() {} };

    const entryElement =
      document.querySelector("[data-journey-entry] .hero-scroll-line") ||
      document.querySelector("[data-journey-entry]");
    segmentDefinitions.forEach((segment) => {
      segment.valid = Boolean(
        segment.element &&
          segment.track &&
          segment.progress &&
          (segment.name !== "primary" || entryElement) &&
          segment.ids.every((id) => {
            const node = nodeElements.get(id);
            return (
              checkpointElements.get(id) &&
              node &&
              segment.element.contains(node) &&
              groups.some((group) => group.id === id)
            );
          })
      );
    });

    let revealObserver;
    const revealCleanupTimers = new Map();
    const pulseTimers = new Map();
    const intersectionSupported = typeof window.IntersectionObserver === "function";

    const resetRevealTarget = (element) => {
      element.classList.remove(
        "journey-reveal",
        "journey-visible",
        "journey-title",
        "journey-from-left",
        "journey-from-right"
      );
      element.style.removeProperty("--journey-delay");
    };

    const cleanupRevealTarget = (element) => {
      const timer = revealCleanupTimers.get(element);
      if (timer !== undefined) window.clearTimeout(timer);
      revealCleanupTimers.delete(element);
      resetRevealTarget(element);
    };

    const pulseNode = (id) => {
      const node = nodeElements.get(id);
      if (!node || pulseTimers.has(node)) return;

      node.classList.add("is-pulsing");
      const timer = window.setTimeout(() => {
        node.classList.remove("is-pulsing");
        pulseTimers.delete(node);
      }, JOURNEY_PULSE_DURATION);
      pulseTimers.set(node, timer);
    };

    const revealGroup = (group) => {
      if (group.revealed) return;
      group.revealed = true;
      group.checkpoint.classList.remove("journey-checkpoint-pending");
      group.checkpoint.classList.add("journey-checkpoint-visible");
      pulseNode(group.id);

      group.targets.forEach(({ element, delay }) => {
        element.classList.add("journey-visible");
        const timer = window.setTimeout(
          () => cleanupRevealTarget(element),
          MOTION_DURATION + delay + 140
        );
        revealCleanupTimers.set(element, timer);
      });
    };

    const finishReveals = () => {
      revealObserver?.disconnect();
      revealObserver = undefined;
      [...revealCleanupTimers.keys()].forEach((element) => cleanupRevealTarget(element));
      groups.forEach((group) => {
        group.checkpoint.classList.remove(
          "journey-checkpoint-pending",
          "journey-checkpoint-visible"
        );
        group.targets.forEach(({ element }) => resetRevealTarget(element));
      });
      pulseTimers.forEach((timer, node) => {
        window.clearTimeout(timer);
        node.classList.remove("is-pulsing");
      });
      pulseTimers.clear();
    };

    const setupReveals = () => {
      if (reduced || !intersectionSupported) return;

      try {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const group = groups.find(({ checkpoint }) => checkpoint === entry.target);
              if (!group) return;
              revealObserver.unobserve(entry.target);
              revealGroup(group);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
        );

        groups.forEach((group) => {
          if (group.checkpoint.getBoundingClientRect().bottom <= 0) {
            group.revealed = true;
            group.checkpoint.classList.add("journey-checkpoint-visible");
            return;
          }

          group.checkpoint.classList.add("journey-checkpoint-pending");
          group.targets.forEach(({ element, type, delay }) => {
            element.classList.add("journey-reveal");
            element.classList.add(type === "title" ? "journey-title" : `journey-from-${type}`);
            element.style.setProperty("--journey-delay", `${delay}ms`);
          });
          revealObserver.observe(group.checkpoint);
        });
      } catch {
        finishReveals();
      }
    };

    setupReveals();

    const pathSupported =
      typeof window.ResizeObserver === "function" &&
      Boolean(journeyDesktop) &&
      segmentDefinitions.some(({ valid }) => valid);
    let geometry;
    let geometryDirty = true;
    let pathActive = false;
    let animationFrame;
    let resizeObserver;
    let preferenceReduced = reduced;
    let activeCheckpointId = null;
    const sceneTrackingEnabled = typeof onActiveChange === "function";

    const pageScrollY = () => window.scrollY || window.pageYOffset || 0;
    const formatCoordinate = (value) => Number(value.toFixed(2));

    const resetSegment = ({ element, track, progress, ids }) => {
      if (element) {
        element.classList.remove("journey-ready", "journey-static");
        element.style.removeProperty("top");
        element.style.removeProperty("height");
        element.setAttribute("viewBox", "0 0 1 1");
      }
      track?.setAttribute("d", "M0 0");
      if (progress) {
        progress.setAttribute("d", "M0 0");
        progress.style.strokeDashoffset = "1";
      }
      ids.forEach((id) => {
        const node = nodeElements.get(id);
        if (node) {
          node.removeAttribute("transform");
          node.classList.remove("is-active", "is-complete", "is-pending");
        }
      });
    };

    const hideSegments = () => {
      segmentDefinitions.forEach((segment) => resetSegment(segment));
      geometry = undefined;
      activeCheckpointId = null;
      safelyNotify(onGeometryChange, null);
      safelyNotify(onActiveChange, null);
    };

    const buildRoute = (start, nodes, segmentTop, segmentEnd) => {
      const parts = [
        `M ${formatCoordinate(start.x)} ${formatCoordinate(start.y - segmentTop)}`,
      ];
      let current = start;

      nodes.forEach((target) => {
        const preferredApproach = Math.max(current.y + 28, target.sectionTop + 28);
        const approachY = Math.max(current.y, Math.min(preferredApproach, target.y - 20));

        if (approachY > current.y + 1) {
          parts.push(`L ${formatCoordinate(current.x)} ${formatCoordinate(approachY - segmentTop)}`);
        }

        const verticalSpan = Math.max(target.y - approachY, 1);
        const controlOneY = approachY + verticalSpan * 0.32;
        const controlTwoY = approachY + verticalSpan * 0.72;
        parts.push(
          `C ${formatCoordinate(current.x)} ${formatCoordinate(controlOneY - segmentTop)} ` +
            `${formatCoordinate(target.x)} ${formatCoordinate(controlTwoY - segmentTop)} ` +
            `${formatCoordinate(target.x)} ${formatCoordinate(target.y - segmentTop)}`
        );
        current = target;
      });

      if (segmentEnd > current.y + 1) {
        parts.push(`L ${formatCoordinate(current.x)} ${formatCoordinate(segmentEnd - segmentTop)}`);
      }

      return parts.join(" ");
    };

    const configureSegment = (
      segment,
      { width, top, end, path, points, mainDocumentTop, isStatic }
    ) => {
      const height = Math.max(end - top, 1);
      segment.element.style.top = `${formatCoordinate(top)}px`;
      segment.element.style.height = `${formatCoordinate(height)}px`;
      segment.element.setAttribute(
        "viewBox",
        `0 0 ${formatCoordinate(width)} ${formatCoordinate(height)}`
      );
      segment.track.setAttribute("d", path);
      segment.progress.setAttribute("d", path);
      segment.progress.style.strokeDashoffset = isStatic ? "0" : "1";
      segment.startDocumentY = mainDocumentTop + top;
      segment.endDocumentY = mainDocumentTop + end;

      points.forEach((point) => {
        nodeElements
          .get(point.id)
          .setAttribute(
            "transform",
            `translate(${formatCoordinate(point.x)} ${formatCoordinate(point.y - top)})`
          );
      });

      segment.element.classList.toggle("journey-static", isStatic);
      segment.element.classList.toggle("journey-ready", !isStatic);
    };

    const calculateGeometry = (isStatic = false) => {
      const scrollY = pageScrollY();
      const mainBounds = main.getBoundingClientRect();
      const mainDocumentTop = mainBounds.top + scrollY;
      const mainDocumentLeft = mainBounds.left + (window.scrollX || window.pageXOffset || 0);
      const width = Math.max(mainBounds.width, 1);
      const mainHeight = Math.max(main.scrollHeight, mainBounds.height, 1);
      const gutter = clamp(width * 0.024, 22, 34);
      const sideX = { left: gutter, right: width - gutter };

      const points = groups.map((group) => {
        const kicker = group.checkpoint.querySelector(".section-kicker") || group.checkpoint;
        const kickerBounds = kicker.getBoundingClientRect();
        const sectionBounds = group.section.getBoundingClientRect();
        const side = group.checkpoint.dataset.journeySide === "right" ? "right" : "left";
        return {
          id: group.id,
          x: sideX[side],
          y: kickerBounds.top + scrollY - mainDocumentTop + kickerBounds.height / 2,
          sectionTop: sectionBounds.top + scrollY - mainDocumentTop,
          sectionEnd: sectionBounds.bottom + scrollY - mainDocumentTop,
          side,
        };
      });
      const pointById = new Map(points.map((point) => [point.id, point]));
      const controlsBounds = document
        .querySelector(".publication-controls")
        ?.getBoundingClientRect();
      const publicationListBounds = document
        .querySelector("#publication-list")
        ?.getBoundingClientRect();
      const membersSection = document.querySelector("#members");
      const professorBounds = membersSection
        ?.querySelector(".professor-card")
        ?.getBoundingClientRect();
      const currentMembersGrid = membersSection?.querySelector(".current-members-grid");
      const currentMembersGroup = currentMembersGrid?.closest(".member-group");
      const currentMembersBounds = currentMembersGroup?.getBoundingClientRect();
      const configuredSegments = [];
      segmentDefinitions.filter(({ valid }) => !valid).forEach((segment) => resetSegment(segment));

      const primarySegment = segmentDefinitions[0];
      if (primarySegment.valid) {
        const entryBounds = entryElement.getBoundingClientRect();
        const entryPoint = {
          x: clamp(
            entryBounds.left + (window.scrollX || window.pageXOffset || 0) - mainDocumentLeft +
              entryBounds.width / 2,
            width * 0.25,
            width * 0.75
          ),
          y: entryBounds.top + scrollY - mainDocumentTop + entryBounds.height / 2,
        };
        const primaryPoints = primarySegment.ids.map((id) => pointById.get(id));
        const publicationsPoint = pointById.get("publications");
        const primaryTop = Math.max(entryPoint.y, 0);
        const controlsTail = controlsBounds
          ? controlsBounds.bottom + scrollY - mainDocumentTop + 34
          : publicationsPoint.y + 76;
        const listBoundary = publicationListBounds
          ? publicationListBounds.top + scrollY - mainDocumentTop - 10
          : controlsTail;
        const primaryEnd = Math.min(
          mainHeight,
          Math.max(Math.min(controlsTail, listBoundary), publicationsPoint.y + 76)
        );

        configureSegment(primarySegment, {
          width,
          top: primaryTop,
          end: primaryEnd,
          path: buildRoute(entryPoint, primaryPoints, primaryTop, primaryEnd),
          points: primaryPoints,
          mainDocumentTop,
          isStatic,
        });
        configuredSegments.push(primarySegment);
      }

      const secondarySegment = segmentDefinitions[1];
      if (secondarySegment.valid) {
        const secondaryPoints = secondarySegment.ids.map((id) => pointById.get(id));
        const membersPoint = pointById.get("members");
        const contactPoint = pointById.get("contact");
        const contactBounds = document.querySelector(".contact-grid")?.getBoundingClientRect();
        const secondaryTop = Math.max(membersPoint.sectionTop + 18, 0);
        const secondaryStart = { x: sideX.right, y: secondaryTop };
        const secondaryEnd = Math.min(
          mainHeight,
          Math.max(
            contactBounds ? contactBounds.bottom + scrollY - mainDocumentTop + 36 : 0,
            contactPoint.y + 90
          )
        );

        configureSegment(secondarySegment, {
          width,
          top: secondaryTop,
          end: secondaryEnd,
          path: buildRoute(secondaryStart, secondaryPoints, secondaryTop, secondaryEnd),
          points: secondaryPoints,
          mainDocumentTop,
          isStatic,
        });
        configuredSegments.push(secondarySegment);
      }

      const configuredIds = new Set(configuredSegments.flatMap(({ ids }) => ids));
      const checkpointPositions = points
        .filter(({ id }) => configuredIds.has(id))
        .map((point) => ({
          ...point,
          documentY: mainDocumentTop + point.y,
          node: nodeElements.get(point.id),
        }));
      const sceneCheckpoints = points.map((point) => {
        let sceneEnd = point.sectionEnd;

        if (point.id === "publications" && controlsBounds) {
          sceneEnd = Math.min(
            point.sectionEnd,
            controlsBounds.bottom + scrollY - mainDocumentTop + 36,
            publicationListBounds
              ? publicationListBounds.top + scrollY - mainDocumentTop - 10
              : point.sectionEnd
          );
        }

        if (point.id === "members") {
          const memberContentEnd = Math.max(
            professorBounds ? professorBounds.bottom + scrollY - mainDocumentTop : point.sectionTop,
            currentMembersBounds
              ? currentMembersBounds.bottom + scrollY - mainDocumentTop
              : point.sectionTop
          );
          sceneEnd = Math.min(point.sectionEnd, memberContentEnd + 36);
        }

        return {
          id: point.id,
          documentY: mainDocumentTop + point.y,
          sceneTop: point.sectionTop,
          sceneEnd: clamp(
            Math.max(sceneEnd, point.sectionTop + 160),
            point.sectionTop + 160,
            mainHeight
          ),
          side: point.side,
        };
      });

      if (isStatic || !intersectionSupported) {
        checkpointPositions.forEach(({ node }) => {
          node.classList.remove("is-active", "is-pending");
          node.classList.add("is-complete");
        });
      }

      geometry = {
        segments: configuredSegments,
        checkpoints: checkpointPositions,
        sceneCheckpoints,
      };
      geometryDirty = false;
      safelyNotify(onGeometryChange, {
        mainDocumentTop,
        mainHeight,
        checkpoints: sceneCheckpoints,
      });
    };

    const updateActiveState = (activationY) => {
      if (!intersectionSupported) return;

      const activeId = resolveActiveCheckpoint(geometry.checkpoints, activationY);

      if (activeId !== activeCheckpointId) {
        activeCheckpointId = activeId;
        safelyNotify(onActiveChange, activeId);
      }

      geometry.checkpoints.forEach(({ id, documentY, node }) => {
        const isActive = id === activeId;
        node.classList.toggle("is-active", isActive);
        node.classList.toggle("is-complete", !isActive && documentY < activationY);
        node.classList.toggle("is-pending", !isActive && documentY >= activationY);
      });
    };

    const updateProgress = () => {
      if (!geometry) return;
      const activationY = pageScrollY() + window.innerHeight * JOURNEY_ACTIVE_LINE;

      geometry.segments.forEach((segment) => {
        const progress = clamp(
          (activationY - segment.startDocumentY) /
            Math.max(segment.endDocumentY - segment.startDocumentY, 1),
          0,
          1
        );
        segment.progress.style.strokeDashoffset = (1 - progress).toFixed(4);
      });

      updateActiveState(activationY);
    };

    const routeIsNearViewport = () => {
      if (!geometry) return true;
      const scrollY = pageScrollY();
      const viewport = Math.max(window.innerHeight, 1);
      const nearTop = scrollY - viewport;
      const nearBottom = scrollY + viewport * 2;
      return geometry.segments.some(
        (segment) => segment.endDocumentY >= nearTop && segment.startDocumentY <= nearBottom
      );
    };

    const stopFrame = () => {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    };

    const runFrame = () => {
      animationFrame = undefined;
      if (!pathActive || document.hidden) return;

      try {
        if (geometryDirty || !geometry) calculateGeometry(false);
        if (routeIsNearViewport()) {
          updateProgress();
        } else {
          updateActiveState(pageScrollY() + window.innerHeight * JOURNEY_ACTIVE_LINE);
        }
      } catch {
        deactivatePath();
      }
    };

    const scheduleFrame = (force = false) => {
      if (
        animationFrame === undefined &&
        pathActive &&
        !document.hidden &&
        (force || geometryDirty || sceneTrackingEnabled || routeIsNearViewport())
      ) {
        animationFrame = requestAnimationFrame(runFrame);
      }
    };

    const markGeometryDirty = () => {
      geometryDirty = true;
      scheduleFrame(true);
    };

    const handleScroll = () => {
      if (geometry && !routeIsNearViewport() && !sceneTrackingEnabled) {
        stopFrame();
        return;
      }
      scheduleFrame();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopFrame();
      } else {
        scheduleFrame(true);
      }
    };

    const stopPathTracking = () => {
      if (!pathActive && !resizeObserver && animationFrame === undefined) return;
      pathActive = false;
      stopFrame();
      resizeObserver?.disconnect();
      resizeObserver = undefined;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", markGeometryDirty);
      window.removeEventListener("load", markGeometryDirty);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    const deactivatePath = (hide = true) => {
      stopPathTracking();
      if (hide) hideSegments();
    };

    const activatePath = () => {
      if (pathActive || !pathSupported || !journeyDesktop.matches || preferenceReduced) return;

      try {
        resizeObserver = new ResizeObserver(markGeometryDirty);
        const observedElements = new Set([
          main,
          document.querySelector("#publication-list"),
          ...groups.map(({ section }) => section),
        ]);
        observedElements.forEach((element) => {
          if (element) resizeObserver.observe(element);
        });
      } catch {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        hideSegments();
        return;
      }

      pathActive = true;
      geometryDirty = true;
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", markGeometryDirty, { passive: true });
      if (document.readyState !== "complete") window.addEventListener("load", markGeometryDirty);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      scheduleFrame(true);
    };

    const handleDesktopChange = (event) => {
      if (event.matches) {
        activatePath();
      } else {
        deactivatePath();
      }
    };

    const addDesktopListener = () => {
      if (!pathSupported) return;
      if (typeof journeyDesktop.addEventListener === "function") {
        journeyDesktop.addEventListener("change", handleDesktopChange);
      } else if (typeof journeyDesktop.addListener === "function") {
        journeyDesktop.addListener(handleDesktopChange);
      }
    };

    const removeDesktopListener = () => {
      if (!pathSupported) return;
      if (typeof journeyDesktop.removeEventListener === "function") {
        journeyDesktop.removeEventListener("change", handleDesktopChange);
      } else if (typeof journeyDesktop.removeListener === "function") {
        journeyDesktop.removeListener(handleDesktopChange);
      }
    };

    const showStaticPath = () => {
      if (!pathSupported || !journeyDesktop.matches) {
        hideSegments();
        return;
      }

      try {
        calculateGeometry(true);
      } catch {
        hideSegments();
      }
    };

    const reduce = () => {
      if (preferenceReduced) return;
      preferenceReduced = true;
      finishReveals();
      removeDesktopListener();
      deactivatePath(false);
      showStaticPath();
    };

    const destroy = () => {
      finishReveals();
      removeDesktopListener();
      deactivatePath();
    };

    if (reduced) {
      showStaticPath();
    } else {
      addDesktopListener();
      activatePath();
    }

    return { reduce, destroy };
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
    if (motionPreference?.matches) {
      createJourneyController({ reduced: true });
      return;
    }

    root.classList.add("motion-enabled");
    const countController = createCountController();
    const revealController = createRevealController(countController);
    const sceneController = createSceneController();
    const journeyController = createJourneyController({
      onActiveChange: sceneController.setActive,
      onGeometryChange: sceneController.setGeometry,
    });
    const cardController = createCardController();
    const heroController = createHeroController();
    let disabled = false;

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
      cardController.destroy();
      sceneController.destroy();
      journeyController.reduce();
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
    const main = document.querySelector("main#home");
    main?.removeAttribute("data-active-scene");
    const ambient = document.querySelector("[data-scene-ambient]");
    ambient?.classList.remove("scene-ready", "scene-animated", "scene-aligning");
    ambient?.style.removeProperty("--scene-top");
    ambient?.style.removeProperty("--scene-height");
    document.querySelectorAll(".card-interactive, .card-active").forEach((element) => {
      element.classList.remove("card-interactive", "card-active");
      element.style.removeProperty("--card-spot-x");
      element.style.removeProperty("--card-spot-y");
      element.style.removeProperty("--card-tilt-x");
      element.style.removeProperty("--card-tilt-y");
    });
    document.querySelectorAll(".journey-network").forEach((element) => {
      element.classList.remove("journey-ready", "journey-static");
    });
    document.querySelectorAll("[data-count]").forEach((element) => {
      if (!element.textContent.trim()) element.textContent = "0";
    });
  }
})();
