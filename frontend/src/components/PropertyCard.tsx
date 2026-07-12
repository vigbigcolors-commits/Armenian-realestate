import { useState } from "react";
import type { Property } from "../types";
import { useI18n } from "../i18n";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoney } from "../utils/currency";
import { getPropertyPhoto } from "../utils/images";
import { playQuietClick } from "../utils/quietClick";
import MiniPriceChart from "./MiniPriceChart";
import SourceAttribution from "./SourceAttribution";
import { Link } from "react-router-dom";

interface Props {
  property: Property;
  index: number;
}

function buildPriceSeries(property: Property): number[] {
  const series: number[] = [];
  if (property.owner_price_usd) series.push(property.owner_price_usd);
  if (property.current_price_usd) series.push(property.current_price_usd);
  if (property.duplicate_count > 0 && property.current_price_usd) {
    series.push(property.current_price_usd + property.duplicate_count * 30);
  }
  return series.length >= 2 ? series : series.length === 1 ? [series[0], series[0]] : [];
}

export default function PropertyCard({ property, index }: Props) {
  const { t, td } = useI18n();
  const { currency } = useCurrency();
  const [imgBroken, setImgBroken] = useState(false);
  const isRent = property.deal_type === "rent";
  const photo = getPropertyPhoto(property);
  const priceSeries = buildPriceSeries(property);

  // Объявления без рабочего фото никому не нужны: если фото нет или оно
  // «битое» (мёртвая ссылка на CDN), карточку не показываем вовсе.
  if (!photo || imgBroken) return null;
  const pricePerSqmUsd =
    property.current_price_usd && property.area_sqm
      ? property.current_price_usd / Number(property.area_sqm)
      : null;

  const title = property.title || `${property.rooms ?? "?"} ${t("roomUnit")} · ${td(property.district || "")}`;
  const priceLabel = formatMoney(
    property.current_price_usd,
    currency,
    { compact: !isRent },
  );

  return (
    <div className="property-card group">
      {/* «Растянутая» ссылка перекрывает всю карточку → переход к деталке,
          но бейдж источника лежит выше по z-index и кликается отдельно. */}
      <Link
        to={`/property/${property.id}`}
        className="property-card-stretch"
        aria-label={title}
        onMouseEnter={() => playQuietClick(property.id)}
      />

      <div className="property-card-media">
        <img
          src={photo}
          alt=""
          className="property-card-img"
          loading="lazy"
          onError={() => setImgBroken(true)}
        />
        <div className="property-card-media-fade" aria-hidden />
        <span className="property-card-deal">
          {isRent ? t("dealRent") : t("dealSale")}
        </span>
        <span className="property-card-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        {property.is_owner_verified && (
          <span className="property-card-badge">{t("verifiedBadge")}</span>
        )}
        <SourceAttribution url={property.source_url} site={property.source_site} variant="badge" />
      </div>

      <div className="property-card-body">
        <div className="property-card-content">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="property-card-title">{title}</h3>
              <p className="property-card-street">{property.street || "—"}</p>
            </div>
            <MiniPriceChart prices={priceSeries} width={64} height={24} variant="light" />
          </div>
        </div>

        <div className="property-card-price-row">
          <div className="property-card-price-main">
            <span className="property-card-price-value">
              {priceLabel}
              {isRent && <span className="property-card-price-period">{t("perMonth")}</span>}
            </span>
            {pricePerSqmUsd != null && (
              <span className="property-card-price-sqm">
                {formatMoney(pricePerSqmUsd, currency)}
                {t("perSqm")}
              </span>
            )}
          </div>
          <div className="property-card-specs">
            {property.area_sqm != null && <span>{property.area_sqm} {t("area")}</span>}
            {property.floor != null && (
              <span>{property.floor}/{property.total_floors ?? "?"} {t("floor")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
