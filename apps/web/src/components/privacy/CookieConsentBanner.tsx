"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeToCookieConsent,
  writeCookieConsent,
} from "./consent";

type CookieConsentBannerProps = {
  analyticsEnabled: boolean;
};

export function CookieConsentBanner({
  analyticsEnabled,
}: CookieConsentBannerProps) {
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );

  if (!analyticsEnabled || consent !== "unset") {
    return null;
  }

  const chooseConsent = (choice: "accepted" | "declined") => {
    writeCookieConsent(choice);
  };

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/15 sm:inset-x-6 sm:bottom-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-950">
            Analytics cookies
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            KIMS uses optional privacy-conscious analytics to understand which
            pages and features are useful. You can accept or decline now.
          </p>
          <Link
            className="mt-2 inline-flex text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
            href="/privacy"
          >
            Privacy Policy
          </Link>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={() => chooseConsent("declined")}
            type="button"
          >
            Decline
          </button>
          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            onClick={() => chooseConsent("accepted")}
            type="button"
          >
            Accept
          </button>
        </div>
      </div>
    </section>
  );
}
