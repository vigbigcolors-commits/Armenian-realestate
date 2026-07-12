import { Link } from "react-router-dom";
import { useI18n, type ContentKey } from "../i18n";
import FlowDiagram from "../components/marketing/FlowDiagram";
import BuyersBenefitsMosaic from "../components/marketing/BuyersBenefitsMosaic";
import MarketingHeroVisual from "../components/MarketingHeroVisual";

const SELLER_POINTS: ContentKey[] = [
  "mktBuyersSeller1",
  "mktBuyersSeller2",
  "mktBuyersSeller3",
  "mktBuyersSeller4",
];

const FREE_ITEMS: ContentKey[] = [
  "mktBuyersBenefit4",
  "mktBuyersBenefit2",
  "mktBuyersBenefit3",
  "mktBuyersBenefit6",
];

export default function BuyersPage() {
  const { t } = useI18n();

  return (
    <div className="marketing-page">
      <section className="marketing-hero band band-hero relative overflow-hidden">
        <div className="marketing-deco" aria-hidden>
          <div className="marketing-deco-blob marketing-deco-blob-a" />
          <div className="marketing-deco-blob marketing-deco-blob-c" />
        </div>
        <div className="site-container relative py-16 md:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="marketing-eyebrow">{t("mktBuyersEyebrow")}</p>
              <h1 className="marketing-title">{t("mktBuyersHero")}</h1>
              <p className="marketing-lead">{t("mktBuyersLead")}</p>
              <Link to="/#search" className="btn-cta btn-primary-lg mt-8 inline-flex">
                {t("mktBuyersCta")} →
              </Link>
            </div>
            <MarketingHeroVisual webp="/buyers-hero.webp" />
          </div>
        </div>
      </section>

      <section className="band band-search py-14 md:py-20">
        <div className="site-container">
          <FlowDiagram />
        </div>
      </section>

      <section className="band band-properties buyers-benefits-section relative overflow-hidden py-16 md:py-24">
        <div className="buyers-benefits-bg" aria-hidden />
        <div className="site-container relative">
          <p className="marketing-eyebrow">{t("mktBuyersSystemTitle")}</p>
          <h2 className="marketing-section-title text-3xl md:text-4xl">{t("mktBuyersSystemTitle")}</h2>
          <BuyersBenefitsMosaic />
        </div>
      </section>

      <section className="band band-why py-16 md:py-24">
        <div className="site-container">
          <div className="marketing-seller-block">
            <h2 className="marketing-section-title text-2xl md:text-3xl">{t("mktBuyersSellerTitle")}</h2>
            <p className="marketing-lead mt-4">{t("mktBuyersSellerLead")}</p>
            <ul className="marketing-pro-feature-list mt-8">
              {SELLER_POINTS.map((key) => (
                <li key={key}>
                  <span className="marketing-pro-check" aria-hidden>✓</span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="band band-search py-16 md:py-24">
        <div className="site-container">
          <div className="marketing-free-banner">
            <h2>{t("mktBuyersFreeBanner")}</h2>
            <p>{t("mktBuyersFreeDesc")}</p>
            <div className="marketing-free-list">
              {FREE_ITEMS.map((k) => (
                <span key={k}>{t(k)}</span>
              ))}
            </div>
            <Link to="/#search" className="btn-cta btn-primary-lg mt-8 inline-flex">
              {t("mktBuyersCta")} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
