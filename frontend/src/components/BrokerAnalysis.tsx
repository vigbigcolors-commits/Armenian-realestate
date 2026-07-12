import type { Listing } from "../types";
import { useI18n } from "../i18n";
import { useCurrency } from "../context/CurrencyContext";

interface Props {
  listings: Listing[];
  ownerPrice: number | null;
}

export default function BrokerAnalysis({ listings, ownerPrice }: Props) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  if (!listings.length) return <p className="text-sm text-white/30">{t("noBrokerData")}</p>;

  const sorted = [...listings].sort((a, b) => (a.price_usd || 0) - (b.price_usd || 0));
  const base = ownerPrice || sorted.find((l) => !l.is_agency)?.price_usd || sorted[0]?.price_usd;

  return (
    <div className="divide-y divide-white/[0.06]">
      {sorted.map((listing, i) => {
        const markup = base && listing.price_usd ? listing.price_usd - base : 0;
        const isOwner = !listing.is_agency;
        const offerLabel = isOwner
          ? t("verifiedOwner")
          : listing.poster_name || `${t("offerLabel")} ${i + 1}`;
        return (
          <div key={i} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white">{offerLabel}</div>
              <div className="text-xs text-white/30">{t("externalListing")}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-white">{formatPrice(listing.price_usd)}</div>
              {markup > 0 && !isOwner && (
                <div className="font-mono text-xs text-amber-400">+{formatPrice(markup)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
