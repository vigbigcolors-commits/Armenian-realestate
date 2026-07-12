import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FavoriteAuthModal({ open, onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="favorite-auth-backdrop" role="presentation" onClick={onClose}>
      <div
        className="favorite-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="favorite-auth-close" onClick={onClose} aria-label={t("favoriteAuthClose")}>
          ×
        </button>
        <div className="favorite-auth-icon" aria-hidden>♥</div>
        <h2 id="favorite-auth-title" className="favorite-auth-title">
          {t("favoriteAuthTitle")}
        </h2>
        <p className="favorite-auth-body">{t("favoriteAuthBody")}</p>
        <div className="favorite-auth-actions">
          <Link to="/account" className="btn-cta btn-primary-lg" onClick={onClose}>
            {t("sellerLogin")}
          </Link>
          <button type="button" onClick={onClose} className="favorite-auth-cancel">
            {t("favoriteAuthClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
