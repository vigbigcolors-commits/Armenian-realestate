import { Link } from "react-router-dom";
import { useI18n, type ContentKey } from "../i18n";
import PaymentPanel from "../components/PaymentPanel";
import MarketingHeroVisual from "../components/MarketingHeroVisual";
import { TELEGRAM_BOT_URL } from "../utils/clientToken";

const AUDIENCES: { title: ContentKey; lead: ContentKey; accent: string; icon: string }[] = [
  { title: "mktRealtorsForProTitle", lead: "mktRealtorsForProLead", accent: "pro", icon: "⚡" },
  { title: "mktRealtorsForOwnersTitle", lead: "mktRealtorsForOwnersLead", accent: "owner", icon: "🏠" },
  { title: "mktRealtorsForBuyersTitle", lead: "mktRealtorsForBuyersLead", accent: "buyer", icon: "🔍" },
];

const FLAGSHIP: { title: ContentKey; lead: ContentKey; tone: string; anchor: string }[] = [
  { title: "proTool1Title", lead: "proTool1Short", tone: "sage", anchor: "golden-lead" },
  { title: "proTool2Title", lead: "proTool2Short", tone: "forest", anchor: "bargain-report" },
  { title: "proTool3Title", lead: "proTool3Short", tone: "clay", anchor: "parasite-radar" },
];

function MarketingDeco() {
  return (
    <div className="marketing-deco" aria-hidden>
      <div className="marketing-deco-blob marketing-deco-blob-a" />
      <div className="marketing-deco-blob marketing-deco-blob-b" />
      <div className="marketing-deco-blob marketing-deco-blob-c" />
    </div>
  );
}

export default function RealtorsPage() {
  const { t } = useI18n();

  return (
    <div className="marketing-page">
      <section className="marketing-hero band band-hero relative overflow-hidden">
        <MarketingDeco />
        <div className="site-container relative py-16 md:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="marketing-eyebrow">{t("mktRealtorsEyebrow")}</p>
              <h1 className="marketing-title">{t("mktRealtorsHero")}</h1>
              <p className="marketing-lead">{t("mktRealtorsLead")}</p>
              <div className="marketing-hero-actions">
                <Link to="/pro" className="btn-cta btn-primary-lg">{t("proRoomEnter")}</Link>
                <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className="btn-outline btn-outline-lg">
                  {t("mktProTelegram")}
                </a>
                <Link to="/#search" className="btn-emerald btn-primary-lg">{t("heroCtaPrimary")}</Link>
              </div>
            </div>
            <MarketingHeroVisual webp="/realtors-hero.webp" />
          </div>
        </div>
      </section>

      <section className="pro-room-banner-nature band py-10 md:py-14">
        <div className="site-container">
          <Link to="/pro" className="pro-room-banner-nature-card">
            <div className="pro-room-banner-nature-copy">
              <p className="pro-room-banner-nature-eyebrow">{t("proRoomBannerEyebrow")}</p>
              <h2 className="pro-room-banner-nature-title">{t("proRoomBannerTitle")}</h2>
              <p className="pro-room-banner-nature-lead">{t("proRoomBannerLead")}</p>
              <span className="pro-room-banner-nature-cta">{t("proRoomEnter")} →</span>
            </div>
            <div className="pro-room-banner-nature-accent" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="band band-properties py-16 md:py-24 relative overflow-hidden">
        <MarketingDeco />
        <div className="site-container relative">
          <p className="marketing-eyebrow">{t("proRoomToolsEyebrow")}</p>
          <h2 className="marketing-section-title text-3xl md:text-4xl">{t("mktRealtorsFlagshipTitle")}</h2>
          <p className="pro-room-tools-lead">{t("mktRealtorsFlagshipLead")}</p>
          <div className="pro-flagship-nature-grid">
            {FLAGSHIP.map((tool, i) => (
              <Link key={tool.anchor} to={`/pro#${tool.anchor}`} className={`pro-flagship-nature pro-flagship-nature-${tool.tone}`}>
                <span className="pro-flagship-nature-index">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pro-flagship-nature-title">{t(tool.title)}</h3>
                <p className="pro-flagship-nature-lead">{t(tool.lead)}</p>
                <span className="pro-flagship-nature-link">{t("proRoomLearnMore")} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band band-search py-14 md:py-20 relative overflow-hidden marketing-section-on-light">
        <div className="site-container relative">
          <p className="marketing-eyebrow marketing-eyebrow-dark">{t("mktRealtorsAudienceTitle")}</p>
          <h2 className="marketing-section-title">{t("mktRealtorsAudienceTitle")}</h2>
          <div className="marketing-audience-grid">
            {AUDIENCES.map((a) => (
              <article key={a.title} className={`marketing-audience-card marketing-audience-${a.accent}`}>
                <span className="marketing-audience-icon" aria-hidden>{a.icon}</span>
                <h3 className="marketing-audience-title">{t(a.title)}</h3>
                <p className="marketing-audience-lead">{t(a.lead)}</p>
              </article>
            ))}
          </div>
          <div className="marketing-audience-links">
            <Link to="/buyers" className="btn-emerald">{t("mktRealtorsBuyersLink")}</Link>
            <Link to="/post" className="btn-violet">{t("mktRealtorsPostLink")}</Link>
          </div>
        </div>
      </section>

      <section id="pro-subscribe" className="marketing-pro-section band py-20 md:py-28">
        <MarketingDeco />
        <div className="site-container relative">
          <div className="marketing-pro-finale">
            <div className="marketing-pro-finale-copy">
              <p className="marketing-eyebrow">{t("mktProSectionEyebrow")}</p>
              <h2 className="marketing-pro-finale-title">{t("mktProSectionTitle")}</h2>
              <p className="marketing-pro-finale-lead">{t("mktProSectionLead")}</p>
              <Link to="/pro" className="marketing-pro-telegram-link">{t("proRoomEnter")} →</Link>
            </div>
            <aside className="marketing-pro-finale-card">
              <div className="marketing-pro-finale-card-header">
                <h3 className="marketing-pro-finale-card-name">{t("mktProTitle")}</h3>
                <p className="marketing-pro-finale-card-price">{t("mktProPrice")}</p>
                <p className="marketing-pro-finale-card-note">{t("mktProPriceNote")}</p>
              </div>
              <PaymentPanel mode="pro" />
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
