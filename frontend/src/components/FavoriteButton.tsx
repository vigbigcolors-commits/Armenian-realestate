import { useEffect, useState } from "react";
import { addSellerFavorite, removeSellerFavorite } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { isFavorite, toggleFavorite } from "../utils/favorites";
import FavoriteAuthModal from "./FavoriteAuthModal";

interface Props {
  propertyId: string;
  className?: string;
}

export default function FavoriteButton({ propertyId, className = "" }: Props) {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (user) {
      setFavorited(isFavorite(user.id, propertyId));
    } else {
      setFavorited(false);
    }
  }, [user, propertyId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      setAuthModalOpen(true);
      return;
    }

    const next = toggleFavorite(user.id, propertyId);
    setFavorited(next);

    if (user.token) {
      try {
        if (next) {
          await addSellerFavorite(user.token, propertyId);
        } else {
          await removeSellerFavorite(user.token, propertyId);
        }
      } catch {
        toggleFavorite(user.id, propertyId);
        setFavorited(!next);
      }
    }
  };

  const tooltip = favorited ? t("favoriteRemove") : t("favoriteAdd");

  return (
    <>
      <div className={`favorite-button-wrap ${className}`}>
        {tooltipVisible && (
          <span className="favorite-tooltip" role="tooltip">
            {tooltip}
          </span>
        )}
        <button
          type="button"
          className={favorited ? "favorite-button favorite-button-active" : "favorite-button"}
          onClick={handleClick}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onFocus={() => setTooltipVisible(true)}
          onBlur={() => setTooltipVisible(false)}
          aria-label={tooltip}
          aria-pressed={favorited}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="favorite-button-icon">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      </div>
      <FavoriteAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
