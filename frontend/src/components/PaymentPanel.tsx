import { useState } from "react";
import { useI18n } from "../i18n";
import { unlockContact, subscribePro } from "../api/client";
import { getClientToken, CONTACT_UNLOCK_AMD, PRO_SUBSCRIPTION_AMD, TELEGRAM_BOT_URL } from "../utils/clientToken";

interface Props {
  propertyId?: string;
  mode: "contact" | "pro";
  onUnlocked?: (phone: string) => void;
}

export default function PaymentPanel({ propertyId, mode, onUnlocked }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [proActive, setProActive] = useState(false);

  const amount = mode === "contact" ? CONTACT_UNLOCK_AMD : PRO_SUBSCRIPTION_AMD;

  const handlePay = async (paymentMethod: "demo" | "idram") => {
    setLoading(true);
    setError(null);
    try {
      const clientToken = getClientToken();
      if (mode === "contact") {
        if (!propertyId) return;
        const res = await unlockContact({
          property_id: propertyId,
          client_token: clientToken,
          payment_method: paymentMethod,
        });
        if (res.phone) {
          setPhone(res.phone);
          onUnlocked?.(res.phone);
        } else if (res.status === "pending") {
          setError(t("payProPending"));
        }
      } else {
        const res = await subscribePro({
          client_token: clientToken,
          payment_method: paymentMethod,
        });
        if (res.status === "paid" || res.plan === "pro") {
          setProActive(true);
        } else {
          setError(t("payProPending"));
        }
      }
    } catch {
      setError(t("payUnlockError"));
    } finally {
      setLoading(false);
    }
  };

  if (phone) {
    return (
      <div className="payment-panel payment-panel-success">
        <p className="payment-panel-label">{t("payUnlockSuccess")}</p>
        <a href={`tel:+${phone.replace(/\D/g, "")}`} className="payment-panel-phone">
          +{phone}
        </a>
      </div>
    );
  }

  if (proActive) {
    return (
      <div className="payment-panel payment-panel-success">
        <p className="payment-panel-label">{t("payProSuccess")}</p>
        <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className="btn-cta mt-3">
          {t("mktProTelegram")}
        </a>
      </div>
    );
  }

  return (
    <div className="payment-panel">
      <p className="payment-panel-amount">֏{amount.toLocaleString("hy-AM")}</p>
      <p className="payment-panel-hint">
        {mode === "contact" ? t("payUnlockWhy") : t("payProHint")}
      </p>
      {error && <p className="payment-panel-error">{error}</p>}
      <div className="payment-panel-actions">
        <button
          type="button"
          className="btn-cta"
          disabled={loading}
          onClick={() => handlePay("demo")}
        >
          {loading ? t("payUnlockLoading") : mode === "pro" ? t("payProBtn") : t("payUnlockBtn")}
        </button>
        <button
          type="button"
          className="btn-outline"
          disabled={loading}
          onClick={() => handlePay("idram")}
        >
          {t("payUnlockIdram")}
        </button>
        <button
          type="button"
          className="btn-outline text-sm"
          disabled={loading}
          onClick={() => handlePay("demo")}
        >
          {t("payUnlockDemo")}
        </button>
      </div>
    </div>
  );
}
