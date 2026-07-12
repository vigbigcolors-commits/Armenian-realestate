import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  type Currency,
  DEFAULT_CURRENCY,
  formatMoney,
  formatDisplayAmount,
  setLiveRates,
} from "../utils/currency";
import { useRates } from "../utils/useRates";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (usd: number | null | undefined) => string;
  formatSlider: (displayAmount: number) => string;
  ratesLive: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = "smartestate_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const rates = useRates();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "USD" || saved === "AMD" || saved === "RUB" ? saved : DEFAULT_CURRENCY;
  });

  // Прокидываем живые курсы в модуль конвертации, чтобы все суммы
  // (карточки, ползунок, графики) считались по актуальному курсу.
  useEffect(() => {
    setLiveRates({ amdPerUsd: rates.amdPerUsd, rubPerUsd: rates.rubPerUsd });
  }, [rates.amdPerUsd, rates.rubPerUsd]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const formatPrice = useCallback(
    (usd: number | null | undefined) => formatMoney(usd, currency),
    // rates в зависимостях, чтобы формат пересчитывался при обновлении курса
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, rates.amdPerUsd, rates.rubPerUsd],
  );

  const formatSlider = useCallback(
    (displayAmount: number) => formatDisplayAmount(displayAmount, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, formatSlider, ratesLive: rates.live }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
