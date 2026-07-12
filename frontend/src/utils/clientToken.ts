const STORAGE_KEY = "smartestate_client_token";

export function getClientToken(): string {
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export const CONTACT_UNLOCK_AMD = 4000;
export const PRO_SUBSCRIPTION_AMD = 9000;
export const TELEGRAM_BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/SmartEstateArmeniaBot";
