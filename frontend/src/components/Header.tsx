import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import Logo from "./Logo";
import { scrollToSection } from "../utils/scrollToSection";

export default function Header() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", menuOpen);
    return () => document.body.classList.remove("mobile-nav-open");
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const goToSection = (sectionId: string) => {
    setMenuOpen(false);
    if (isHome) {
      scrollToSection(sectionId);
      window.history.replaceState(null, "", `/#${sectionId}`);
      return;
    }
    navigate(`/#${sectionId}`);
  };

  const links = [
    { id: "home", to: "/", label: t("navHome"), section: null as string | null },
    { id: "buyers", to: "/buyers", label: t("navBuyers"), section: null as string | null, page: true },
    { id: "realtors", to: "/realtors", label: t("navRealtors"), section: null as string | null, page: true },
    { id: "pro", to: "/pro", label: t("navPro"), section: null as string | null, page: true },
    { id: "properties", to: "/#properties", label: t("navProperties"), section: "properties" },
    { id: "search", to: "/#search", label: t("navSearch"), section: "search" },
  ];

  const isLinkActive = (link: (typeof links)[number]) => {
    if (link.section) return isHome && location.hash === `#${link.section}`;
    if (link.page) return location.pathname === link.to;
    return isHome && link.to === "/";
  };

  const renderNavLink = (link: (typeof links)[number], mobile = false) => {
    const className = mobile
      ? `mobile-nav-drawer-link${isLinkActive(link) ? " is-active" : ""}`
      : isLinkActive(link)
        ? "nav-link-active text-sm font-medium"
        : "nav-link text-sm font-medium";

    if (link.section) {
      return (
        <button
          key={link.id}
          type="button"
          onClick={() => goToSection(link.section!)}
          className={className}
        >
          {link.label}
        </button>
      );
    }

    return (
      <Link key={link.id} to={link.to} className={className} onClick={() => setMenuOpen(false)}>
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <header className="band band-hero relative z-50 border-b border-white/[0.06]">
        <div className="site-container flex items-center justify-between gap-3 py-3 md:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo size={36} />
            <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
              {t("brand")}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:gap-10 md:flex">
            {links.map((link) => renderNavLink(link))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <CurrencySwitcher className="hidden sm:flex" />
            <LanguageSwitcher />
            <Link to="/account" className="nav-link hidden text-sm font-medium md:inline">
              {t("navAccount")}
            </Link>
            <Link to="/post" className="btn-emerald hidden text-sm sm:inline-flex">
              {t("navPost")}
            </Link>
            <button
              type="button"
              onClick={() => goToSection("search")}
              className="btn-cta hidden text-sm sm:inline-flex"
            >
              {t("ctaGetStarted")}
            </button>
            <button
              type="button"
              className={`mobile-nav-toggle md:hidden${menuOpen ? " is-open" : ""}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className="mobile-nav-toggle-icon" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-nav-backdrop md:hidden${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <aside
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer md:hidden${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-nav-drawer-head">
          <span className="text-sm font-bold text-white/70">{t("brand")}</span>
          <button
            type="button"
            className={`mobile-nav-toggle${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <span className="mobile-nav-toggle-icon" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <nav className="mobile-nav-drawer-links">
          {links.map((link) => renderNavLink(link, true))}
          <Link
            to="/account"
            className={`mobile-nav-drawer-link${location.pathname === "/account" ? " is-active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {t("navAccount")}
          </Link>
        </nav>

        <div className="mobile-nav-drawer-actions">
          <CurrencySwitcher className="w-full justify-center" />
          <Link to="/post" className="btn-emerald" onClick={() => setMenuOpen(false)}>
            {t("navPost")}
          </Link>
          <button
            type="button"
            className="btn-cta"
            onClick={() => goToSection("search")}
          >
            {t("ctaGetStarted")}
          </button>
        </div>
      </aside>
    </>
  );
}
