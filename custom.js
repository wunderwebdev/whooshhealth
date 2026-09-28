let lenisInstance = null,
  planSwiper = null,
  pricingSwiper = null;
function lenis() {
  if (
    ((lenisInstance = new Lenis()).on("scroll", ScrollTrigger.update),
    gsap.ticker.add((e) => {
      lenisInstance.raf(1e3 * e);
    }),
    gsap.ticker.lagSmoothing(0),
    document.querySelectorAll('a[href^="#"]').forEach((e) => {
      e.addEventListener("click", function (e) {
        (e.preventDefault(), lenisInstance.scrollTo(this.getAttribute("href")));
      });
    }),
    window.location.hash)
  ) {
    let e = document.querySelector(window.location.hash);
    e &&
      setTimeout(() => {
        lenisInstance.scrollTo(e);
      }, 100);
  }
}
function lenisStop() {
  lenisInstance.stop();
}
function lenisStart() {
  lenisInstance.start();
}
function initMegaNavDirectionalHover() {
  const DUR = {
    bgMorph: 0.4,
    contentIn: 0.3,
    contentOut: 0.2,
    stagger: 0.25,
    backdropIn: 0.3,
    backdropOut: 0.2,
    openScale: 0.35,
    closeScale: 0.25,
  };

  const HOVER_ENTER = 120;
  const HOVER_LEAVE = 150;

  // DOM references
  const menuWrap = document.querySelector("[data-menu-wrap]");
  const navList = document.querySelector("[data-nav-list]");
  const dropWrapper = document.querySelector("[data-dropdown-wrapper]");
  const dropContainer = document.querySelector("[data-dropdown-container]");
  const dropBg = document.querySelector("[data-dropdown-bg]");
  const backdrop = document.querySelector("[data-menu-backdrop]");
  const toggles = [...document.querySelectorAll("[data-dropdown-toggle]")];
  const panels = [...document.querySelectorAll("[data-nav-content]")];
  const burger = document.querySelector("[data-burger-toggle]");
  const backBtn = document.querySelector("[data-mobile-back]");
  const mobileNavLinks = document.querySelectorAll(".mega-nav_mobile .mega-nav__panel-link");
  const logo = document.querySelector("[data-menu-logo]");
  const [lineTop, lineMid, lineBot] = ["top", "mid", "bot"].map((id) => document.querySelector(`[data-burger-line='${id}']`));

  // State
  const state = {
    isOpen: false,
    activePanel: null,
    activePanelIndex: -1,
    isMobile: window.innerWidth <= 991,
    mobileMenuOpen: false,
    mobilePanelActive: null,
    hoverTimer: null,
    leaveTimer: null,
    tl: null,
    mobileTl: null,
    mobilePanelTl: null,
  };

  // Helpers
  const getPanel = (name) => document.querySelector(`[data-nav-content="${name}"]`);
  const getToggle = (name) => document.querySelector(`[data-dropdown-toggle="${name}"]`);
  const getFade = (el) => el.querySelectorAll("[data-menu-fade]");
  const getNavItems = () => navList.querySelectorAll("[data-nav-list-item]");
  const getIndex = (name) => toggles.indexOf(getToggle(name));
  const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger });

  function clearTimers() {
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    state.hoverTimer = state.leaveTimer = null;
  }

  function killTl(key) {
    if (state[key]) {
      state[key].kill();
      state[key] = null;
    }
  }

  function killDropdown() {
    killTl("tl");
    gsap.killTweensOf(dropContainer);
    gsap.killTweensOf(backdrop);
    panels.forEach((p) => {
      gsap.killTweensOf(p);
      gsap.killTweensOf(getFade(p));
    });
  }

  function killMobile() {
    killTl("mobileTl");
    gsap.killTweensOf([navList, lineTop, lineMid, lineBot]);
  }

  function killMobilePanel() {
    killTl("mobilePanelTl");
    gsap.killTweensOf(getNavItems());
    gsap.killTweensOf([backBtn, logo]);
    panels.forEach((p) => {
      gsap.killTweensOf(p);
      gsap.killTweensOf(getFade(p));
    });
  }

  function resetToggles() {
    toggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  function resetDesktop() {
    panels.forEach((p) => {
      gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", x: 0, y: 0, xPercent: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0, xPercent: 0 });
    });

    gsap.set(dropContainer, { height: 0, clearProps: "transform" });
    gsap.set(backdrop, { autoAlpha: 0 });

    menuWrap.setAttribute("data-menu-open", "false");
    resetToggles();
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: "visible", pointerEvents: "none" });
      gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
    });
    gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0, x: 0 });
    gsap.set(backBtn, { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: "height" });
    gsap.set(backdrop, { autoAlpha: 0 });
  }

  function measurePanel(name) {
    const el = getPanel(name);
    if (!el) return 0;
    const s = el.style;
    const prev = [s.visibility, s.opacity, s.pointerEvents];
    Object.assign(s, { visibility: "visible", opacity: "0", pointerEvents: "none" });
    const h = el.getBoundingClientRect().height;
    [s.visibility, s.opacity, s.pointerEvents] = prev;
    return h;
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.isOpen && state.activePanel === panelName) return;
    if (state.isOpen) return switchPanel(state.activePanel, panelName);

    const height = measurePanel(panelName);
    if (!height) return;

    killDropdown();
    resetDesktop();

    const el = getPanel(panelName);
    const fade = getFade(el);
    const toggle = getToggle(panelName);

    state.isOpen = true;
    state.activePanel = panelName;
    state.activePanelIndex = getIndex(panelName);
    menuWrap.setAttribute("data-menu-open", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    gsap.set(dropContainer, { height: 0 });

    const tl = gsap.timeline();
    state.tl = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power2.out" }, 0);
    tl.to(dropContainer, { height, duration: DUR.openScale, ease: "power3.out" }, 0);
    tl.set(el, { visibility: "visible", opacity: 1, pointerEvents: "auto" }, 0.05);
    if (fade.length) {
      tl.fromTo(fade, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: DUR.contentIn, stagger: stagger(fade.length), ease: "power3.out" }, 0.1);
    }
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen) return;
    const el = getPanel(state.activePanel);
    const fade = el ? getFade(el) : [];

    killDropdown();

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false;
        state.activePanel = null;
        state.activePanelIndex = -1;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (fade.length) tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: "power2.in" }, 0);
    tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: "power2.in" }, 0.05);
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power2.out" }, 0);
    if (el) tl.set(el, { visibility: "hidden", opacity: 0, pointerEvents: "none" });
  }

  // DESKTOP — switch panel (directional)
  function switchPanel(fromName, toName) {
    const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1;
    const fromEl = getPanel(fromName),
      toEl = getPanel(toName);
    if (!fromEl || !toEl) return;

    const fromFade = getFade(fromEl),
      toFade = getFade(toEl);
    const toHeight = measurePanel(toName);
    if (!toHeight) return;

    killDropdown();

    // Reset all panels, then restore fromEl as visible
    panels.forEach((p) => {
      gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
    });
    gsap.set(fromEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", x: 0 });
    if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
    gsap.set(backdrop, { autoAlpha: 1 });

    const toToggle = getToggle(toName);
    state.activePanel = toName;
    state.activePanelIndex = getIndex(toName);
    resetToggles();
    if (toToggle) toToggle.setAttribute("aria-expanded", "true");

    const xOut = dir * -30,
      xIn = dir * 30;
    const tl = gsap.timeline();
    state.tl = tl;

    if (fromFade.length) tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: "power2.in" }, 0);
    tl.set(fromEl, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 }, DUR.contentOut);
    if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);
    tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: "power3.out" }, 0.05);
    tl.set(toEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", xPercent: 0 }, DUR.contentOut * 0.5);
    if (toFade.length) {
      tl.fromTo(toFade, { autoAlpha: 0, x: xIn }, { autoAlpha: 1, x: 0, duration: DUR.contentIn, stagger: stagger(toFade.length), ease: "power3.out" }, DUR.contentOut * 0.6);
    }
  }

  // DESKTOP — hover intent
  function handleToggleEnter(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    clearTimeout(state.leaveTimer);
    state.leaveTimer = null;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  }

  function handleToggleLeave() {
    if (state.isMobile) return;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  function handleWrapperEnter() {
    if (state.isMobile) return;
    clearTimeout(state.leaveTimer);
    state.leaveTimer = null;
  }

  function handleWrapperLeave() {
    if (state.isMobile) return;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  // DESKTOP — close behaviors
  function handleEscape(e) {
    if (e.key !== "Escape") return;
    if (state.isMobile) {
      state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu();
      return;
    }
    if (state.isOpen) {
      const t = getToggle(state.activePanel);
      closeDropdown();
      if (t) t.focus();
    }
  }

  function handleDocClick(e) {
    if (state.isMobile || !state.isOpen) return;
    if (!e.target.closest("[data-menu-wrap]")) closeDropdown();
  }

  // DESKTOP — keyboard navigation
  function focusFirstLink(panelName) {
    setTimeout(() => {
      const el = getPanel(panelName);
      if (!el) return;
      const link = el.querySelector("a");
      if (!link) return;
      gsap.set(link, { visibility: "visible" });
      link.focus();
    }, 80);
  }

  function handleKeydownOnToggle(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state.isOpen && state.activePanel === name) closeDropdown();
      else {
        openDropdown(name);
        focusFirstLink(name);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!state.isOpen || state.activePanel !== name) openDropdown(name);
      focusFirstLink(name);
    }
    if (e.key === "Tab" && !e.shiftKey && state.isOpen && state.activePanel === name) {
      e.preventDefault();
      const link = getPanel(name)?.querySelector("a");
      if (link) link.focus();
    }
  }

  function handleKeydownInPanel(e) {
    if (state.isMobile || !state.isOpen) return;
    const el = getPanel(state.activePanel);
    if (!el) return;

    const links = [...el.querySelectorAll("a")];
    const idx = links.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(idx + 1) % links.length].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) {
        const t = getToggle(state.activePanel);
        if (t) t.focus();
      } else links[idx - 1].focus();
    }
    if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
      e.preventDefault();
      const curIdx = toggles.indexOf(getToggle(state.activePanel));
      const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
      closeDropdown();
      if (next) next.focus();
    }
    if (e.key === "Tab" && e.shiftKey && idx === 0) {
      e.preventDefault();
      const t = getToggle(state.activePanel);
      if (t) t.focus();
    }
  }

  // MOBILE — burger animation
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    if (toX) {
      tl.to(lineTop, { y: "0.3125em", duration: 0.15 }, 0);
      tl.to(lineBot, { y: "-0.3125em", duration: 0.15 }, 0);
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
    } else {
      tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
    }
    return tl;
  }

  // MOBILE — open/close menu
  function openMobileMenu() {
    // lenisStop();
    killMobile();
    state.mobileMenuOpen = true;
    menuWrap.setAttribute("data-menu-open", "true");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";

    const items = getNavItems();
    const tl = gsap.timeline();
    state.mobileTl = tl;
    tl.add(animateBurger(true), 0);
    tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0);
    if (items.length) {
      tl.fromTo(items, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" }, 0.15);
    }
  }

  function closeMobileMenu() {
    // lenisStart();
    const hadPanel = state.mobilePanelActive;
    const panelEl = hadPanel ? getPanel(hadPanel) : null;

    killMobile();
    killMobilePanel();

    menuWrap.setAttribute("data-menu-open", "false");
    state.mobileMenuOpen = false;
    state.mobilePanelActive = null;
    burger.setAttribute("aria-expanded", "false");

    const tl = gsap.timeline({
      onComplete() {
        document.body.style.overflow = "";
        state.mobileTl = null;
        setupMobile();
      },
    });
    state.mobileTl = tl;

    tl.add(animateBurger(false), 0);

    // If a panel was open, fade it out with the close — no snap reset
    if (hadPanel && panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
    }

    // Fade out the nav list container
    tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
  }

  // MOBILE — slide-over panels
  function openMobilePanel(panelName) {
    const el = getPanel(panelName);
    if (!el) return;
    killMobilePanel();
    state.mobilePanelActive = panelName;

    const navItems = getNavItems();
    const panelFade = getFade(el);

    const tl = gsap.timeline();
    state.mobilePanelTl = tl;

    // Fade out each nav item to the left
    if (navItems.length) {
      tl.to(
        navItems,
        {
          xPercent: -10,
          autoAlpha: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: "power2.in",
        },
        0,
      );
    }

    // Logo → back button swap
    tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: "power2.inOut" }, 0.15);

    // Show panel container, then fade in its items from the right
    tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: "auto" }, 0.2);
    if (panelFade.length) {
      tl.fromTo(panelFade, { xPercent: 8, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.3, stagger: stagger(panelFade.length), ease: "power3.out" }, 0.25);
    }
  }

  function closeMobilePanel() {
    if (!state.mobilePanelActive) return;
    const el = getPanel(state.mobilePanelActive);
    if (!el) return;
    killMobilePanel();

    const navItems = getNavItems();
    const panelFade = getFade(el);

    const tl = gsap.timeline({
      onComplete() {
        state.mobilePanelActive = null;
        state.mobilePanelTl = null;
      },
    });
    state.mobilePanelTl = tl;

    // Fade out panel items to the right
    if (panelFade.length) {
      tl.to(
        el,
        {
          xPercent: 20,
          autoAlpha: 0,
          duration: 0.3,
          stagger: 0.02,
          ease: "power2.in",
        },
        0,
      );
    }

    // Hide panel
    tl.set(el, { autoAlpha: 0, pointerEvents: "none" }, 0.25);

    // Back → logo swap
    tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.15);

    // Fade nav items back in from center
    if (navItems.length) {
      tl.fromTo(navItems, { xPercent: -20, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: "power3.out" }, 0.25);
    }
  }

  function handleToggleClick(e) {
    if (!state.isMobile || !state.mobileMenuOpen) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (name) {
      e.preventDefault();
      openMobilePanel(name);
    }
  }

  // RESIZE
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  function handleResize() {
    const w = window.innerWidth;
    if (w === lastWidth) return;
    lastWidth = w;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const was = state.isMobile;
      state.isMobile = window.innerWidth <= 991;

      if (was && !state.isMobile) {
        killMobile();
        killMobilePanel();
        gsap.set(navList, { clearProps: "all" });
        gsap.set(getNavItems(), { clearProps: "all" });
        gsap.set(backBtn, { autoAlpha: 0 });
        gsap.set(logo, { clearProps: "all" });
        gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });

        panels.forEach((p) => {
          gsap.set(p, { clearProps: "all" });
          gsap.set(getFade(p), { clearProps: "all" });
        });

        burger.setAttribute("aria-expanded", "false");
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        resetDesktop();
      }

      if (!was && state.isMobile) {
        killDropdown();
        state.isOpen = false;
        state.activePanel = null;
        state.activePanelIndex = -1;
        clearTimers();
        menuWrap.setAttribute("data-menu-open", "false");
        resetToggles();
        setupMobile();
      }
    }, 150);
  }

  // EVENT BINDING
  toggles.forEach((btn) => {
    btn.addEventListener("mouseenter", handleToggleEnter);
    btn.addEventListener("mouseleave", handleToggleLeave);
    btn.addEventListener("keydown", handleKeydownOnToggle);
    btn.addEventListener("click", handleToggleClick);
  });

  dropWrapper?.addEventListener("mouseenter", handleWrapperEnter);
  dropWrapper?.addEventListener("mouseleave", handleWrapperLeave);

  panels.forEach((p) => p.addEventListener("keydown", handleKeydownInPanel));

  backdrop.addEventListener("click", closeDropdown);

  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleDocClick);

  burger.addEventListener("click", () => (state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu()));

  backBtn.addEventListener("click", closeMobilePanel);

  mobileNavLinks.forEach((link) =>
    link.addEventListener("click", () => {
      if (state.isMobile && state.mobileMenuOpen) closeMobileMenu();
    }),
  );

  window.addEventListener("resize", handleResize);

  // INIT
  state.isMobile ? setupMobile() : resetDesktop();
}
function initCSSMarquee() {
  let e = document.querySelectorAll("[data-css-marquee]");
  if (!e.length) return;
  e.forEach((e) => {
    e.querySelectorAll("[data-css-marquee-list]").forEach((t) => {
      let i = t.cloneNode(!0);
      e.appendChild(i);
    });
  });
  let t = new IntersectionObserver(
    (e) => {
      e.forEach((e) => {
        e.target.querySelectorAll("[data-css-marquee-list]").forEach((t) => (t.style.animationPlayState = e.isIntersecting ? "running" : "paused"));
      });
    },
    { threshold: 0 },
  );
  e.forEach((e) => {
    let i = parseFloat(e.dataset.speed) || 75;
    (e.querySelectorAll("[data-css-marquee-list]").forEach((e) => {
      ((e.style.animationDuration = e.offsetWidth / i + "s"), (e.style.animationPlayState = "paused"));
    }),
      t.observe(e));
  });
}
function initHowWorkSwiper() {
  let e = document.querySelector(".how-work-swiper");
  function t(e) {
    let t = document.querySelector(".swiper-progress-bar");
    if (!t) return;
    let i = e.slides.length,
      r = e.activeIndex + 1;
    t.style.width = (r / i) * 100 + "%";
  }
  e &&
    new Swiper(e, {
      slidesPerView: 1.1,
      spaceBetween: 20,
      grabCursor: !0,
      pagination: { el: ".swiper-pagination", type: "progressbar" },
      breakpoints: { 768: { slidesPerView: 1.1, centeredSlides: !0 }, 992: { slidesPerView: 3, allowTouchMove: !1 } },
      on: {
        init: function () {
          t(this);
        },
        slideChange: function () {
          t(this);
        },
      },
    });
}
function initReviewSwiper() {
  let e = document.querySelector(".review-swiper");
  e && new Swiper(e, { slidesPerView: 1, spaceBetween: 16, grabCursor: !0, loop: !0, speed: 800, pagination: { el: ".review-swiper .swiper-pagination", clickable: !0 }, navigation: { nextEl: ".review-swiper-next", prevEl: ".review-swiper-prev" } });
}
function initDynamicCurrentYear() {
  let e = new Date().getFullYear(),
    t = document.querySelectorAll("[data-current-year]");
  t.forEach((t) => {
    t.textContent = `\xa9 ${e}`;
  });
}
function initContentRevealScroll() {
  let e = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    t = gsap.context(() => {
      document.querySelectorAll("[data-reveal-group]").forEach((t) => {
        let i = (parseFloat(t.getAttribute("data-stagger")) || 100) / 1e3,
          r = t.getAttribute("data-distance") || "2em",
          n = t.getAttribute("data-start") || "top 80%",
          a = "power4.inOut";
        if (e) {
          gsap.set(t, { clearProps: "all", y: 0, autoAlpha: 1 });
          return;
        }
        let l = Array.from(t.children).filter((e) => 1 === e.nodeType);
        if (!l.length) {
          (gsap.set(t, { y: r, autoAlpha: 0 }), ScrollTrigger.create({ trigger: t, start: n, once: !0, onEnter: () => gsap.to(t, { y: 0, autoAlpha: 1, duration: 1, ease: a, onComplete: () => gsap.set(t, { clearProps: "all" }) }) }));
          return;
        }
        let o = [];
        (l.forEach((e) => {
          let t = e.matches("[data-reveal-group-nested]") ? e : e.querySelector(":scope [data-reveal-group-nested]");
          if (t) {
            let i = "true" !== e.getAttribute("data-ignore") && ("false" === e.getAttribute("data-ignore") || "false" === t.getAttribute("data-ignore")),
              r = Array.from(t.children).filter((e) => 1 === e.nodeType && "true" !== e.getAttribute("data-ignore"));
            o.push({ type: "nested", parentEl: e, nestedEl: t, includeParent: i, nestedChildren: r });
          } else {
            if ("true" === e.getAttribute("data-ignore")) return;
            o.push({ type: "item", el: e });
          }
        }),
          o.forEach((e) => {
            if ("item" === e.type) {
              let t = e.el.matches("[data-reveal-group-nested]"),
                i = t ? r : e.el.getAttribute("data-distance") || r;
              gsap.set(e.el, { y: i, autoAlpha: 0 });
            } else {
              e.includeParent && gsap.set(e.parentEl, { y: r, autoAlpha: 0 });
              let n = e.nestedEl.getAttribute("data-distance") || r;
              e.nestedChildren.forEach((e) => gsap.set(e, { y: n, autoAlpha: 0 }));
            }
          }),
          o.forEach((e) => {
            "nested" === e.type && e.includeParent && gsap.set(e.parentEl, { y: r });
          }),
          ScrollTrigger.create({
            trigger: t,
            start: n,
            once: !0,
            onEnter() {
              let e = gsap.timeline();
              o.forEach((t, r) => {
                let n = r * i;
                if ("item" === t.type) e.to(t.el, { y: 0, autoAlpha: 1, filter: "blur(0)", duration: 1, ease: a, onComplete: () => gsap.set(t.el, { clearProps: "all" }) }, n);
                else {
                  t.includeParent && e.to(t.parentEl, { y: 0, autoAlpha: 1, filter: "blur(0)", duration: 1, ease: a, onComplete: () => gsap.set(t.parentEl, { clearProps: "all" }) }, n);
                  let l = parseFloat(t.nestedEl.getAttribute("data-stagger")),
                    o = isNaN(l) ? i : l / 1e3;
                  t.nestedChildren.forEach((t, i) => {
                    e.to(t, { y: 0, autoAlpha: 1, filter: "blur(0)", duration: 1, ease: a, onComplete: () => gsap.set(t, { clearProps: "all" }) }, n + i * o);
                  });
                }
              });
            },
          }));
      });
    });
  return () => t.revert();
}
function splitLinesAnimation() {
  let e = document.querySelectorAll("[data-split='lines']");
  e.length &&
    e.forEach((e) => {
      let t = e.dataset.highlightScrollStart || "top 90%",
        i = e.dataset.highlightScrollEnd || "center 40%";
      SplitText.create(e, {
        type: "lines",
        mask: "lines",
        autoSplit: !0,
        onSplit(r) {
          let n = gsap.context(() => {
            let n = r.lines,
              a = n.length,
              l = gsap.timeline({ scrollTrigger: { trigger: e, start: t, end: i, invalidateOnRefresh: !0 } });
            n.forEach((e, t) => {
              l.fromTo(
                e,
                { yPercent: 80, scale: 0.96, autoAlpha: 0, rotation: 1.5, filter: "blur(12px)", transformOrigin: "0% 100%" },
                {
                  yPercent: 0,
                  scale: 1,
                  autoAlpha: 1,
                  rotation: 0,
                  filter: "blur(0px)",
                  ease: "expo.out",
                  duration: 1.05,
                  onComplete() {
                    gsap.set(e, { clearProps: "filter" });
                  },
                },
                (t * (0.135 + 0.03 * a)) / (a > 1 ? a - 1 : 1) + 0.15,
              );
            });
          });
          return n;
        },
      });
    });
}
function initPlanSwiper() {
  let e = document.querySelector(".plan-swiper");
  e &&
    (window.innerWidth <= 991
      ? planSwiper ||
        (planSwiper = new Swiper(e, { slidesPerView: 1, spaceBetween: 10, grabCursor: !0, pagination: { el: ".swiper-pagination", type: "progressbar" }, breakpoints: { 768: { slidesPerView: 1, spaceBetween: 15, centeredSlides: !0 } } }))
      : planSwiper && (planSwiper.destroy(!0, !0), (planSwiper = null)));
}
function initPricingSlider() {
  let e = window.innerWidth <= 991;
  e
    ? pricingSwiper || (pricingSwiper = new Swiper(".pricing-swiper, .account-swiper", { slidesPerView: "auto", spaceBetween: 10, grabCursor: !0, pagination: { el: ".swiper-pagination", type: "progressbar", clickable: !1 } }))
    : pricingSwiper && (pricingSwiper.destroy(!0, !0), (pricingSwiper = null));
}
function handleResize() {
  (initPlanSwiper(), initPricingSlider());
}
function initGlobalParallax() {
  let e = gsap.matchMedia();
  e.add({ isMobile: "(max-width:479px)", isMobileLandscape: "(max-width:767px)", isTablet: "(max-width:991px)", isDesktop: "(min-width:992px)" }, (e) => {
    let { isMobile: t, isMobileLandscape: i, isTablet: r } = e.conditions,
      n = gsap.context(() => {
        document.querySelectorAll('[data-parallax="trigger"]').forEach((e) => {
          let n = e.getAttribute("data-parallax-disable");
          if (("mobile" === n && t) || ("mobileLandscape" === n && i) || ("tablet" === n && r)) return;
          let a = e.querySelector('[data-parallax="target"]') || e,
            l = e.getAttribute("data-parallax-direction") || "vertical",
            o = "horizontal" === l ? "xPercent" : "yPercent",
            s = e.getAttribute("data-parallax-scrub"),
            u = !s || parseFloat(s),
            c = e.getAttribute("data-parallax-start"),
            p = null !== c ? parseFloat(c) : 20,
            d = e.getAttribute("data-parallax-end"),
            $ = null !== d ? parseFloat(d) : -20,
            h = e.getAttribute("data-parallax-scroll-start") || "top bottom",
            g = `clamp(${h})`,
            f = e.getAttribute("data-parallax-scroll-end") || "bottom top",
            b = `clamp(${f})`;
          gsap.fromTo(a, { [o]: p }, { [o]: $, ease: "none", scrollTrigger: { trigger: e, start: g, end: b, scrub: u } });
        });
      });
    return () => n.revert();
  });
}
function initAnimationBorder() {
  let e = document.querySelectorAll("[data-animation-border]");
  if (!e.length) return;
  let t = gsap.matchMedia();
  e.forEach((e) => {
    t.add({ isDesktop: "(min-width: 768px)", isMobile: "(max-width: 767px)" }, (t) => {
      let { isDesktop: i } = t.conditions,
        r = i ? "0.85rem" : "0.5rem",
        n = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: e, start: "top top", end: "+=100%", scrub: !0, invalidateOnRefresh: !0, markers: !1 } });
      n.fromTo(e, { clipPath: `inset(${r} ${r} 0rem ${r} round 0.5rem 0.5rem 0rem 0rem)` }, { clipPath: "inset(0rem 0rem 0rem 0rem round 0rem 0rem 0rem 0rem)", duration: 1 });
    });
  });
}
function initAccordionCSS() {
  document.querySelectorAll("[data-accordion-css-init]").forEach((e) => {
    let t = "true" === e.getAttribute("data-accordion-close-siblings");
    e.addEventListener("click", (i) => {
      let r = i.target.closest("[data-accordion-toggle]");
      if (!r) return;
      let n = r.closest("[data-accordion-status]");
      if (!n) return;
      let a = "active" === n.getAttribute("data-accordion-status");
      (n.setAttribute("data-accordion-status", a ? "not-active" : "active"),
        t &&
          !a &&
          e.querySelectorAll('[data-accordion-status="active"]').forEach((e) => {
            e !== n && e.setAttribute("data-accordion-status", "not-active");
          }));
    });
  });
}
function initNavbarScroll() {
  var e = document.querySelector(".mega-nav");
  e &&
    ScrollTrigger.create({
      start: "100px top",
      markers: !1,
      onEnter: () => e.classList.add("is-scroll"),
      onLeaveBack() {
        (e.classList.remove("is-scroll"), e.classList.remove("is-nav-hidden"));
      },
      onUpdate(t) {
        1 === t.direction ? e.classList.add("is-nav-hidden") : e.classList.remove("is-nav-hidden");
      },
    });
}
function initHowItWorksCardActiveToggle() {
  const cards = document.querySelectorAll(".how-it-work_item-link");
  if (!cards.length) return;

  document.querySelectorAll(".how-it-work_item-link").forEach(function (item) {
    item.addEventListener("mouseenter", function () {
      document.querySelectorAll(".how-it-work_item-link").forEach(function (el) {
        el.classList.remove("is-active");
      });
      this.classList.add("is-active");
    });

    item.addEventListener("mouseleave", function () {
      document.querySelectorAll(".how-it-work_item-link").forEach(function (el) {
        el.classList.remove("is-active");
      });
      document.querySelector(".how-it-work_item-link").classList.add("is-active");
    });
  });
}
(document.addEventListener("DOMContentLoaded", function () {
  (lenis(),
    initAnimationBorder(),
    initMegaNavDirectionalHover(),
    initNavbarScroll(),
    initContentRevealScroll(),
    initCSSMarquee(),
    initHowWorkSwiper(),
    initReviewSwiper(),
    splitLinesAnimation(),
    initAccordionCSS(),
    handleResize(),
    initGlobalParallax(),
    initHowItWorksCardActiveToggle());
}),
  window.addEventListener("resize", handleResize));

