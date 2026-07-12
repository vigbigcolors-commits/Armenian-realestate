const HERO_IMAGE = "/hero-yerevan.png";

export default function HeroVisual() {
  return (
    <div className="hero-image-wrap relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="hero-image-glow" aria-hidden />
      <div className="relative z-10 overflow-hidden rounded-lg">
        <img
          src={HERO_IMAGE}
          alt=""
          className="hero-image block w-full"
          draggable={false}
        />
      </div>
    </div>
  );
}
