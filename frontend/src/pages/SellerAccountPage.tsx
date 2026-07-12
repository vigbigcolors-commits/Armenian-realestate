import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getSellerFavorites,
  getSellerListings,
  getSellerProfile,
  sellerLogin,
  sellerRegister,
  type SellerListing,
  type SellerProfile,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { resolvePhotoUrl } from "../utils/images";

type Tab = "listings" | "favorites" | "profile";

export default function SellerAccountPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("listings");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [favorites, setFavorites] = useState<SellerListing[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.token) return;
    setLoading(true);
    Promise.all([
      getSellerProfile(user.token),
      getSellerListings(user.token),
      getSellerFavorites(user.token),
    ])
      .then(([p, l, f]) => {
        setProfile(p);
        setListings(l);
        setFavorites(f);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("sellerError")))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.token, t]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await sellerLogin({ email, password })
          : await sellerRegister({ email, password, name, phone: phone || undefined });
      login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        token: result.token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sellerError"));
    } finally {
      setLoading(false);
    }
  };

  const renderListingCard = (item: SellerListing) => {
    const photo = item.photo_urls?.[0];
    return (
      <Link key={item.id} to={`/property/${item.id}`} className="seller-listing-card">
        <div className="seller-listing-thumb">
          {photo ? <img src={resolvePhotoUrl(photo)} alt="" /> : <span>🏠</span>}
        </div>
        <div>
          <p className="seller-listing-title">{item.title}</p>
          <p className="seller-listing-meta">
            {item.district} · ${item.current_price_usd?.toLocaleString()}
            {item.deal_type === "rent" ? t("postPricePerMonth") : ""}
          </p>
        </div>
      </Link>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="seller-page py-12 md:py-16">
        <div className="site-container max-w-lg">
          <p className="marketing-eyebrow">{t("sellerEyebrow")}</p>
          <h1 className="marketing-title text-3xl">{t("sellerAuthTitle")}</h1>
          <p className="marketing-lead mt-3">{t("sellerAuthLead")}</p>

          <div className="seller-auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              {t("sellerLogin")}
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              {t("sellerRegister")}
            </button>
          </div>

          <form onSubmit={handleAuth} className="seller-auth-form">
            {mode === "register" && (
              <>
                <label className="post-field-label" htmlFor="seller-name">{t("postContactName")}</label>
                <input id="seller-name" required value={name} onChange={(e) => setName(e.target.value)} className="post-input" />
                <label className="post-field-label mt-4" htmlFor="seller-phone">{t("postContactPhone")}</label>
                <input id="seller-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="post-input" />
              </>
            )}
            <label className="post-field-label mt-4" htmlFor="seller-email">Email</label>
            <input id="seller-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="post-input" />
            <label className="post-field-label mt-4" htmlFor="seller-password">{t("sellerPassword")}</label>
            <input id="seller-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="post-input" />
            {error && <p className="post-error mt-4">{error}</p>}
            <button type="submit" disabled={loading} className="btn-cta btn-primary-lg mt-6 w-full">
              {loading ? "…" : mode === "login" ? t("sellerLogin") : t("sellerRegister")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page py-10 md:py-14">
      <div className="site-container max-w-4xl">
        <div className="seller-dashboard-header">
          <div>
            <p className="marketing-eyebrow">{t("sellerCabinet")}</p>
            <h1 className="marketing-title text-3xl">{profile?.name || user?.name}</h1>
            <p className="marketing-lead mt-2">{profile?.email}</p>
          </div>
          <div className="seller-dashboard-actions">
            <Link to="/post" className="btn-emerald">{t("navPost")}</Link>
            <button type="button" onClick={logout} className="btn-outline">{t("sellerLogout")}</button>
          </div>
        </div>

        <div className="seller-stats-row">
          <div className="seller-stat"><span>{profile?.listings_count ?? 0}</span><small>{t("sellerMyListings")}</small></div>
          <div className="seller-stat"><span>{profile?.favorites_count ?? 0}</span><small>{t("sellerFavorites")}</small></div>
        </div>

        <div className="seller-tabs">
          {(["listings", "favorites", "profile"] as Tab[]).map((key) => (
            <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              {t(key === "listings" ? "sellerMyListings" : key === "favorites" ? "sellerFavorites" : "sellerProfile")}
            </button>
          ))}
        </div>

        {loading && <p className="text-white/50 mt-6">{t("sellerLoading")}</p>}
        {error && <p className="post-error mt-4">{error}</p>}

        {tab === "listings" && !loading && (
          <div className="seller-list-grid mt-6">
            {listings.length ? listings.map(renderListingCard) : (
              <div className="seller-empty">
                <p>{t("sellerNoListings")}</p>
                <Link to="/post" className="btn-cta btn-primary-lg mt-4 inline-flex">{t("sellerPostFirst")}</Link>
              </div>
            )}
          </div>
        )}

        {tab === "favorites" && !loading && (
          <div className="seller-list-grid mt-6">
            {favorites.length ? favorites.map(renderListingCard) : (
              <p className="seller-empty">{t("sellerNoFavorites")}</p>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="seller-profile-card mt-6">
            <p><strong>{t("postContactName")}:</strong> {profile?.name}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>{t("postContactPhone")}:</strong> {profile?.phone || "—"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
