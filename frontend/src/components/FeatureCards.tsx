import { useI18n } from "../i18n";
import { playQuietClick } from "../utils/quietClick";

interface Props {
  active: "rent" | "sale" | "history";
  onSelect: (v: "rent" | "sale" | "history") => void;
}

const ICONS = {
  rent: (
    <svg className="feature-tile-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  sale: (
    <svg className="feature-tile-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      <circle cx="8" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  history: (
    <svg className="feature-tile-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

type TileVariant = "rent" | "sale" | "history";

const TILE_CLASS: Record<TileVariant, string> = {
  rent: "feature-tile feature-tile-rent",
  sale: "feature-tile feature-tile-sale",
  history: "feature-tile feature-tile-history",
};

export default function FeatureCards({ active, onSelect }: Props) {
  const { t } = useI18n();

  const cards: Array<{
    id: TileVariant;
    title: string;
    desc: string;
  }> = [
    { id: "rent", title: t("featureRent"), desc: t("featureRentDesc") },
    { id: "sale", title: t("featureSale"), desc: t("featureSaleDesc") },
    { id: "history", title: t("featureHistory"), desc: t("featureHistoryDesc") },
  ];

  return (
    <div className="feature-tiles">
      {cards.map((card) => {
        const isActive = active === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            onMouseEnter={() => playQuietClick(card.id)}
            className={`${TILE_CLASS[card.id]} ${isActive ? "feature-tile-active" : ""}`}
          >
            <div className="feature-tile-grid" aria-hidden />
            <div className="feature-tile-glow" aria-hidden />
            <span className="feature-tile-accent" aria-hidden />
            <span className="feature-tile-corner feature-tile-corner-tl" aria-hidden />
            <span className="feature-tile-corner feature-tile-corner-br" aria-hidden />

            <div className="feature-tile-body">
              <div className="feature-tile-icon">{ICONS[card.id]}</div>
              <div className="feature-tile-title">{card.title}</div>
              <div className="feature-tile-desc">{card.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
