import type { CSSProperties } from "react";
import { useI18n, type ContentKey } from "../../i18n";

type BenefitTile = {
  titleKey: ContentKey;
  bodyKey: ContentKey;
  layout: "hero" | "chart" | "search" | "map" | "photos" | "free";
  accent: "blue" | "violet" | "emerald" | "amber" | "sky" | "cta";
};

const TILES: BenefitTile[] = [
  { titleKey: "mktBuyersBenefit1Title", bodyKey: "mktBuyersBenefit1", layout: "hero", accent: "blue" },
  { titleKey: "mktBuyersBenefit2Title", bodyKey: "mktBuyersBenefit2", layout: "photos", accent: "violet" },
  { titleKey: "mktBuyersBenefit3Title", bodyKey: "mktBuyersBenefit3", layout: "chart", accent: "amber" },
  { titleKey: "mktBuyersBenefit4Title", bodyKey: "mktBuyersBenefit4", layout: "search", accent: "sky" },
  { titleKey: "mktBuyersBenefit5Title", bodyKey: "mktBuyersBenefit5", layout: "map", accent: "emerald" },
  { titleKey: "mktBuyersBenefit6Title", bodyKey: "mktBuyersBenefit6", layout: "free", accent: "cta" },
];

function TileVisual({ layout }: { layout: BenefitTile["layout"] }) {
  if (layout === "hero") {
    return (
      <div className="buyers-mosaic-visual buyers-mosaic-visual-hero" aria-hidden>
        <div className="buyers-mosaic-stack buyers-mosaic-stack-messy">
          <span />
          <span />
          <span />
        </div>
        <div className="buyers-mosaic-arrow">→</div>
        <div className="buyers-mosaic-stack buyers-mosaic-stack-clean">
          <span />
        </div>
      </div>
    );
  }

  if (layout === "photos") {
    return (
      <div className="buyers-mosaic-visual buyers-mosaic-visual-photos" aria-hidden>
        <span className="buyers-mosaic-photo buyers-mosaic-photo-a" />
        <span className="buyers-mosaic-photo buyers-mosaic-photo-b" />
        <span className="buyers-mosaic-photo-check">✓</span>
      </div>
    );
  }

  if (layout === "chart") {
    return (
      <svg className="buyers-mosaic-visual buyers-mosaic-visual-chart" viewBox="0 0 120 48" aria-hidden>
        <polyline
          points="0,40 20,32 35,36 50,22 65,26 80,14 95,18 120,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="80" cy="14" r="4" fill="currentColor" />
      </svg>
    );
  }

  if (layout === "search") {
    return (
      <div className="buyers-mosaic-visual buyers-mosaic-visual-search" aria-hidden>
        <span className="buyers-mosaic-search-pulse" />
        <span className="buyers-mosaic-search-bar">3 · Center · AI</span>
      </div>
    );
  }

  if (layout === "map") {
    return (
      <div className="buyers-mosaic-visual buyers-mosaic-visual-map" aria-hidden>
        {["Y", "G", "L", "K", "A", "S"].map((label, i) => (
          <span key={label} className="buyers-mosaic-map-dot" style={{ "--i": i } as CSSProperties}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="buyers-mosaic-visual buyers-mosaic-visual-free" aria-hidden>
      <span className="buyers-mosaic-free-ring" />
      <span className="buyers-mosaic-free-tag">0 ֏</span>
    </div>
  );
}

export default function BuyersBenefitsMosaic() {
  const { t } = useI18n();

  return (
    <div className="buyers-benefits-mosaic">
      {TILES.map((tile, index) => (
        <article
          key={tile.titleKey}
          className={`buyers-mosaic-tile buyers-mosaic-tile-${tile.layout} buyers-mosaic-accent-${tile.accent}`}
        >
          <div className="buyers-mosaic-tile-head">
            <span className="buyers-mosaic-index">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="buyers-mosaic-title">{t(tile.titleKey)}</h3>
          </div>
          <p className="buyers-mosaic-body">{t(tile.bodyKey)}</p>
          <TileVisual layout={tile.layout} />
        </article>
      ))}
    </div>
  );
}
