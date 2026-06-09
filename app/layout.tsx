import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorker } from "@/components/ServiceWorker";
import { LanguageProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import { getProfile } from "@/lib/queries";

const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin", "hebrew"] });

export const metadata: Metadata = {
  title: "Sabzi Expenses",
  description: "Track spending in two taps.",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Sabzi" },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getProfile();
  const locale = (profile?.language ?? "he") as Locale;
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${rubik.variable} h-full antialiased`}>
      <body className="mx-auto flex min-h-full max-w-md flex-col">
        <LanguageProvider initialLocale={locale}>
          {children}
          <BottomNav />
        </LanguageProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
