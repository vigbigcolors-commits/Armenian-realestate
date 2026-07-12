import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { PricePoint } from "../types";
import { useI18n } from "../i18n";
import type { Locale } from "../i18n/content";
import { useCurrency } from "../context/CurrencyContext";
import { usdToDisplay, formatDisplayAmount } from "../utils/currency";

interface Props {
  history: PricePoint[];
  dealType: string;
  variant?: "dark" | "light";
}

function localeTag(locale: Locale): string {
  if (locale === "hy") return "hy-AM";
  if (locale === "ru") return "ru-RU";
  return "en-US";
}

function formatAxisDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(localeTag(locale), { day: "numeric", month: "short" });
}

function formatFullDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export default function PriceChart({ history, dealType, variant = "dark" }: Props) {
  const { t, locale } = useI18n();
  const { currency, formatPrice } = useCurrency();
  const isLight = variant === "light";

  if (!history.length) {
    return (
      <div className={`flex h-48 items-center justify-center text-sm ${isLight ? "text-slate-400" : "text-white/30"}`}>
        {t("noPriceHistory")}
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );

  const data = sorted.map((h) => ({
    recorded_at: h.recorded_at,
    date: formatAxisDate(h.recorded_at, locale),
    price: usdToDisplay(h.price_usd, currency),
    priceUsd: h.price_usd,
    note: h.note,
  }));

  const axisFmt = (v: number) => formatDisplayAmount(v, currency);

  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const priceDelta = latest.price_usd - earliest.price_usd;
  const deltaPct = earliest.price_usd
    ? Math.round((priceDelta / earliest.price_usd) * 100)
    : 0;

  return (
    <div className="price-chart-wrap">
      <div className="price-chart-summary">
        <div className="price-chart-stat">
          <span className="price-chart-stat-label">{t("priceHistoryFirst")}</span>
          <span className="price-chart-stat-value">{formatPrice(earliest.price_usd)}{dealType === "rent" ? t("perMonth") : ""}</span>
          <span className="price-chart-stat-date">{formatFullDateTime(earliest.recorded_at, locale)}</span>
        </div>
        <div className="price-chart-stat price-chart-stat-current">
          <span className="price-chart-stat-label">{t("priceHistoryCurrent")}</span>
          <span className="price-chart-stat-value">{formatPrice(latest.price_usd)}{dealType === "rent" ? t("perMonth") : ""}</span>
          <span className="price-chart-stat-date">{formatFullDateTime(latest.recorded_at, locale)}</span>
        </div>
        {sorted.length > 1 && (
          <div className={`price-chart-delta ${priceDelta <= 0 ? "price-chart-delta-down" : "price-chart-delta-up"}`}>
            {priceDelta <= 0 ? "↓" : "↑"} {Math.abs(deltaPct)}%
          </div>
        )}
      </div>

      <div className="price-chart-graph">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.06)"} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: isLight ? "rgba(71,85,105,0.9)" : "rgba(255,255,255,0.4)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isLight ? "rgba(71,85,105,0.9)" : "rgba(255,255,255,0.4)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={axisFmt}
              width={72}
            />
            <Tooltip
              contentStyle={{
                background: isLight ? "#fff" : "#1a1f2e",
                border: isLight ? "1px solid rgba(15,23,42,0.1)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: isLight ? "#0f172a" : "#fff",
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              formatter={(value: number) => [formatDisplayAmount(value, currency), ""]}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { recorded_at?: string; note?: string } | undefined;
                if (!row?.recorded_at) return "";
                const when = formatFullDateTime(row.recorded_at, locale);
                return row.note ? `${when} — ${row.note}` : when;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isLight ? "#2563EB" : "#60A5FA"}
              strokeWidth={2.5}
              dot={{ fill: isLight ? "#2563EB" : "#60A5FA", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ol className="price-chart-timeline">
        {[...sorted].reverse().map((point, i) => {
          const prev = sorted[sorted.length - i - 2];
          const diff = prev ? point.price_usd - prev.price_usd : 0;
          return (
            <li key={`${point.recorded_at}-${i}`} className="price-chart-timeline-item">
              <div className="price-chart-timeline-dot" />
              <div className="price-chart-timeline-body">
                <time className="price-chart-timeline-when" dateTime={point.recorded_at}>
                  {formatFullDateTime(point.recorded_at, locale)}
                </time>
                <div className="price-chart-timeline-row">
                  <span className="price-chart-timeline-price">
                    {formatPrice(point.price_usd)}
                    {dealType === "rent" ? t("perMonth") : ""}
                  </span>
                  {diff !== 0 && (
                    <span className={diff < 0 ? "price-chart-timeline-change-down" : "price-chart-timeline-change-up"}>
                      {diff < 0 ? "−" : "+"}{formatPrice(Math.abs(diff))}
                    </span>
                  )}
                  {point.note && (
                    <span className="price-chart-timeline-note">{point.note}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
