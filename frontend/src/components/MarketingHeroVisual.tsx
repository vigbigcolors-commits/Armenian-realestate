interface Props {
  webp: string;
  fallback?: string;
  className?: string;
}

export default function MarketingHeroVisual({ webp, fallback, className = "" }: Props) {
  return (
    <div className={`hero-image-wrap marketing-hero-image-wrap mx-auto w-full max-w-md lg:max-w-none ${className}`}>
      <div className="hero-image-glow" aria-hidden />
      <div className="relative z-10 overflow-hidden rounded-lg">
        <picture>
          <source srcSet={webp} type="image/webp" />
          <img
            src={fallback ?? webp}
            alt=""
            className="hero-image marketing-hero-image block w-full"
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
    </div>
  );
}
