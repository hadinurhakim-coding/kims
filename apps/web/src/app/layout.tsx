import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIMS - Kim's Music Station",
  description: "A free sound library platform for content creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
