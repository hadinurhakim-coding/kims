import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AnalyticsScripts } from "@/components/privacy/AnalyticsScripts";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { AudioProvider } from "@/context/AudioContext";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { TracksProvider } from "@/context/TracksContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIMS - Kim's Music Station",
  description: "A free sound library platform for content creators.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <TracksProvider>
            <HistoryProvider>
              <AudioProvider>
                <FavoritesProvider>
                  <PlaylistProvider>{children}</PlaylistProvider>
                </FavoritesProvider>
              </AudioProvider>
            </HistoryProvider>
          </TracksProvider>
        </AuthProvider>
        <AnalyticsScripts
          umamiScriptUrl={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          umamiWebsiteId={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        />
        <CookieConsentBanner
          analyticsEnabled={Boolean(
            process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL &&
              process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
          )}
        />
      </body>
    </html>
  );
}
