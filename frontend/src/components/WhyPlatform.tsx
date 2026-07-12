import { useI18n, type ContentKey } from "../i18n";

type Audience = "realtors" | "buyers";

const REALTOR_POINTS: ContentKey[] = [
  "realtorsPoint1",
  "realtorsPoint2",
  "realtorsPoint3",
  "realtorsPoint4",
  "realtorsPoint5",
  "realtorsPoint6",
];

const BUYER_POINTS: ContentKey[] = [
  "buyersPoint1",
  "buyersPoint2",
  "buyersPoint3",
  "buyersPoint4",
  "buyersPoint5",
  "buyersPoint6",
];

function AudienceBlock({
  audience,
  labelKey,
  titleKey,
  subtitleKey,
  points,
}: {
  audience: Audience;
  labelKey: ContentKey;
  titleKey: ContentKey;
  subtitleKey: ContentKey;
  points: ContentKey[];
}) {
  const { t } = useI18n();
  const isRealtors = audience === "realtors";

  return (
    <article className={`audience-block ${isRealtors ? "audience-block-realtors" : "audience-block-buyers"}`}>
      <div className="audience-block-grid" aria-hidden />
      <div className="audience-block-glow" aria-hidden />
      <span className="audience-corner audience-corner-tl" aria-hidden />
      <span className="audience-corner audience-corner-tr" aria-hidden />
      <span className="audience-corner audience-corner-bl" aria-hidden />
      <span className="audience-corner audience-corner-br" aria-hidden />
      <div className="audience-block-accent" aria-hidden />

      <div className="audience-block-inner">
        <div className="audience-block-head">
          <span className={`audience-label ${isRealtors ? "audience-label-realtors" : "audience-label-buyers"}`}>
            {t(labelKey)}
          </span>
          <h3 className="audience-title">{t(titleKey)}</h3>
          <p className="audience-subtitle">{t(subtitleKey)}</p>
        </div>

        <ul className="audience-list">
          {points.map((key, i) => (
            <li key={key} className="audience-item">
              <span className={`audience-index ${isRealtors ? "audience-index-realtors" : "audience-index-buyers"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="audience-text">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function WhyPlatform() {
  const { t } = useI18n();

  return (
    <section id="why" className="band band-why audience-section relative overflow-hidden">
      <div className="audience-section-deco" aria-hidden />

      <div className="site-container relative py-20 md:py-28">
        <header className="audience-header">
          <p className="audience-eyebrow">{t("audienceEyebrow")}</p>
          <h2 className="audience-heading">{t("audienceTitle")}</h2>
        </header>

        <div className="audience-grid mt-14 grid grid-cols-1 gap-0 lg:grid-cols-2">
          <AudienceBlock
            audience="realtors"
            labelKey="realtorsLabel"
            titleKey="realtorsTitle"
            subtitleKey="realtorsSubtitle"
            points={REALTOR_POINTS}
          />
          <AudienceBlock
            audience="buyers"
            labelKey="buyersLabel"
            titleKey="buyersTitle"
            subtitleKey="buyersSubtitle"
            points={BUYER_POINTS}
          />
        </div>
      </div>
    </section>
  );
}
