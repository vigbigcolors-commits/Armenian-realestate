interface Props {
  prices: number[];
  width?: number;
  height?: number;
  variant?: "dark" | "light";
}

export default function MiniPriceChart({
  prices,
  width = 120,
  height = 32,
  variant = "dark",
}: Props) {
  if (prices.length < 2) {
    return (
      <div
        className={`font-mono text-[10px] ${variant === "light" ? "text-slate-300" : "text-white/20"}`}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 3;

  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const trend = prices[prices.length - 1] - prices[0];
  const color = trend > 0 ? "#F59E0B" : trend < 0 ? "#34D399" : "#60A5FA";

  return (
    <svg width={width} height={height}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r="2"
        fill={color}
      />
    </svg>
  );
}
