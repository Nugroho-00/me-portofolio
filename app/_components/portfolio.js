"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  experienceKeys,
  navigation,
  projects,
  translations,
} from "../../data/portfolio-content";

function ProjectCard({ project, t }) {
  const galleryRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const hasMultipleImages = project.images.length > 1;

  const showImage = (index) => {
    const track = galleryRef.current;
    if (!track) return;
    const nextIndex = Math.max(0, Math.min(index, project.images.length - 1));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: track.clientWidth * nextIndex,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveImage(nextIndex);
  };

  const syncActiveImage = () => {
    const track = galleryRef.current;
    if (!track?.clientWidth) return;
    setActiveImage(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <article className={project.className}>
      <div className="project-visual">
        <div
          className={`project-media${hasMultipleImages ? " project-media-duo" : ""}`}
          onScroll={hasMultipleImages ? syncActiveImage : undefined}
          ref={galleryRef}
        >
          {project.images.map(([file, alt]) => (
            <a
              href={`/assets/images/projects/${file}`}
              target="_blank"
              rel="noopener"
              aria-label={`${t("projectOpenImage")}: ${alt}`}
              key={file}
            >
              <Image
                src={`/assets/images/projects/${file}`}
                alt={alt}
                fill
                sizes="(max-width: 760px) calc(100vw - 2rem), (max-width: 1180px) 50vw, 760px"
              />
            </a>
          ))}
        </div>

        {hasMultipleImages && (
          <div className="project-gallery-controls" role="group" aria-label={t("galleryControls")}>
            <span aria-live="polite">{activeImage + 1} / {project.images.length}</span>
            <button
              type="button"
              aria-label={t("galleryPrevious")}
              disabled={activeImage === 0}
              onClick={() => showImage(activeImage - 1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label={t("galleryNext")}
              disabled={activeImage === project.images.length - 1}
              onClick={() => showImage(activeImage + 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>

      <div className="project-body">
        <div className="project-meta"><span>{project.number}</span><span>{project.meta}</span></div>
        <h3>{t(project.title)}</h3>
        <p>{t(project.description)}</p>
      </div>
    </article>
  );
}

export default function Portfolio() {
  const [language, setLanguage] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const menuButtonRef = useRef(null);
  const navRef = useRef(null);
  const t = (key) => translations[language][key];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio-lang");
      if (saved === "en" || saved === "id") setLanguage(saved);
    } catch {
      // Storage can be disabled; English remains the default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("portfolio-lang", language);
    } catch {
      // The language still applies to the current page view.
    }
  }, [language]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1040px)");
    const update = () => {
      setIsMobile(media.matches);
      if (!media.matches) setMenuOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    if (menuOpen) navRef.current?.querySelector("a")?.focus();
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const links = [...navRef.current.querySelectorAll("a")];
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const first = links[0];
      const last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        menuButtonRef.current.focus();
      } else if (event.shiftKey && document.activeElement === menuButtonRef.current) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        menuButtonRef.current.focus();
      } else if (!event.shiftKey && document.activeElement === menuButtonRef.current) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );

    navigation.forEach(([, id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    sections.forEach((section) => {
      section.classList.add("reveal-ready");
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setShowBackToTop(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const openMenu = () => {
    setMenuOpen((open) => !open);
  };

  const closeMenu = (returnFocus = false) => {
    setMenuOpen(false);
    if (returnFocus) menuButtonRef.current.focus();
  };

  const submitContact = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      "",
      data.get("message"),
    ].join("\n");
    window.location.href = `mailto:snugroho211@gmail.com?subject=${encodeURIComponent(data.get("subject"))}&body=${encodeURIComponent(body)}`;
  };

  const scrollToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <noscript>
        <p className="noscript-note">JavaScript is only needed for language switching and enhanced navigation. All portfolio content remains available below.</p>
      </noscript>

      <header className="site-header">
        <a href="#home" className="brand" aria-label="Satrio Nugroho, home">
          <Image src="/assets/images/logo.svg" alt="" width="44" height="44" priority />
          <span className="brand-copy">
            <strong>Satrio Nugroho</strong>
            <small>Fullstack Developer</small>
          </span>
        </a>

        <nav
          className="primary-nav"
          id="primaryNav"
          aria-label="Primary navigation"
          aria-hidden={isMobile ? !menuOpen : undefined}
          ref={navRef}
        >
          <p className="mobile-nav-label">{t("navLabel")}</p>
          {navigation.map(([number, id, label]) => (
            <a
              href={`#${id}`}
              className={`nav-link${activeSection === id ? " active" : ""}`}
              aria-current={activeSection === id ? "page" : undefined}
              tabIndex={isMobile && !menuOpen ? -1 : undefined}
              onClick={() => closeMenu()}
              key={id}
            >
              <span>{number}</span><span>{t(label)}</span>
            </a>
          ))}
          <a
            className="mobile-nav-contact"
            href="mailto:snugroho211@gmail.com"
            tabIndex={isMobile && !menuOpen ? -1 : undefined}
            onClick={() => closeMenu()}
          >
            <span>{t("headerContact")}</span><span aria-hidden="true">↗</span>
          </a>
        </nav>

        <div className="header-actions">
          <div className="language-switcher" role="group" aria-label="Choose language">
            {["en", "id"].map((code) => (
              <button
                type="button"
                className={`lang-btn${language === code ? " active" : ""}`}
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
                key={code}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <a className="header-contact" href="mailto:snugroho211@gmail.com">{t("headerContact")}</a>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="primaryNav"
          aria-expanded={menuOpen}
          onClick={openMenu}
          ref={menuButtonRef}
        >
          <span></span><span></span><span></span>
        </button>
      </header>

      <button className="nav-overlay" type="button" aria-label="Close navigation" tabIndex="-1" onClick={() => closeMenu(true)}></button>

      <main id="main-content">
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="availability"><span aria-hidden="true"></span><span>{t("heroStatus")}</span></p>
              <p className="hero-role">{t("heroRole")}</p>
              <h1 id="hero-title">
                <span className="hero-name">Satrio Nugroho</span>
                <span className="hero-statement">{t("heroHeadline")}</span>
              </h1>
              <p className="hero-summary">{t("heroSummary")}</p>

              <div className="hero-cta">
                <a href="#projects" className="btn btn-primary">{t("heroCtaWork")}</a>
                <a href="/assets/documents/Satrio-Nugroho-CV.pdf" download className="btn btn-secondary">{t("heroCtaResume")}</a>
              </div>

              <ul className="focus-list" aria-label="Areas of focus">
                <li>{t("focusBackend")}</li>
                <li>{t("focusIntegration")}</li>
                <li>{t("focusDelivery")}</li>
              </ul>
            </div>

            <figure className="portrait-card">
              <div className="portrait-index" aria-hidden="true">SN / 01</div>
              <div className="portrait-wrap">
                <Image
                  src="/assets/images/photo.png"
                  alt="Portrait of Satrio Nugroho"
                  width="716"
                  height="1074"
                  sizes="(max-width: 760px) calc(100vw - 2rem), 390px"
                  priority
                />
              </div>
              <figcaption>
                <span>{t("portraitLocation")}</span>
                <strong>{t("portraitSectors")}</strong>
              </figcaption>
            </figure>
          </div>

          <a className="scroll-cue" href="#about">
            <span>{t("scrollHint")}</span><span aria-hidden="true">↓</span>
          </a>
        </section>

        <section id="about" className="section" aria-labelledby="about-title" data-reveal>
          <div className="section-heading section-heading-row">
            <div>
              <p className="section-index">01 / PROFILE</p>
              <h2 id="about-title">{t("aboutTitle")}</h2>
            </div>
            <p className="section-lead">{t("aboutP1")}</p>
          </div>

          <div className="about-grid">
            <div className="about-copy">
              <p>{t("aboutP3")}</p>
              <p>{t("aboutP5")}</p>
            </div>

            <dl className="profile-facts">
              <div><dt>{t("profileCore")}</dt><dd>{t("profileCoreValue")}</dd></div>
              <div><dt>{t("profileSectors")}</dt><dd>{t("profileSectorsValue")}</dd></div>
              <div><dt>{t("profileStack")}</dt><dd>Node.js · NestJS · Python · Django · PostgreSQL · React</dd></div>
            </dl>
          </div>

          <div className="capability-list" aria-label="Core capabilities">
            {[
              ["01", "service3Title", "service3Desc"],
              ["02", "service2Title", "service2Desc"],
              ["03", "capabilityIntegrationTitle", "capabilityIntegrationDesc"],
            ].map(([number, title, description]) => (
              <article className="capability-card" key={number}>
                <span>{number}</span><h3>{t(title)}</h3><p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section section-dark" aria-labelledby="experience-title" data-reveal>
          <div className="section-heading section-heading-row">
            <div>
              <p className="section-index">02 / EXPERIENCE</p>
              <h2 id="experience-title">{t("experienceTitle")}</h2>
            </div>
            <p className="section-lead">{t("experienceIntro")}</p>
          </div>

          <div className="experience-list">
            {experienceKeys.map((key, index) => (
              <details className="experience-item" open={index === 0} key={key}>
                <summary>
                  <span className="experience-date">{t(`${key}Date`)}</span>
                  <span className="experience-main"><strong>{t(`${key}Title`)}</strong><small>{t(`${key}Company`)}</small></span>
                  <span className="experience-toggle" aria-hidden="true"></span>
                </summary>
                <div className="experience-detail">
                  <p>{t(`${key}Project`)}</p>
                  <ul>{t(`${key}Duties`).map((duty) => <li key={duty}>{duty}</li>)}</ul>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="projects" className="section" aria-labelledby="projects-title" data-reveal>
          <div className="section-heading section-heading-row">
            <div>
              <p className="section-index">03 / SELECTED WORK</p>
              <h2 id="projects-title">{t("projectsTitle")}</h2>
            </div>
            <p className="section-lead">{t("projectsIntro")}</p>
          </div>

          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard project={project} t={t} key={project.number} />
            ))}
          </div>
        </section>

        <section id="contact" className="section contact-section" aria-labelledby="contact-title" data-reveal>
          <div className="section-heading section-heading-row contact-intro">
            <div>
              <p className="section-index">04 / CONTACT</p>
              <h2 id="contact-title">{t("contactHeading")}</h2>
            </div>
            <p className="section-lead">{t("contactSubheading")}</p>
          </div>

          <div className="contact-layout">
            <form id="contactForm" className="contact-form" onSubmit={submitContact}>
              <div className="form-row">
                <label htmlFor="name"><span>{t("formName")}</span><input type="text" id="name" name="name" autoComplete="name" required placeholder={t("formNamePlaceholder")} /></label>
                <label htmlFor="email"><span>{t("formEmail")}</span><input type="email" id="email" name="email" autoComplete="email" inputMode="email" required placeholder="name@company.com" /></label>
              </div>
              <label htmlFor="subject"><span>{t("formSubject")}</span><input type="text" id="subject" name="subject" required placeholder={t("formSubjectPlaceholder")} /></label>
              <label htmlFor="message"><span>{t("formMessage")}</span><textarea id="message" name="message" rows="5" required placeholder={t("formMessagePlaceholder")}></textarea></label>
              <button type="submit" className="btn btn-primary"><span>{t("formSubmit")}</span><span aria-hidden="true">↗</span></button>
            </form>

            <aside className="contact-panel" aria-label="Contact details">
              <p>{t("contactDirect")}</p>
              <a href="mailto:snugroho211@gmail.com"><span>Email</span><strong>snugroho211@gmail.com</strong></a>
              <a href="https://wa.me/6285229160403" target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>+62 852-2916-0403</strong></a>
              <a href="https://www.linkedin.com/in/nugroho-satrio/" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><strong>/in/nugroho-satrio</strong></a>
              <a href="https://github.com/Nugroho-00" target="_blank" rel="noopener noreferrer"><span>GitHub</span><strong>/Nugroho-00</strong></a>
              <div className="contact-location"><span>{t("contactMethodAddress")}</span><strong>{t("contactAddress")}</strong></div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Satrio Nugroho</p>
        <p>{t("footerNote")}</p>
        <a href="#home">{t("footerBack")}</a>
      </footer>

      <button className={`back-to-top${showBackToTop ? " show" : ""}`} type="button" aria-label="Back to top" onClick={scrollToTop}>↑</button>
    </>
  );
}
