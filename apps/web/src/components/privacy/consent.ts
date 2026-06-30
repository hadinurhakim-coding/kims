export const COOKIE_CONSENT_STORAGE_KEY = "kims-cookie-consent";

export type CookieConsentChoice = "accepted" | "declined";
export type CookieConsentSnapshot = CookieConsentChoice | "pending" | "unset";

export function subscribeToCookieConsent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("kims-cookie-consent-changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("kims-cookie-consent-changed", onStoreChange);
  };
}

export function readCookieConsent() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return storedValue === "accepted" || storedValue === "declined"
    ? storedValue
    : null;
}

export function getCookieConsentSnapshot(): CookieConsentSnapshot {
  return readCookieConsent() ?? "unset";
}

export function getCookieConsentServerSnapshot(): CookieConsentSnapshot {
  return "pending";
}

export function writeCookieConsent(choice: CookieConsentChoice) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent("kims-cookie-consent-changed"));
}
