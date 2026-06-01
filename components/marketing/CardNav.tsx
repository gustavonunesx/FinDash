"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { IconArrowUpRight } from "@tabler/icons-react";
import "./CardNav.css";

interface NavLink {
  label: string;
  href?: string;
  ariaLabel?: string;
}

interface CardNavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links?: NavLink[];
}

interface CardNavProps {
  logoText?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export function CardNav({
  logoText = "FinDash",
  items,
  className = "",
  ease = "power3.out",
  baseColor = "transparent",
  menuColor = "#f0f0f5",
  buttonBgColor = "#1d9e75",
  buttonTextColor = "#f0f0f5",
  buttonLabel = "Começar grátis",
  buttonHref = "/cadastro",
}: CardNavProps) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector<HTMLElement>(".card-nav-content");
      if (contentEl) {
        const prev = {
          visibility: contentEl.style.visibility,
          pointerEvents: contentEl.style.pointerEvents,
          position: contentEl.style.position,
          height: contentEl.style.height,
        };

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";
        contentEl.offsetHeight;

        const total = 56 + contentEl.scrollHeight + 16;

        contentEl.style.visibility = prev.visibility;
        contentEl.style.pointerEvents = prev.pointerEvents;
        contentEl.style.position = prev.position;
        contentEl.style.height = prev.height;

        return total;
      }
    }
    return 256;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 56, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.38, ease });
    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.07 },
      "-=0.1"
    );
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        gsap.set(navRef.current, { height: calculateHeight() });
        tlRef.current.kill();
        const tl = createTimeline();
        if (tl) { tl.progress(1); tlRef.current = tl; }
      } else {
        tlRef.current.kill();
        const tl = createTimeline();
        if (tl) tlRef.current = tl;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
      >
        {/* top bar */}
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Fechar menu" : "Abrir menu"}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
            style={{ color: menuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <span className="card-nav-logo">{logoText}</span>

          <a
            href={buttonHref}
            className="card-nav-cta-button"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            {buttonLabel}
          </a>
        </div>

        {/* expandable cards */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={(el) => { if (el) cardsRef.current[idx] = el; }}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href ?? "#"}
                    aria-label={lnk.ariaLabel}
                  >
                    <IconArrowUpRight size={13} className="nav-card-link-icon" aria-hidden />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
