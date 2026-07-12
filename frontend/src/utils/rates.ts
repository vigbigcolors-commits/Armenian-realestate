/**
 * Живые курсы валют (USD, AMD, RUB).
 * Тянем из бесплатного API, кэшируем в localStorage на 6 часов,
 * при недоступности — фолбэк на статические значения.
 */
import { AMD_PER_USD, RUB_PER_USD } from "./currency";

export interface Rates {
  amdPerUsd: number;
  rubPerUsd: number;
  amdPerRub: number;
  updatedAt: number;
  live: boolean;
}

const CACHE_KEY = "smartestate_fx_rates";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 часов
const ENDPOINT = "https://open.er-api.com/v6/latest/USD";

function fallback(): Rates {
  return {
    amdPerUsd: AMD_PER_USD,
    rubPerUsd: RUB_PER_USD,
    amdPerRub: Math.round((AMD_PER_USD / RUB_PER_USD) * 10) / 10,
    updatedAt: 0,
    live: false,
  };
}

function readCache(): Rates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Rates;
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchRates(): Promise<Rates> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = await res.json();
    const amd = Number(data?.rates?.AMD);
    const rub = Number(data?.rates?.RUB);
    if (!amd || !rub) throw new Error("FX missing AMD/RUB");

    const rates: Rates = {
      amdPerUsd: Math.round(amd),
      rubPerUsd: Math.round(rub),
      amdPerRub: Math.round((amd / rub) * 10) / 10,
      updatedAt: Date.now(),
      live: true,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    return rates;
  } catch {
    return fallback();
  }
}
