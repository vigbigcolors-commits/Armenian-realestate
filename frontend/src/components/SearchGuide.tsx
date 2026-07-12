import { useI18n, type ContentKey } from "../i18n";

const STEPS: ContentKey[] = ["searchGuideStep1", "searchGuideStep2", "searchGuideStep3"];

export default function SearchGuide() {
  const { t } = useI18n();

  return (
    <div className="search-guide">
      <header className="search-guide-head">
        <p className="search-guide-eyebrow">{t("searchGuideEyebrow")}</p>
        <h2 className="search-guide-title">{t("searchGuideTitle")}</h2>
      </header>

      <ol className="search-guide-steps">
        {STEPS.map((key, i) => (
          <li key={key} className="search-guide-step">
            <span className="search-guide-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
            <p className="search-guide-text">{t(key)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
