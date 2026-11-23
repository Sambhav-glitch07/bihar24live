import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Hindi and English news from Bihar and across India.",
  alternates: { languages: { hi: "/hi", en: "/en" } },
  openGraph: { type: "website", siteName: SITE_NAME, url: SITE_URL, title: SITE_NAME, description: "Hindi and English news from Bihar and across India." }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="hi"><body><SiteHeader />{children}<SiteFooter /></body></html>;
}
