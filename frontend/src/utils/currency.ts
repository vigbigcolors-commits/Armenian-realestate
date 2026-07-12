export type Currency = "AMD" | "USD" | "RUB";

export const AMD_PER_USD = 390;
export const RUB_PER_USD = 82;
export const AMD_PER_RUB = Math.round((AMD_PER_USD / RUB_PER_USD) * 10) / 10;
export const DEFAULT_CURRENCY: Currency = "AMD";

// Живые курсы (обновляются в рантайме из useRates → setLiveRates).
// По умолчанию — статический фолбэк, чтобы конвертация работала до загрузки.
let liveAmdPerUsd = AMD_PER_USD;
let liveRubPerUsd = RUB_PER_USD;

export function setLiveRates(rates: { amdPerUsd?: number; rubPerUsd?: number }): void {
  if (rates.amdPerUsd && rates.amdPerUsd > 0) liveAmdPerUsd = rates.amdPerUsd;
  if (rates.rubPerUsd && rates.rubPerUsd > 0) liveRubPerUsd = rates.rubPerUsd;
}

export function usdToAmd(usd: number): number {
  return Math.round(usd * liveAmdPerUsd);
}

export function amdToUsd(amd: number): number {
  return Math.max(1, Math.round(amd / liveAmdPerUsd));
}

export function usdToRub(usd: number): number {
  return Math.round(usd * liveRubPerUsd);
}

export function rubToUsd(rub: number): number {
  return Math.max(1, Math.round(rub / liveRubPerUsd));
}

/** USD (DB) → значение для ползунка в выбранной валюте */
export function usdToDisplay(usd: number, currency: Currency): number {
  if (currency === "AMD") return usdToAmd(usd);
  if (currency === "RUB") return usdToRub(usd);
  return usd;
}

/** Ползунок → USD для API */
export function displayToUsd(amount: number, currency: Currency): number {
  if (currency === "AMD") return amdToUsd(amount);
  if (currency === "RUB") return rubToUsd(amount);
  return Math.round(amount);
}

export function formatMoney(
  usd: number | null | undefined,
  currency: Currency,
  opts?: { compact?: boolean },
): string {
  if (usd == null || Number.isNaN(usd)) return "—";
  if (currency === "AMD") {
    const amd = usdToAmd(usd);
    if (opts?.compact && amd >= 10_000_000) {
      return `֏${(amd / 1_000_000).toFixed(1).replace(".0", "")} млн`;
    }
    return `֏${amd.toLocaleString("hy-AM")}`;
  }
  if (currency === "RUB") {
    const rub = usdToRub(usd);
    if (opts?.compact && rub >= 1_000_000) {
      return `₽${(rub / 1_000_000).toFixed(1).replace(".0", "")} млн`;
    }
    return `₽${rub.toLocaleString("ru-RU")}`;
  }
  if (opts?.compact && usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  }
  return `$${usd.toLocaleString("en-US")}`;
}

/** Формат значения ползунка (уже в display-валюте) */
export function formatDisplayAmount(amount: number, currency: Currency): string {
  if (currency === "AMD") return `֏${amount.toLocaleString("hy-AM")}`;
  if (currency === "RUB") return `₽${amount.toLocaleString("ru-RU")}`;
  return `$${amount.toLocaleString("en-US")}`;
}

export function sliderStep(span: number, currency: Currency): number {
  if (currency === "AMD") {
    if (span > 50_000_000) return 1_000_000;
    if (span > 5_000_000) return 100_000;
    if (span > 500_000) return 10_000;
    return 1_000;
  }
  if (currency === "RUB") {
    if (span > 10_000_000) return 100_000;
    if (span > 1_000_000) return 10_000;
    if (span > 100_000) return 1_000;
    return 100;
  }
  if (span > 500_000) return 5_000;
  if (span > 50_000) return 500;
  if (span > 5_000) return 50;
  return 5;
}
