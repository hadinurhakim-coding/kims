"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeToCookieConsent,
} from "./consent";

type AnalyticsScriptsProps = {
  umamiScriptUrl?: string;
  umamiWebsiteId?: string;
};

export function AnalyticsScripts({
  umamiScriptUrl,
  umamiWebsiteId,
}: AnalyticsScriptsProps) {
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );

  if (consent !== "accepted" || !umamiScriptUrl || !umamiWebsiteId) {
    return null;
  }

  return (
    <Script
      data-website-id={umamiWebsiteId}
      src={umamiScriptUrl}
      strategy="afterInteractive"
    />
  );
}
