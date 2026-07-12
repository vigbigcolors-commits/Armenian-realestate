import { useI18n } from "../i18n";

interface Props {
  url?: string | null;
  site?: string | null;
  variant?: "badge" | "full";
  className?: string;
}

/**
 * Атрибуция источника: явно указываем площадку и ведём к оригиналу.
 * rel="noopener" — безопасность, но БЕЗ noreferrer, чтобы аналитика
 * площадки видела нас как реферера-партнёра. UTM уже добавлен на бэкенде.
 */
export default function SourceAttribution({ url, site, variant = "badge", className = "" }: Props) {
  const { t } = useI18n();
  if (!url) return null;

  const siteName = site || "list.am";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (variant === "badge") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener"
        onClick={stop}
        className={`source-badge ${className}`}
        title={t("sourceViewOn").replace("{site}", siteName)}
      >
        <span className="source-badge-dot" aria-hidden />
        {siteName}
        <span className="source-badge-arrow" aria-hidden>↗</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      onClick={stop}
      className={`source-link-full ${className}`}
    >
      <span className="source-link-full-label">{t("sourceLabel")}</span>
      <span className="source-link-full-site">{siteName}</span>
      <span className="source-link-full-cta">{t("sourceViewOn").replace("{site}", siteName)} ↗</span>
    </a>
  );
}
