import { useCallback, useRef } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { sliderStep } from "../utils/currency";

interface Props {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatLabel?: (n: number) => string;
}

export default function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  formatLabel = (n) => `$${n.toLocaleString()}`,
}: Props) {
  const { currency } = useCurrency();
  const trackRef = useRef<HTMLDivElement>(null);
  const span = Math.max(max - min, 1);
  const lo = Math.min(valueMin, valueMax);
  const hi = Math.max(valueMin, valueMax);
  const leftPct = ((lo - min) / span) * 100;
  const widthPct = ((hi - lo) / span) * 100;

  const snap = useCallback(
    (raw: number) => {
      const step = sliderStep(span, currency);
      const clamped = Math.min(max, Math.max(min, raw));
      return Math.round(clamped / step) * step;
    },
    [min, max, span, currency],
  );

  const handleMin = (v: number) => {
    const next = snap(v);
    onChange(Math.min(next, hi), hi);
  };

  const handleMax = (v: number) => {
    const next = snap(v);
    onChange(lo, Math.max(next, lo));
  };

  // Когда ручки близко друг к другу, поднимаем «нижнюю» наверх,
  // иначе один из ползунков оказывается под другим и не берётся.
  const overlapping = hi - lo < span * 0.12;
  const minZ = leftPct > 55 || overlapping ? 6 : 4;
  const maxZ = 5;

  return (
    <div className="price-range">
      <div className="price-range-labels">
        <span className="font-mono text-sm text-slate-700">{formatLabel(lo)}</span>
        <span className="font-mono text-sm text-slate-700">{formatLabel(hi)}</span>
      </div>

      <div className="price-range-track-wrap" ref={trackRef}>
        <div className="price-range-track" />
        <div
          className="price-range-fill"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <input
          type="range"
          className="price-range-input price-range-input-min"
          style={{ zIndex: minZ }}
          min={min}
          max={max}
          value={lo}
          onChange={(e) => handleMin(Number(e.target.value))}
          onInput={(e) => handleMin(Number((e.target as HTMLInputElement).value))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="price-range-input price-range-input-max"
          style={{ zIndex: maxZ }}
          min={min}
          max={max}
          value={hi}
          onChange={(e) => handleMax(Number(e.target.value))}
          onInput={(e) => handleMax(Number((e.target as HTMLInputElement).value))}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}
