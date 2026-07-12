import { useCurrency } from "../context/CurrencyContext";
import type { Currency } from "../utils/currency";
import { useI18n } from "../i18n";

export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const { t } = useI18n();

  const options: Currency[] = ["AMD", "USD", "RUB"];
  const labels: Record<Currency, string> = {
    AMD: "֏ AMD",
    USD: "$ USD",
    RUB: "₽ RUB",
  };

  return (
    <div className={`currency-switcher ${className}`} role="group" aria-label={t("currency")}>
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          className={currency === c ? "currency-switcher-btn currency-switcher-btn-active" : "currency-switcher-btn"}
        >
          {labels[c]}
        </button>
      ))}
    </div>
  );
}
