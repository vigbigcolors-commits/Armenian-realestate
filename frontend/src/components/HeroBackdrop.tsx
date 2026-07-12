export default function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden>
      <div className="hero-backdrop-grid" />

      <svg className="hero-backdrop-plan" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="rgba(96, 165, 250, 0.22)" strokeWidth="1.2" strokeLinecap="square">
          <rect x="680" y="80" width="420" height="320" />
          <path d="M680 200 H920 M920 80 V400 M1040 80 V280 M680 280 H860" />
          <path d="M860 200 H1100 M860 200 V400" />
          <rect x="720" y="120" width="160" height="60" stroke="rgba(96, 165, 250, 0.14)" />
          <rect x="960" y="120" width="100" height="60" stroke="rgba(96, 165, 250, 0.14)" />
          <path d="M200 420 H520 V620 H200 Z" />
          <path d="M200 500 H380 M380 420 V620 M460 420 V520 H520" />
          <path d="M40 120 H280 V300 H40 Z" stroke="rgba(96, 165, 250, 0.12)" />
          <path d="M40 200 H160 M120 120 V300" stroke="rgba(96, 165, 250, 0.1)" />
          <path d="M480 140 H620 V260 H480 Z" stroke="rgba(251, 146, 60, 0.18)" />
          <path d="M540 140 V260 M480 200 H620" stroke="rgba(251, 146, 60, 0.12)" />
        </g>
        <g fill="none" stroke="rgba(37, 99, 235, 0.08)" strokeWidth="0.8" strokeDasharray="4 8">
          <path d="M0 350 H1200 M600 0 V700" />
          <path d="M300 0 V700 M900 0 V700" />
        </g>
      </svg>

      <div className="hero-backdrop-cells">
        <span className="hero-cell hero-cell-a" />
        <span className="hero-cell hero-cell-b" />
        <span className="hero-cell hero-cell-c" />
        <span className="hero-cell hero-cell-d" />
        <span className="hero-cell hero-cell-e" />
        <span className="hero-cell hero-cell-f" />
        <span className="hero-cell hero-cell-g" />
      </div>

      <div className="hero-backdrop-glow" />
    </div>
  );
}
