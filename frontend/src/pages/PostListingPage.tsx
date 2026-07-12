import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDistricts, submitListing, uploadListingPhoto } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { resolvePhotoUrl } from "../utils/images";
import { VELOTOOLS_COMPRESSOR_URL } from "../utils/veloTools";

type DealType = "sale" | "rent";
type PropertyType = "apartment" | "house" | "commercial";
type PriceCurrency = "AMD" | "USD" | "EUR";

const STEPS = ["postStep1", "postStep2", "postStep3", "postStep4"] as const;
const AMD_PER_USD = 390;
const AMD_PER_EUR = 410;

const PROPERTY_TYPES: {
  value: PropertyType;
  labelKey: "postTypeApartment" | "postTypeHouse" | "postTypeCommercial";
  icon: string;
  tone: string;
}[] = [
  { value: "apartment", labelKey: "postTypeApartment", icon: "🏢", tone: "sky" },
  { value: "house", labelKey: "postTypeHouse", icon: "🏠", tone: "emerald" },
  { value: "commercial", labelKey: "postTypeCommercial", icon: "🏬", tone: "violet" },
];

const CURRENCIES: { value: PriceCurrency; labelKey: "postPriceAmd" | "postPriceUsd" | "postPriceEur"; symbol: string }[] = [
  { value: "AMD", labelKey: "postPriceAmd", symbol: "֏" },
  { value: "USD", labelKey: "postPriceUsd", symbol: "$" },
  { value: "EUR", labelKey: "postPriceEur", symbol: "€" },
];

function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/\s/g, "")) || 0;
}

function toAmd(amount: number, currency: PriceCurrency): number {
  if (currency === "USD") return Math.round(amount * AMD_PER_USD);
  if (currency === "EUR") return Math.round(amount * AMD_PER_EUR);
  return Math.round(amount);
}

