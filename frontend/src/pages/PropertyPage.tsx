import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProperty } from "../api/client";
import type { PropertyDetail } from "../types";
import { useI18n } from "../i18n";
import { useCurrency } from "../context/CurrencyContext";
import PriceChart from "../components/PriceChart";
import BrokerAnalysis from "../components/BrokerAnalysis";
import PropertyGallery from "../components/PropertyGallery";
import { collectPropertyPhotos, getPropertyDescription } from "../utils/propertyPhotos";
import { formatPropertyDescription } from "../utils/formatDescription";
import SourceAttribution from "../components/SourceAttribution";

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { t, td, locale } = useI18n();
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProperty(id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="band band-properties py-32 text-center text-white/30">
        <div className="site-container">{t("loading")}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="band band-properties py-32 text-center">
        <div className="site-container">
          <p className="text-white/50">{t("notFound")}</p>
          <Link to="/" className="mt-4 inline-block text-accent-glow hover:underline">
            {t("backToSearch")}
          </Link>
        </div>
      </div>
    );
  }

  const { property, price_history, all_listings, duplicate_count } = data;
  const contactPhone = data.contact_phone ?? property.contact_phone ?? null;
  const contactEmail = data.contact_email ?? property.contact_email ?? null;
  const contactName = data.contact_name ?? property.contact_name ?? null;
  const contactAvailable = Boolean(contactPhone || contactEmail) || (data.contact_available ?? property.contact_available ?? false);
  const isRent = property.deal_type === "rent";
  const photos = collectPropertyPhotos(property, all_listings);
  const descriptionRaw = getPropertyDescription(
    property.description_clean,
    property.description_raw,
    locale,
  );
  const description = descriptionRaw
    ? formatPropertyDescription(descriptionRaw, locale)
    : "";

  return (
    <article className="band band-properties min-h-[60vh] py-6 md:py-8">
      <div className="site-container">
        <Link to="/#properties" className="text-sm text-white/45 hover:text-accent-glow">
          {t("backToSearch")}
        </Link>

        <div className="mt-4">
          <PropertyGallery photos={photos} propertyId={property.id} />
        </div>

        <header className="property-detail-header mt-5">
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">
              {property.title || `${property.rooms} ${t("roomUnit")} · ${td(property.district || "")}`}
            </h1>
            <p className="mt-2 text-white/45">{property.street}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {property.rooms != null && (
                <span className="property-detail-chip">{property.rooms} {t("roomUnit")}</span>
              )}
              {property.area_sqm != null && (
                <span className="property-detail-chip">{property.area_sqm} {t("area")}</span>
              )}
              {property.floor != null && (
                <span className="property-detail-chip">
                  {property.floor}/{property.total_floors ?? "?"} {t("floor")}
                </span>
              )}
              {property.is_owner_verified && (
                <span className="property-detail-chip property-detail-chip-verified">{t("verifiedBadge")}</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                  {isRent ? t("dealRent") : t("dealSale")} · {t("currentPrice")}
                </p>
                <div className="font-mono text-3xl font-semibold text-white">
                  {formatPrice(property.current_price_usd)}
                  {isRent && <span className="text-lg text-white/40">{t("perMonth")}</span>}
                </div>
                {property.owner_price_usd != null && property.owner_price_usd < (property.current_price_usd ?? 0) && (
                  <p className="mt-1 text-sm text-emerald-400">
                    {t("ownerPrice")}: {formatPrice(property.owner_price_usd)}
                  </p>
                )}
              </div>
              {duplicate_count > 0 && (
                <span className="rounded-md border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/55">
                  −{duplicate_count} {t("duplicatesRemoved")}
                </span>
              )}
            </div>

            {property.source_url && (
              <div className="mt-5">
                <SourceAttribution
                  url={property.source_url}
                  site={property.source_site}
                  variant="full"
                />
              </div>
            )}
        </header>

        <section className="detail-card mt-5">
          <h2 className="text-lg font-bold text-white">
            {description ? t("propertyDescription") : t("propertyPlatformTitle")}
          </h2>
          <p className="mt-1 text-xs text-white/40">
            {description ? t("propertyDescriptionNote") : t("propertyPlatformFocus")}
          </p>
          {description ? (
            <div className="property-description mt-4 text-sm leading-relaxed text-white/75">
              {description.split("\n").map((line, i) => (
                line.startsWith("• ")
                  ? <p key={i} className="property-description-bullet">{line}</p>
                  : <p key={i}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/75">
              <p>{t("propertyPlatformSummary")}</p>
              <ul className="property-platform-list">
                <li>{t("propertyPlatformPoint1")}</li>
                <li>{t("propertyPlatformPoint2")}</li>
                <li>{t("propertyPlatformPoint3")}</li>
              </ul>
            </div>
          )}
        </section>

        <section className="detail-card-light mt-4">
          <h2 className="text-lg font-bold text-slate-900">{t("priceHistory")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("priceHistoryDesc")}</p>
          <div className="mt-4">
            <PriceChart history={price_history} dealType={property.deal_type} variant="light" />
          </div>
        </section>

        <section className="detail-card mt-4">
          <h2 className="text-lg font-bold text-white">{t("brokerAnalysis")}</h2>
          <p className="mt-1 text-sm text-white/45">{t("brokerAnalysisDesc")}</p>
          <div className="mt-6">
            <BrokerAnalysis listings={all_listings} ownerPrice={property.owner_price_usd ?? null} />
          </div>
        </section>

        <section className="detail-card mt-4">
          <h2 className="text-lg font-bold text-white">{t("directContact")}</h2>
          <p className="mt-1 text-sm text-white/45">{t("directContactDesc")}</p>
          <div className="mt-6">
            {contactPhone ? (
              <div className="payment-panel payment-panel-success">
                {contactName && <p className="payment-panel-label">{contactName}</p>}
                <a href={`tel:+${contactPhone.replace(/\D/g, "")}`} className="payment-panel-phone">
                  +{contactPhone}
                </a>
              </div>
            ) : contactEmail ? (
              <div className="payment-panel payment-panel-success">
                {contactName && <p className="payment-panel-label">{contactName}</p>}
                <a href={`mailto:${contactEmail}`} className="payment-panel-phone">
                  {contactEmail}
                </a>
              </div>
            ) : contactAvailable ? (
              <div className="payment-panel">
                <p className="payment-panel-hint">{t("payNoPhone")}</p>
              </div>
            ) : (
              <div className="payment-panel">
                <p className="payment-panel-hint">{t("payNoPhone")}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
