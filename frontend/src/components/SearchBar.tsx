import type { FormEvent } from "react";
import { useI18n } from "../i18n";
import { LOCATION_GROUPS } from "../i18n/content";
import PriceRangeSlider from "./PriceRangeSlider";
import CurrencySwitcher from "./CurrencySwitcher";
import { useCurrency } from "../context/CurrencyContext";
import { useRates } from "../utils/useRates";

const DATE_OPTIONS: { value: string; key: "dateAny" | "dateToday" | "date3Days" | "dateWeek" | "dateMonth" }[] = [
  { value: "", key: "dateAny" },
  { value: "today", key: "dateToday" },
  { value: "3d", key: "date3Days" },
  { value: "week", key: "dateWeek" },
  { value: "month", key: "dateMonth" },
];

interface Props {
  dealType: "rent" | "sale";
  query: string;
  district: string;
  rooms: number | "";
  priceMin: number;
  priceMax: number;
  priceBounds: { min: number; max: number };
  dateFilter: string;
  onDealType: (v: "rent" | "sale") => void;
  onQuery: (v: string) => void;
  onDistrict: (v: string) => void;
  onRooms: (v: number | "") => void;
  onPriceChange: (min: number, max: number) => void;
  onDateFilter: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}

function GlassBulb() {
  return (
    <svg className="search-panel-bulb" viewBox="0 0 48 48" aria-hidden>
      <defs>
        <radialGradient id="bulbGlass" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#eaf7ff" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#7dd3fc" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="bulbBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      {/* стеклянная колба */}
      <path
        d="M24 5c-7.7 0-14 6.1-14 13.6 0 5 2.6 8.6 5.2 11 1.4 1.3 2.3 2.6 2.6 4.2h12.4c.3-1.6 1.2-2.9 2.6-4.2 2.6-2.4 5.2-6 5.2-11C38 11.1 31.7 5 24 5z"
        fill="url(#bulbGlass)"
        stroke="#38bdf8"
        strokeWidth="1.4"
      />
      {/* нить накала */}
      <path
        d="M20 24c1.2-2.2 2.4-2.2 4-2.2s2.8 0 4 2.2"
        fill="none"
        stroke="#bae6fd"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M22 21.8v-4M26 21.8v-4" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
      {/* блик стекла */}
      <ellipse cx="18.5" cy="15" rx="3" ry="4.5" fill="#ffffff" opacity="0.55" transform="rotate(-20 18.5 15)" />
      {/* цоколь */}
      <rect x="18.5" y="38.2" width="11" height="3" rx="1" fill="url(#bulbBase)" />
      <rect x="19.5" y="41.4" width="9" height="2.4" rx="1" fill="url(#bulbBase)" />
      <rect x="20.5" y="43.9" width="7" height="2" rx="1" fill="#64748b" />
    </svg>
  );
}

export default function SearchBar({
  dealType,
  query,
  district,
  rooms,
  priceMin,
  priceMax,
  priceBounds,
  dateFilter,
  onDealType,
  onQuery,
  onDistrict,
  onRooms,
  onPriceChange,
  onDateFilter,
  onSubmit,
}: Props) {
  const { t, td, locale } = useI18n();
  const { formatSlider } = useCurrency();
  const rates = useRates();
  const isRent = dealType === "rent";

  return (
    <form onSubmit={onSubmit} className="search-panel">
      <div className="search-panel-toolbar">
        <div className="search-panel-brand">
          <GlassBulb />
          <span className="search-panel-brand-text">SmartSearch</span>
        </div>
        <div className="search-panel-toolbar-right">
          <div className="search-panel-rates" aria-label={t("ratesLabel")}>
            <span className="search-panel-rate">
              <b>1&thinsp;$</b>&nbsp;=&nbsp;{rates.amdPerUsd}&thinsp;֏
            </span>
            <span className="search-panel-rate-sep" aria-hidden>·</span>
            <span className="search-panel-rate">
              <b>1&thinsp;$</b>&nbsp;=&nbsp;{rates.rubPerUsd}&thinsp;₽
            </span>
            <span className="search-panel-rate-sep" aria-hidden>·</span>
            <span className="search-panel-rate">
              <b>1&thinsp;₽</b>&nbsp;=&nbsp;{rates.amdPerRub}&thinsp;֏
            </span>
            <span className={rates.live ? "search-panel-rate-live" : "search-panel-rate-live search-panel-rate-live-off"} aria-hidden />
          </div>
          <CurrencySwitcher />
        </div>
      </div>

      <div className="search-panel-query">
        <label className="search-panel-field-label search-panel-field-label-query" htmlFor="search-query">
          {t("searchQueryLabel")}
        </label>
        <div className="search-panel-query-row">
          <div className="search-panel-input-wrap search-panel-input-wrap-hero">
            <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="search-panel-input search-panel-input-hero"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="search-panel-submit">
            {t("searchButton")} →
          </button>
        </div>
        <p className="search-panel-hint">{t("searchHint")}</p>
      </div>

      <div className="search-panel-body">
        <div className="search-panel-col search-panel-col-deal">
          <span className="search-panel-field-label">{t("dealType")}</span>
          <div className="search-panel-col-control">
            <div className="search-panel-toggle">
              {(["rent", "sale"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onDealType(type)}
                  className={dealType === type ? "search-panel-toggle-active" : "search-panel-toggle-item"}
                >
                  {type === "rent" ? t("dealRent") : t("dealSale")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="search-panel-col search-panel-col-rooms">
          <span className="search-panel-field-label">{t("rooms")}</span>
          <div className="search-panel-col-control">
            <div className="search-panel-room-chips">
              <button
                type="button"
                className={rooms === "" ? "search-room-chip search-room-chip-active" : "search-room-chip"}
                onClick={() => onRooms("")}
              >
                {t("anyRooms")}
              </button>
              {[1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={rooms === r ? "search-room-chip search-room-chip-active" : "search-room-chip"}
                  onClick={() => onRooms(r)}
                >
                  {r}+
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="search-panel-col search-panel-col-price">
          <span className="search-panel-field-label">
            {t("priceRange")}{isRent ? t("perMonth") : ""}
          </span>
          <div className="search-panel-col-control search-panel-col-control-slider">
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={onPriceChange}
              formatLabel={formatSlider}
            />
          </div>
        </div>

        <div className="search-panel-col search-panel-col-location">
          <span className="search-panel-field-label">{t("district")}</span>
          <div className="search-panel-col-control">
            <select
              value={district}
              onChange={(e) => onDistrict(e.target.value)}
              className="search-panel-select"
            >
              <option value="">{t("allDistricts")}</option>
              {LOCATION_GROUPS.map((group) => (
                <optgroup key={group.label.ru} label={group.label[locale]}>
                  {group.keys.map((d) => (
                    <option key={d} value={d}>{td(d)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="search-panel-col search-panel-col-date">
          <span className="search-panel-field-label">{t("dateAdded")}</span>
          <div className="search-panel-col-control">
            <select
              value={dateFilter}
              onChange={(e) => onDateFilter(e.target.value)}
              className="search-panel-select"
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
