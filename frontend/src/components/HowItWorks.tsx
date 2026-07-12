import { Link } from "react-router-dom";
import { useI18n, type ContentKey } from "../i18n";

interface Step {
  titleKey: ContentKey;
  descKey: ContentKey;
  icon: string;
}

const STEPS: Step[] = [
  { titleKey: "how1Title", descKey: "how1Desc", icon: "📝" },
  { titleKey: "how2Title", descKey: "how2Desc", icon: "📡" },
  { titleKey: "how3Title", descKey: "how3Desc", icon: "✨" },
  { titleKey: "how4Title", descKey: "how4Desc", icon: "⚡" },
  { titleKey: "how5Title", descKey: "how5Desc", icon: "🤝" },
];

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="band band-how how-section">
      <div className="site-container relative z-10 py-12 md:py-16">
        <div className="how-head">
          <span className="how-eyebrow">{t("howEyebrow")}</span>
          <h2 className="how-title">{t("howTitle")}</h2>
          <p className="how-lead">{t("howLead")}</p>
        </div>

        <div className="how-track">
          {STEPS.map((step, i) => (
            <div key={step.titleKey} className="how-step">
              <div className="how-card">
                <div className="how-card-top">
                  <span className="how-icon" aria-hidden>{step.icon}</span>
                  <span className="how-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="how-step-title">{t(step.titleKey)}</p>
                <p className="how-step-desc">{t(step.descKey)}</p>
              </div>
              {i < STEPS.length - 1 && <div className="how-connector" aria-hidden />}
            </div>
          ))}
        </div>

        <div className="how-actions">
          <Link to="/realtors" className="btn-cta btn-primary-lg">{t("howCtaRealtors")}</Link>
          <Link to="/buyers" className="btn-outline btn-outline-lg">{t("howCtaBuyers")}</Link>
        </div>
      </div>
    </section>
  );
}