export default function PostListingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(0);
  const [districts, setDistricts] = useState<string[]>([]);
  const [dealType, setDealType] = useState<DealType>("sale");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>("AMD");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [hidePhone, setHidePhone] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    if (user?.name && !contactName) setContactName(user.name);
    if (user?.email && !contactEmail) setContactEmail(user.email);
  }, [user, contactName, contactEmail]);

  const showRooms = propertyType !== "commercial";
  const priceAmd = useMemo(
    () => toAmd(parseAmount(priceInput), priceCurrency),
    [priceInput, priceCurrency],
  );

  const pricePreview = useMemo(() => {
    if (!priceInput.trim()) return "—";
    const suffix = dealType === "rent" ? ` ${t("postPricePerMonth")}` : "";
    if (priceCurrency === "AMD") return `${priceInput} ֏${suffix}`;
    if (priceCurrency === "USD") return `$${priceInput}${suffix} (≈ ${priceAmd.toLocaleString()} ֏)`;
    return `€${priceInput}${suffix} (≈ ${priceAmd.toLocaleString()} ֏)`;
  }, [priceInput, priceCurrency, dealType, priceAmd, t]);

  const removePhoto = (url: string) => {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  };

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, 10 - photoUrls.length)) {
        const { url } = await uploadListingPhoto(file);
        added.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...added].slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("postError"));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handlePhotos(e.dataTransfer.files);
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!priceInput.trim()) return t("postErrPrice");
      if (priceAmd <= 0) return t("postErrPriceInvalid");
      if (showRooms && !rooms.trim()) return t("postErrRooms");
      return null;
    }
    if (s === 1) {
      if (!district) return t("postErrDistrict");
      if (!title.trim() || title.length < 5) return t("postErrTitle");
      if (!description.trim() || description.length < 20) return t("postErrDescription");
      return null;
    }
    if (s === 2) {
      if (!photoUrls.length) return t("postErrPhotos");
      return null;
    }
    if (s === 3) {
      if (!contactName.trim()) return t("postErrContactName");
      if (hidePhone) {
        if (!contactEmail.trim()) return t("postErrContactEmail");
      } else if (!contactPhone.trim()) {
        return t("postErrContactPhone");
      }
      return null;
    }
    return null;
  };

  const canProceed = (s: number) => validateStep(s) === null;

  const goToStep = (target: number) => {
    if (target === step) return;
    setError(null);
    setStep(target);
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handlePublish = async () => {
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitListing({
        deal_type: dealType,
        property_type: propertyType,
        district,
        street: street || undefined,
        rooms: showRooms && rooms ? Number(rooms) : undefined,
        floor: propertyType === "apartment" && floor ? Number(floor) : undefined,
        total_floors: propertyType === "apartment" && totalFloors ? Number(totalFloors) : undefined,
        area_sqm: areaSqm ? Number(areaSqm) : undefined,
        price_amd: priceAmd,
        title,
        description,
        contact_name: contactName,
        contact_phone: hidePhone ? undefined : contactPhone,
        contact_email: contactEmail || undefined,
        hide_phone: hidePhone,
        photo_urls: photoUrls,
      }, user?.token);
      navigate(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("postError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    handlePublish();
  };

  const pricePlaceholder =
    dealType === "rent" ? t("postPriceHintRent") : t("postPriceHintSale");

  return (
    <div className="post-page py-10 md:py-14">
      <div className="post-page-deco" aria-hidden />
      <div className="site-container relative max-w-3xl">
        <p className="marketing-eyebrow">{t("navPost")}</p>
        <h1 className="marketing-title text-3xl md:text-4xl">{t("postTitle")}</h1>
        <p className="marketing-lead mt-3">{t("postSubtitle")}</p>

        <form onSubmit={onFormSubmit} className="post-form-shell mt-8">
          <div className="post-steps" role="tablist" aria-label={t("postTitle")}>
            {STEPS.map((key, i) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={step === i}
                aria-disabled={i > step && !canProceed(step)}
                onClick={() => goToStep(i)}
                className={`post-step-pill${step === i ? " active" : ""}${step > i ? " done" : ""}`}
              >
                <span className="post-step-num">{i + 1}</span>
                {t(key)}
              </button>
            ))}
          </div>

          <div className="space-y-6 p-6 md:p-8">
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <span className="post-field-label">{t("postDealType")}</span>
                  <div className="post-toggle-group" role="radiogroup" aria-label={t("postDealType")}>
                    {(["sale", "rent"] as DealType[]).map((dt) => (
                      <button
                        key={dt}
                        type="button"
                        role="radio"
                        aria-checked={dealType === dt}
                        onClick={() => setDealType(dt)}
                        className={`post-toggle-btn${dealType === dt ? (dt === "sale" ? " active-sale" : " active-rent") : ""}`}
                      >
                        {dt === "sale" ? t("postSale") : t("postRent")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="post-field-label">{t("postPropertyType")}</span>
                  <div className="post-type-grid" role="radiogroup" aria-label={t("postPropertyType")}>
                    {PROPERTY_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        role="radio"
                        aria-checked={propertyType === pt.value}
                        onClick={() => setPropertyType(pt.value)}
                        className={`post-type-card post-type-${pt.tone}${propertyType === pt.value ? " post-type-active" : ""}`}
                      >
                        <span className="post-type-icon" aria-hidden>{pt.icon}</span>
                        <span className="post-type-label">{t(pt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="post-field-label">{t("postPrice")}</span>
                  <div className="post-price-row">
                    <div className="post-price-wrap post-price-wrap-wide">
                      <input
                        id="price"
                        required
                        inputMode="numeric"
                        value={priceInput}
                        onChange={(e) => setPriceInput(formatNumberInput(e.target.value))}
                        className="post-input post-price-input"
                        placeholder={pricePlaceholder}
                        aria-describedby="price-hint"
                      />
                      <span className="post-price-currency">
                        {CURRENCIES.find((c) => c.value === priceCurrency)?.symbol}
                      </span>
                    </div>
                    <div className="post-currency-group" role="radiogroup" aria-label={t("postPrice")}>
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          role="radio"
                          aria-checked={priceCurrency === c.value}
                          onClick={() => setPriceCurrency(c.value)}
                          className={`post-currency-btn${priceCurrency === c.value ? " active" : ""}`}
                        >
                          {t(c.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p id="price-hint" className="post-price-hint">{pricePreview}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {showRooms && (
                    <div>
                      <label className="post-field-label" htmlFor="rooms">{t("postRooms")}</label>
                      <input
                        id="rooms"
                        type="number"
                        min={1}
                        required
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                        className="post-input"
                      />
                    </div>
                  )}
                  {propertyType === "apartment" && (
                    <>
                      <div>
                        <label className="post-field-label" htmlFor="floor">{t("postFloor")}</label>
                        <input id="floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} className="post-input" />
                      </div>
                      <div>
                        <label className="post-field-label" htmlFor="total-floors">{t("postTotalFloors")}</label>
                        <input id="total-floors" type="number" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} className="post-input" />
                      </div>
                    </>
                  )}
                  <div className={showRooms && propertyType === "apartment" ? "" : "md:col-span-2"}>
                    <label className="post-field-label" htmlFor="area">{t("postArea")}</label>
                    <input id="area" type="number" step="0.1" min={0} value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} className="post-input" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <p className="post-step-hint">{t("postLocationHint")}</p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="post-field-label" htmlFor="district">{t("postDistrict")}</label>
                    <select id="district" required value={district} onChange={(e) => setDistrict(e.target.value)} className="post-input post-select">
                      <option value="">{t("postDistrictPlaceholder")}</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="post-field-label" htmlFor="street">{t("postStreet")}</label>
                    <input id="street" value={street} onChange={(e) => setStreet(e.target.value)} className="post-input" placeholder={t("postStreetPlaceholder")} />
                  </div>
                </div>
                <div>
                  <label className="post-field-label" htmlFor="title-field">{t("postTitleField")}</label>
                  <input id="title-field" required minLength={5} value={title} onChange={(e) => setTitle(e.target.value)} className="post-input" placeholder={t("postTitlePlaceholder")} />
                </div>
                <div>
                  <label className="post-field-label" htmlFor="description">{t("postDescription")}</label>
                  <textarea id="description" required minLength={20} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="post-input post-textarea" placeholder={t("postDescriptionPlaceholder")} />
                  <p className="post-char-hint">{description.length} / 20+</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="post-step-hint">{t("postPhotosStepHint")}</p>
                <div
                  className={`post-photo-dropzone${dragOver ? " post-photo-dropzone-active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <div className="post-photo-grid">
                    {photoUrls.map((url) => (
                      <div key={url} className="post-photo-tile">
                        <img src={resolvePhotoUrl(url)} alt="" />
                        <button type="button" className="post-photo-remove" onClick={() => removePhoto(url)} aria-label="Remove">×</button>
                      </div>
                    ))}
                    {photoUrls.length < 10 && (
                      <label className="post-photo-add">
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={uploading} onChange={(e) => handlePhotos(e.target.files)} />
                        <span className="text-2xl">{uploading ? "…" : "+"}</span>
                        <span>{uploading ? t("postUploading") : t("postPhotosAdd")}</span>
                      </label>
                    )}
                  </div>
                  <p className="post-photo-drop-hint">{t("postPhotosDrop")}</p>
                </div>
                <a href={VELOTOOLS_COMPRESSOR_URL} target="_blank" rel="noreferrer" className="post-velotools-link">
                  ✨ {t("postVeloTools")} →
                </a>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="post-step-hint">{t("postContactHint")}</p>
                {!isAuthenticated && (
                  <p className="post-step-hint">
                    <Link to="/account" className="text-sky-400 underline">{t("sellerLoginPrompt")}</Link>
                  </p>
                )}
                <div className="post-preview-card">
                  <p className="post-preview-label">{t("postPreview")}</p>
                  <p className="post-preview-title">{title || "—"}</p>
                  <p className="post-preview-meta">
                    {t(PROPERTY_TYPES.find((p) => p.value === propertyType)!.labelKey)} · {district || "—"} · {pricePreview}
                  </p>
                  <p className="post-preview-photos">{photoUrls.length} {t("postPhotos")}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="post-field-label" htmlFor="contact-name">{t("postContactName")}</label>
                    <input id="contact-name" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="post-input" placeholder={t("postContactNamePlaceholder")} />
                  </div>
                  <div>
                    <label className="post-field-label" htmlFor="contact-email">{t("postContactEmail")}</label>
                    <input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="post-input" placeholder="you@email.com" />
                  </div>
                </div>
                <label className="post-hide-phone-toggle">
                  <input type="checkbox" checked={hidePhone} onChange={(e) => setHidePhone(e.target.checked)} />
                  <span>{t("postHidePhone")}</span>
                </label>
                {!hidePhone && (
                  <div>
                    <label className="post-field-label" htmlFor="contact-phone">{t("postContactPhone")}</label>
                    <input id="contact-phone" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="post-input" placeholder="+374 91 123456" />
                  </div>
                )}
              </div>
            )}

            {error && <p className="post-error" role="alert">{error}</p>}

            <div className="post-nav-row">
              <div>
                {step > 0 ? (
                  <button type="button" onClick={goBack} className="btn-outline btn-outline-lg">{t("postBack")}</button>
                ) : (
                  <Link to="/" className="post-home-link">← {t("navHome")}</Link>
                )}
              </div>
              <div>
                {step < STEPS.length - 1 ? (
                  <button
                    type="submit"
                    disabled={!canProceed(step)}
                    className="btn-cta btn-primary-lg post-next-btn"
                  >
                    {t("postNext")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || uploading || !canProceed(step)}
                    className="btn-cta btn-primary-lg"
                  >
                    {submitting ? t("postSubmitting") : t("postSubmit")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
