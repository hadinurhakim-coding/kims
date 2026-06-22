import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AudioProvider } from "@/context/AudioContext";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIMS - Kim's Music Station",
  description: "A free sound library platform for content creators.",
};

const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
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
          <HistoryProvider>
            <AudioProvider>
              <FavoritesProvider>
                <PlaylistProvider>{children}</PlaylistProvider>
              </FavoritesProvider>
            </AudioProvider>
          </HistoryProvider>
        </AuthProvider>
        {umamiScriptUrl && umamiWebsiteId ? (
          <Script
            data-website-id={umamiWebsiteId}
            src={umamiScriptUrl}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