window.Webflow = window.Webflow || [];
window.Webflow.push(function () {
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(this, args);
      }, delay);
    };
  }
  document.querySelectorAll(".tabs-menu").forEach(function (tabMenu) {
    const tabs = tabMenu.querySelectorAll(".tab-link");

    const indicator = document.createElement("div");
    indicator.className = "tab-indicator";
    tabMenu.insertBefore(indicator, tabMenu.firstChild);

    tabs.forEach(function (tab) {
      const label = tab.querySelector("div")?.textContent || "";
      const clipEl = document.createElement("div");
      clipEl.className = "clip-white";
      clipEl.textContent = label;
      tab.appendChild(clipEl);
    });

    function getActive() {
      return tabMenu.querySelector(".tab-link.w--current") || tabs[0];
    }

    function moveIndicator(btn) {
      indicator.style.left = btn.offsetLeft + "px";
      indicator.style.top = btn.offsetTop + "px";
      indicator.style.width = btn.offsetWidth + "px";
      indicator.style.height = btn.offsetHeight + "px";

      tabs.forEach(function (tab) {
        const clipEl = tab.querySelector(".clip-white");
        if (!clipEl) return;

        if (tab === btn) {
          clipEl.style.clipPath = "inset(0 0% 0 0%)";
        } else if (tab.offsetLeft < btn.offsetLeft) {
          clipEl.style.clipPath = "inset(0 0% 0 100%)";
        } else {
          clipEl.style.clipPath = "inset(0 100% 0 0%)";
        }
      });
    }

    moveIndicator(getActive());

    tabs.forEach(function (tab) {
      tab.addEventListener("mouseenter", function () {
        moveIndicator(tab);
      });
      tab.addEventListener("mouseleave", function () {
        moveIndicator(getActive());
      });
    });

    const observer = new MutationObserver(function () {
      moveIndicator(getActive());
    });
    tabs.forEach(function (tab) {
      observer.observe(tab, { attributes: true, attributeFilter: ["class"] });
    });

    // Keep indicator aligned with the active tab on resize
    const handleResize = debounce(function () {
      moveIndicator(getActive());
    }, 150);

    window.addEventListener("resize", handleResize);
  });
});
