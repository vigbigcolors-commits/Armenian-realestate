export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <path
        d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        fill="rgba(59,130,246,0.1)"
      />
      <path
        d="M20 10L28 14.5V23.5L20 28L12 23.5V14.5L20 10Z"
        fill="url(#logoGrad)"
        opacity="0.9"
      />
    </svg>
  );
}
