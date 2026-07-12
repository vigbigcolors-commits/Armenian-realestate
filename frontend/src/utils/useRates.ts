import { useEffect, useState } from "react";
import { fetchRates, type Rates } from "./rates";
import { AMD_PER_USD, RUB_PER_USD } from "./currency";

const initial: Rates = {
  amdPerUsd: AMD_PER_USD,
  rubPerUsd: RUB_PER_USD,
  amdPerRub: Math.round((AMD_PER_USD / RUB_PER_USD) * 10) / 10,
  updatedAt: 0,
  live: false,
};

export function useRates(): Rates {
  const [rates, setRates] = useState<Rates>(initial);

  useEffect(() => {
    let alive = true;
    fetchRates().then((r) => {
      if (alive) setRates(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  return rates;
}
