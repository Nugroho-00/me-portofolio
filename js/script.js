(function () {
  "use strict";

  const STORAGE_KEY = "portfolio-lang";
  const DEFAULT_LANG = "en";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function getLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "en" || saved === "id" ? saved : DEFAULT_LANG;
    } catch (_) {
      return DEFAULT_LANG;
    }
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (_) {
      // The selected language still applies for this page view.
    }
  }

  function applyTranslations(language) {
    const translations = window.PORTFOLIO_I18N && window.PORTFOLIO_I18N[language];
    if (!translations) return;

    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      const value = translations[element.dataset.i18n];
      if (typeof value === "string") element.textContent = value;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      const value = translations[element.dataset.i18nPlaceholder];
      if (typeof value === "string") element.placeholder = value;
    });

    document.querySelectorAll("[data-i18n-list]").forEach(function (list) {
      const items = translations[list.dataset.i18nList];
      if (!Array.isArray(items)) return;

      list.replaceChildren(
        ...items.map(function (text) {
          const item = document.createElement("li");
          item.textContent = text;
          return item;
        }),
      );
    });

    document.querySelectorAll(".lang-btn").forEach(function (button) {
      const active = button.dataset.lang === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll(".lang-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      saveLanguage(button.dataset.lang);
      applyTranslations(button.dataset.lang);
    });
  });

  applyTranslations(getLanguage());

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".primary-nav");
  const menuLinks = Array.from(menu.querySelectorAll("a"));
  const overlay = document.querySelector(".nav-overlay");

  function setMenu(open) {
    const mobile = window.innerWidth <= 1040;
    open = mobile && open;
    document.body.classList.toggle("nav-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (mobile) menu.setAttribute("aria-hidden", String(!open));
    else menu.removeAttribute("aria-hidden");
    menuLinks.forEach(function (link) {
      if (mobile && !open) link.setAttribute("tabindex", "-1");
      else link.removeAttribute("tabindex");
    });
  }

  menuButton.addEventListener("click", function () {
    const open = !document.body.classList.contains("nav-open");
    setMenu(open);
    if (open) menu.querySelector("a").focus();
  });

  overlay.addEventListener("click", function () {
    setMenu(false);
    menuButton.focus();
  });

  menuLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    const menuOpen = document.body.classList.contains("nav-open");
    if (event.key === "Escape" && menuOpen) {
      setMenu(false);
      menuButton.focus();
    }

    if (event.key !== "Tab" || !menuOpen) return;
    if (event.shiftKey && document.activeElement === menuLinks[0]) {
      event.preventDefault();
      menuButton.focus();
    } else if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      menuLinks[menuLinks.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === menuLinks[menuLinks.length - 1]) {
      event.preventDefault();
      menuButton.focus();
    } else if (!event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      menuLinks[0].focus();
    }
  });

  window.addEventListener("resize", function () {
    setMenu(document.body.classList.contains("nav-open"));
  });

  setMenu(false);

  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const observedSections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const navigationObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          navLinks.forEach(function (link) {
            const active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );

    observedSections.forEach(function (section) {
      navigationObserver.observe(section);
    });
  }

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    document.querySelectorAll("[data-reveal]").forEach(function (section) {
      section.classList.add("reveal-ready");
      revealObserver.observe(section);
    });
  }

  const backToTop = document.getElementById("backToTop");

  function updateBackToTop() {
    backToTop.classList.toggle("show", window.scrollY > 500);
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });

  const contactForm = document.getElementById("contactForm");

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = new FormData(contactForm);
    const body = [
      "Name: " + data.get("name"),
      "Email: " + data.get("email"),
      "",
      data.get("message"),
    ].join("\n");

    window.location.href =
      "mailto:snugroho211@gmail.com?subject=" +
      encodeURIComponent(data.get("subject")) +
      "&body=" +
      encodeURIComponent(body);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
