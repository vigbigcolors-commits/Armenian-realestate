import { Link } from "react-router-dom";
import { useI18n, type ContentKey } from "../i18n";
import PaymentPanel from "../components/PaymentPanel";
import ProToolShowcase from "../components/pro/ProToolShowcase";
import { TELEGRAM_BOT_URL } from "../utils/clientToken";

const FLAGSHIP_TOOLS: {
  id: string;
  badge: ContentKey;
  title: ContentKey;
  inside: ContentKey;
  why: ContentKey;
  tone: "sage" | "forest" | "clay";
  layout: "wide" | "tall" | "wide";
}[] = [
  {
    id: "golden-lead",
    badge: "proTool1Badge",
    title: "proTool1Title",
    inside: "proTool1Inside",
    why: "proTool1Why",
    tone: "sage",
    layout: "wide",
  },
  {
    id: "bargain-report",
    badge: "proTool2Badge",
    title: "proTool2Title",
    inside: "proTool2Inside",
    why: "proTool2Why",
    tone: "forest",
    layout: "tall",
  },
  {
    id: "parasite-radar",
    badge: "proTool3Badge",
    title: "proTool3Title",
    inside: "proTool3Inside",
    why: "proTool3Why",
    tone: "clay",
    layout: "wide",
  },
];

export default function ProRoomPage() {
  const { t } = useI18n();

  return (
    <div className="pro-room-page pro-room-page-nature">
      <section className="pro-room-hero-nature">
        <div className="pro-room-hero-slice" aria-hidden />
        <div className="pro-room-hero-texture" aria-hidden />

        <div className="site-container pro-room-hero-inner">
          <div className="pro-room-hero-panel">
            <p className="pro-room-eyebrow-nature">{t("proRoomEyebrow")}</p>
            <h1 className="pro-room-title-nature">{t("proRoomHero")}</h1>
            <p className="pro-room-lead-nature">{t("proRoomLead")}</p>
            <div className="pro-room-hero-actions-nature">
              <a href="#pro-tools" className="pro-room-btn-primary">{t("proRoomExplore")}</a>
              <a href="#pro-subscribe" className="pro-room-btn-ghost">{t("mktProCta")}</a>
            </div>
          </div>

          <div className="pro-room-stats-mosaic" aria-label="Pro metrics">
            <div className="pro-room-stat-pebble pro-room-stat-pebble-a">
              <span className="pro-room-stat-value-nature">5 {t("proRoomStatSec")}</span>
              <span className="pro-room-stat-label-nature">{t("proRoomStat1")}</span>
            </div>
            <div className="pro-room-stat-pebble pro-room-stat-pebble-b">
              <span className="pro-room-stat-value-nature">99%</span>
              <span className="pro-room-stat-label-nature">{t("proRoomStat2")}</span>
            </div>
            <div className="pro-room-stat-pebble pro-room-stat-pebble-c">
              <span className="pro-room-stat-value-nature">1 {t("proRoomStatHour")}</span>
              <span className="pro-room-stat-label-nature">{t("proRoomStat3")}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="pro-tools" className="pro-room-tools-nature">
        <div className="site-container">
          <div className="pro-room-tools-header">
            <p className="pro-room-eyebrow-nature">{t("proRoomToolsEyebrow")}</p>
            <h2 className="pro-room-tools-title">{t("proRoomToolsTitle")}</h2>
            <p className="pro-room-tools-lead-nature">{t("proRoomToolsLead")}</p>
          </div>

          <div className="pro-room-bento">
            {FLAGSHIP_TOOLS.map((tool, i) => (
              <ProToolShowcase
                key={tool.id}
                id={tool.id}
                index={i + 1}
                badge={t(tool.badge)}
                title={t(tool.title)}
                inside={t(tool.inside)}
                why={t(tool.why)}
                tone={tool.tone}
                layout={tool.layout}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pro-subscribe" className="pro-room-subscribe-nature">
        <div className="site-container">
          <div className="pro-room-subscribe-layout">
            <div className="pro-room-subscribe-copy">
              <p className="pro-room-eyebrow-nature">{t("mktProSectionEyebrow")}</p>
              <h2 className="pro-room-subscribe-title">{t("proRoomSubscribeTitle")}</h2>
              <p className="pro-room-subscribe-lead">{t("proRoomSubscribeLead")}</p>
              <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className="pro-room-telegram-link">
                {t("mktProTelegram")} →
              </a>
            </div>
            <aside className="pro-room-subscribe-card">
              <h3 className="pro-room-subscribe-card-name">{t("mktProTitle")}</h3>
              <p className="pro-room-subscribe-card-price">{t("mktProPrice")}</p>
              <p className="pro-room-subscribe-card-note">{t("mktProPriceNote")}</p>
              <PaymentPanel mode="pro" />
            </aside>
          </div>
          <p className="pro-room-back-nature">
            <Link to="/realtors">← {t("proRoomBackRealtors")}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
