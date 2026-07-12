import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import FavoriteButton from "./FavoriteButton";

interface Props {
  photos: string[];
  propertyId?: string;
}

function GalleryDots({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="property-gallery-dots" role="tablist" aria-label="Photos">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={`${i + 1} / ${total}`}
          className={i === active ? "property-gallery-dot property-gallery-dot-active" : "property-gallery-dot"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(i);
          }}
        />
      ))}
    </div>
  );
}

export default function PropertyGallery({ photos, propertyId }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = photos.length;
  const hasMany = total > 1;

  const go = useCallback(
    (dir: -1 | 1) => {
      setActive((i) => (i + dir + total) % total);
    },
    [total],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !hasMany) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? 1 : -1);
  };

  useEffect(() => {
    setActive(0);
  }, [photos]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, go]);

  if (!total) return null;

  return (
    <>
      <div className="property-gallery-layout property-gallery-layout-slider">
        <div className="property-gallery-primary">
          {propertyId && <FavoriteButton propertyId={propertyId} className="property-gallery-favorite" />}

          <button
            type="button"
            className="property-gallery-stage"
            onClick={() => setLightbox(true)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label={t("galleryEnlarge")}
          >
            <img src={photos[active]} alt="" className="property-gallery-hero" />
            <span className="property-gallery-zoom-hint">{t("galleryEnlarge")}</span>
            <GalleryDots total={total} active={active} onSelect={setActive} />
          </button>

          {hasMany && (
            <>
              <button
                type="button"
                className="property-gallery-nav property-gallery-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label={t("galleryPrev")}
              >
                ‹
              </button>
              <button
                type="button"
                className="property-gallery-nav property-gallery-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label={t("galleryNext")}
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="property-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="property-lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label={t("galleryClose")}
          >
            ×
          </button>

          <div
            className="property-lightbox-layout property-lightbox-layout-slider"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="property-lightbox-primary">
              {hasMany && (
                <>
                  <button
                    type="button"
                    className="property-lightbox-nav property-lightbox-nav-prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(-1);
                    }}
                    aria-label={t("galleryPrev")}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="property-lightbox-nav property-lightbox-nav-next"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(1);
                    }}
                    aria-label={t("galleryNext")}
                  >
                    ›
                  </button>
                </>
              )}
              <img src={photos[active]} alt="" className="property-lightbox-img" />
              <GalleryDots total={total} active={active} onSelect={setActive} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
