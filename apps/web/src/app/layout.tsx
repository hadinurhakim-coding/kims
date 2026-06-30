import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AnalyticsScripts } from "@/components/privacy/AnalyticsScripts";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { AudioProvider } from "@/context/AudioContext";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TracksProvider } from "@/context/TracksContext";
import "./globals.css";

const themeBootScript = `
(function() {
  try {
    var storedTheme = window.localStorage.getItem('kims-theme');
    var preference = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
    var resolvedTheme = preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    var root = document.documentElement;
    root.classList.add('no-transition');
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', resolvedTheme);
    }
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export const metadata: Metadata = {
  title: "KIMS - Kim's Music Station",
  description: "A free sound library platform for content creators.",
  other: {
    "color-scheme": "light dark",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} no-transition`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
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
