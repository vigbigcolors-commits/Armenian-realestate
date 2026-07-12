import { useI18n, type ContentKey } from "../../i18n";

interface Step {
  titleKey: ContentKey;
  descKey: ContentKey;
  color: string;
}

const STEPS: Step[] = [
  { titleKey: "mktFlow1", descKey: "mktFlow1d", color: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
  { titleKey: "mktFlow2", descKey: "mktFlow2d", color: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { titleKey: "mktFlow3", descKey: "mktFlow3d", color: "linear-gradient(135deg,#10b981,#059669)" },
  { titleKey: "mktFlow4", descKey: "mktFlow4d", color: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { titleKey: "mktFlow5", descKey: "mktFlow5d", color: "linear-gradient(135deg,#f43f5e,#e11d48)" },
];

export default function FlowDiagram() {
  const { t } = useI18n();

  return (
    <div className="flow-diagram flow-diagram-v2">
      <h3 className="flow-diagram-title">{t("mktFlowTitle")}</h3>
      <div className="flow-diagram-track">
        {STEPS.map((step, i) => (
          <div key={step.titleKey} className="flow-diagram-step">
            <div className="flow-diagram-node flow-diagram-node-v2">
              <span className="flow-diagram-num flow-diagram-num-v2" style={{ background: step.color }}>
                {i + 1}
              </span>
              <div>
                <p className="flow-diagram-step-title">{t(step.titleKey)}</p>
                <p className="flow-diagram-step-desc">{t(step.descKey)}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && <div className="flow-diagram-arrow" aria-hidden>↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
