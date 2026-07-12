import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { searchProperties, getStats, getPriceBounds } from "../api/client";
import type { Property, PlatformStats } from "../types";
import { useI18n } from "../i18n";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { useCurrency } from "../context/CurrencyContext";
import { getHomeSearchCache, setHomeSearchCache } from "../utils/homeSearchCache";
import StatsBar from "../components/StatsBar";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import PropertyMap from "../components/PropertyMap";
import HeroVisual from "../components/HeroVisual";
import HeroBackdrop from "../components/HeroBackdrop";
import HeroAdvantages from "../components/HeroAdvantages";
import HowItWorks from "../components/HowItWorks";
import { usdToDisplay, displayToUsd } from "../utils/currency";
import { scrollToSection } from "../utils/scrollToSection";
import WhyPlatform from "../components/WhyPlatform";

const PAGE_SIZE = 24;
const SALE_MIN_USD = 12_000;
const RENT_MAX_USD = 15_000;

function dateFilterToIso(preset: string): string | null {
  if (!preset) return null;
  const now = new Date();
  const days: Record<string, number> = { today: 1, "3d": 3, week: 7, month: 30 };
  const d = days[preset];
  if (!d) return null;
  const from = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  return from.toISOString();
}

function filterByDealType(items: Property[], dealType: "rent" | "sale"): Property[] {
  return items.filter((p) => {
    if (p.deal_type !== dealType) return false;
    const price = p.current_price_usd ?? 0;
    if (dealType === "sale") return price >= SALE_MIN_USD;
    return price > 0 && price <= RENT_MAX_USD;
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { currency, ratesLive } = useCurrency();
  const initialCache = useMemo(() => getHomeSearchCache(), []);
  const restoredScroll = useRef(false);
  const boundsScaleRef = useRef<string | null>(null);

  const [properties, setProperties] = useState<Property[]>(initialCache?.properties ?? []);
  const [stats, setStats] = useState<PlatformStats | null>(initialCache?.stats ?? null);
  const [loading, setLoading] = useState(!(initialCache?.properties.length));
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(initialCache?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? false);
  const propertiesRef = useRef<Property[]>(initialCache?.properties ?? []);

  const [dealType, setDealType] = useState<"rent" | "sale">(initialCache?.dealType ?? "sale");
  const [query, setQuery] = useState(initialCache?.query ?? "");
  const [district, setDistrict] = useState(initialCache?.district ?? "");
  const [rooms, setRooms] = useState<number | "">(initialCache?.rooms ?? "");
  const [priceMin, setPriceMin] = useState(initialCache?.priceMin ?? 0);
  const [priceMax, setPriceMax] = useState(initialCache?.priceMax ?? 3000);
  const [priceBounds, setPriceBounds] = useState(initialCache?.priceBounds ?? { min: 0, max: 3000 });
  const [showMap, setShowMap] = useState(initialCache?.showMap ?? false);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [relaxedNote, setRelaxedNote] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 400);
  const debouncedDistrict = useDebouncedValue(district, 300);
  const debouncedRooms = useDebouncedValue(rooms, 200);
  const debouncedPriceMin = useDebouncedValue(priceMin, 280);
  const debouncedPriceMax = useDebouncedValue(priceMax, 280);

  useEffect(() => {
    propertiesRef.current = properties;
  }, [properties]);

  useEffect(() => {
    if (restoredScroll.current || !initialCache?.scrollY) return;
    restoredScroll.current = true;
    requestAnimationFrame(() => {
      window.scrollTo(0, initialCache.scrollY);
    });
  }, [initialCache?.scrollY]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToSection(hash), 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const scaleKey = `${dealType}|${currency}`;
    // Первый рендер с совпадающим типом сделки — уважаем сохранённый выбор
    // пользователя. При смене типа/валюты — всегда сбрасываем на полный диапазон,
    // иначе числа остаются в старой валюте (напр. AMD-значения в режиме RUB).
    const isFirst = boundsScaleRef.current === null;
    const keepCached = isFirst && !!initialCache && initialCache.dealType === dealType;
    boundsScaleRef.current = scaleKey;

    const apply = (minUsd: number, maxUsd: number) => {
      const minD = usdToDisplay(minUsd, currency);
      const maxD = usdToDisplay(maxUsd, currency);
      setPriceBounds({ min: minD, max: maxD });
      if (!keepCached) {
        setPriceMin(minD);
        setPriceMax(maxD);
      }
    };

    getPriceBounds(dealType)
      .then((b) => apply(b.min_price, b.max_price))
      .catch(() => {
        const fb = dealType === "rent" ? { min: 0, max: 5000 } : { min: 0, max: 500000 };
        apply(fb.min, fb.max);
      });
    // пересчитываем при смене типа сделки, валюты и появлении живого курса
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealType, currency, ratesLive]);

  const buildParams = useCallback((nextOffset: number) => {
    const params: Record<string, string | number> = {
      deal_type: dealType,
      limit: PAGE_SIZE,
      offset: nextOffset,
    };
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (debouncedDistrict) params.district = debouncedDistrict;
    if (debouncedRooms) params.rooms = debouncedRooms;
    if (debouncedPriceMin > priceBounds.min) {
      params.price_min = displayToUsd(debouncedPriceMin, currency);
    }
    if (debouncedPriceMax < priceBounds.max) {
      params.price_max = displayToUsd(debouncedPriceMax, currency);
    }
    const dateFrom = dateFilterToIso(dateFilter);
    if (dateFrom) params.date_from = dateFrom;
    return params;
  }, [
    dealType, debouncedQuery, debouncedDistrict, debouncedRooms,
    debouncedPriceMin, debouncedPriceMax, priceBounds, currency, dateFilter,
  ]);

  // Немедленные параметры (без debounce) — для Enter / кнопки «Найти»
  const buildImmediateParams = useCallback((nextOffset: number) => {
    const params: Record<string, string | number> = {
      deal_type: dealType,
      limit: PAGE_SIZE,
      offset: nextOffset,
    };
    if (query.trim()) params.q = query.trim();
    if (district) params.district = district;
    if (rooms) params.rooms = rooms;
    if (priceMin > priceBounds.min) params.price_min = displayToUsd(priceMin, currency);
    if (priceMax < priceBounds.max) params.price_max = displayToUsd(priceMax, currency);
    const dateFrom = dateFilterToIso(dateFilter);
    if (dateFrom) params.date_from = dateFrom;
    return params;
  }, [dealType, query, district, rooms, priceMin, priceMax, priceBounds, currency, dateFilter]);

  const queryKey = useMemo(
    () => JSON.stringify(buildParams(0)),
    [buildParams],
  );

  const persistCache = useCallback((
    nextProperties: Property[],
    nextTotal: number,
    nextHasMore: boolean,
    nextStats: PlatformStats | null,
  ) => {
    setHomeSearchCache({
      queryKey,
      dealType,
      query,
      district,
      rooms,
      priceMin,
      priceMax,
      priceBounds,
      showMap,
      properties: nextProperties,
      total: nextTotal,
      hasMore: nextHasMore,
      stats: nextStats,
      scrollY: window.scrollY,
    });
  }, [queryKey, dealType, query, district, rooms, priceMin, priceMax, priceBounds, showMap]);

  useEffect(() => {
    return () => {
      setHomeSearchCache({
        queryKey,
        dealType,
        query,
        district,
        rooms,
        priceMin,
        priceMax,
        priceBounds,
        showMap,
        properties: propertiesRef.current,
        total,
        hasMore,
        stats,
        scrollY: window.scrollY,
      });
    };
  }, [queryKey, dealType, query, district, rooms, priceMin, priceMax, priceBounds, showMap, total, hasMore, stats]);

  const load = useCallback(async (
    append = false,
    silent = false,
    overrideParams: Record<string, string | number> | null = null,
  ) => {
    const nextOffset = append ? propertiesRef.current.length : 0;
    if (append) {
      setLoadingMore(true);
    } else if (!silent && propertiesRef.current.length === 0) {
      setLoading(true);
    }

    try {
      const params = overrideParams
        ? { ...overrideParams, offset: nextOffset }
        : buildParams(nextOffset);
      const result = await searchProperties(params);
      // Уважаем то, что реально применил бэкенд (умный поиск мог сменить тип/район)
      const appliedDeal = (result.applied?.deal_type as "rent" | "sale") ?? dealType;
      const pageItems = filterByDealType(result.items, appliedDeal);
      const nextProperties = append
        ? [...propertiesRef.current, ...pageItems]
        : pageItems;
      setProperties(nextProperties);
      setTotal(result.total);
      setHasMore(result.has_more);

      // Синхронизируем только тип сделки (у него отдельный переключатель).
      // Район НЕ трогаем: список — явный контрол пользователя, и его
      // автозаполнение приводило к «залипанию» старого района.
      if (!append && debouncedQuery.trim() && result.applied) {
        const ad = result.applied.deal_type as "rent" | "sale" | undefined;
        if (ad && ad !== dealType) setDealType(ad);
      }

      // Сообщаем пользователю, если точных совпадений не было и мы расширили поиск
      if (!append) {
        const relaxed = result.applied?.relaxed ?? null;
        if (debouncedQuery.trim() && relaxed && relaxed.length > 0 && result.total > 0) {
          setRelaxedNote(t("relaxedNote"));
        } else {
          setRelaxedNote(null);
        }
      }

      let nextStats = stats;
      if (!append) {
        nextStats = await getStats();
        setStats(nextStats);
      }
      persistCache(nextProperties, result.total, result.has_more, nextStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams, persistCache, stats, dealType, district, debouncedQuery, t]);

  useEffect(() => {
    const cached = getHomeSearchCache();
    const silent = cached?.queryKey === queryKey && cached.properties.length > 0;
    load(false, silent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    load(true);
  };

  const showingLabel = t("showingCount")
    .replace("{shown}", String(properties.length))
    .replace("{total}", String(total));

  const showLoadingPlaceholder = loading && properties.length === 0;

  return (
    <div>
      <section className="band band-hero hero-section relative overflow-hidden">
        <HeroBackdrop />
        <div className="site-container relative z-10 pb-10 pt-8 md:pb-14 md:pt-10">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div className="text-left">
              <span className="hero-hook">
                <span className="hero-hook-dot" aria-hidden />
                {t("heroHook")}
              </span>
              <p className="hero-pain">{t("heroPain")}</p>
              <h1 className="hero-headline">
                {t("heroTitleMain")}
                <span className="text-gradient">{t("heroTitleHighlight")}</span>
                {t("heroTitleEnd")}
              </h1>
              <p className="hero-solution">{t("heroSolution")}</p>
              <p className="hero-subline">{t("heroDesc")}</p>
              <div className="mt-9 flex flex-wrap gap-3 md:mt-11 md:gap-4">
                <a href="#search" className="btn-primary btn-primary-lg">{t("heroCtaPrimary")}</a>
                <Link to="/buyers" className="btn-emerald btn-primary-lg">{t("heroCtaSecondary")}</Link>
                <Link to="/realtors" className="btn-cta btn-primary-lg">{t("heroCtaRealtors")}</Link>
                <Link to="/post" className="btn-violet btn-primary-lg">
                  {t("heroCtaOwners")}
                </Link>
              </div>
            </div>
            <HeroVisual />
          </div>
          <HeroAdvantages />
        </div>
      </section>

      <HowItWorks />

      <section id="search" className="band band-search search-strip">
        <div className="search-strip-grid" aria-hidden />
        <div className="search-strip-glow search-strip-glow-left" aria-hidden />
        <div className="search-strip-glow search-strip-glow-right" aria-hidden />
        <div className="site-container relative py-6 md:py-8">
            <SearchBar
              dealType={dealType}
              query={query}
              district={district}
              rooms={rooms}
              priceMin={priceMin}
              priceMax={priceMax}
              priceBounds={priceBounds}
              dateFilter={dateFilter}
              onDealType={(v) => { setDealType(v); setShowMap(false); }}
              onQuery={setQuery}
              onDistrict={setDistrict}
              onRooms={setRooms}
              onPriceChange={(min, max) => { setPriceMin(min); setPriceMax(max); }}
              onDateFilter={setDateFilter}
              onSubmit={(e) => {
                e.preventDefault();
                setShowMap(false);
                setLoading(true);
                load(false, false, buildImmediateParams(0));
              }}
            />
        </div>
      </section>

      <section id="properties" className="band band-properties py-8 md:py-10">
        <div className="site-container">
          <div className="properties-toolbar">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{t("sectionProperties")}</h2>
              {!showLoadingPlaceholder && (
                <p className="mt-1 text-sm text-white/45">{showingLabel}</p>
              )}
              {!showLoadingPlaceholder && relaxedNote && (
                <p className="mt-1 text-sm text-sky-300/80">{relaxedNote}</p>
              )}
            </div>

            <div className="properties-toolbar-actions">
              <div className="deal-type-toggle" role="group" aria-label={t("dealType")}>
                {(["rent", "sale"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDealType(type);
                      setShowMap(false);
                    }}
                    className={dealType === type ? "deal-type-toggle-btn deal-type-toggle-btn-active" : "deal-type-toggle-btn"}
                  >
                    {type === "rent" ? t("dealRent") : t("dealSale")}
                  </button>
                ))}
              </div>

              <div className="view-toggle">
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className={!showMap ? "view-toggle-btn view-toggle-btn-active" : "view-toggle-btn"}
                >
                  {t("viewGrid")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className={showMap ? "view-toggle-btn view-toggle-btn-active" : "view-toggle-btn"}
                >
                  {t("viewMap")}
                </button>
              </div>
            </div>
          </div>

          {showLoadingPlaceholder ? (
            <div className="py-20 text-center text-white/30">{t("loading")}</div>
          ) : properties.length === 0 ? (
            <div className="detail-card-light mx-auto max-w-lg py-16 text-center">
              <h3 className="text-xl font-bold text-slate-900">{t("feedEmptyTitle")}</h3>
              <p className="mt-3 text-slate-600">{t("feedEmptyBody")}</p>
              <Link to="/post" className="btn-cta mt-8 inline-flex">
                {t("feedEmptyCta")}
              </Link>
            </div>
          ) : showMap ? (
            <PropertyMap properties={properties} onSelect={(id) => navigate(`/property/${id}`)} />
          ) : (
            <>
              <div className="property-grid">
                {properties.map((p, i) => (
                  <PropertyCard key={p.id} property={p} index={i} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-outline btn-outline-lg w-full sm:w-auto sm:min-w-[12rem]"
                  >
                    {loadingMore ? t("loading") : t("loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="band band-stats stats-strip">
        <div className="site-container">
          <StatsBar stats={stats} />
          <div className="mt-10 text-center">
            <a href="#search" className="btn-cta text-base">{t("ctaStartSearch")}</a>
          </div>
        </div>
      </section>

      <WhyPlatform />
    </div>
  );
}
