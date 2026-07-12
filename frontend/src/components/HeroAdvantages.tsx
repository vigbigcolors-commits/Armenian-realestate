import { useI18n, type ContentKey } from "../i18n";

type Advantage = {
  titleKey: ContentKey;
  descKey: ContentKey;
  icon: "shield" | "search" | "data";
};

const ADVANTAGES: Advantage[] = [
  { icon: "shield", titleKey: "heroAdv1Title", descKey: "heroAdv1Desc" },
  { icon: "search", titleKey: "heroAdv2Title", descKey: "heroAdv2Desc" },
  { icon: "data", titleKey: "heroAdv3Title", descKey: "heroAdv3Desc" },
];

function AdvantageIcon({ type }: { type: Advantage["icon"] }) {
  if (type === "shield") {
    return (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    );
  }
  if (type === "search") {
    return (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    );
  }
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

export default function HeroAdvantages() {
  const { t } = useI18n();

  return (
    <div className="hero-advantages">
      {ADVANTAGES.map((item) => (
        <div key={item.titleKey} className="hero-advantage">
          <div className="hero-advantage-icon">
            <AdvantageIcon type={item.icon} />
          </div>
          <div className="hero-advantage-text">
            <p className="hero-advantage-title">{t(item.titleKey)}</p>
            <p className="hero-advantage-desc">{t(item.descKey)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
