import { LOCALE_LABELS, useI18n, type Locale } from "../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/5">
      {(["hy", "ru", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
            locale === l
              ? "bg-accent/25 text-accent-glow"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
