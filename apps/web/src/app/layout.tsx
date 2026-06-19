import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "../components/shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIMS - Kim's Music Station",
  description: "A free sound library platform for content creators.",
};

const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
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
