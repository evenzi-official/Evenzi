import type { Metadata } from "next";
import { HelpFabMount } from "@/components/layout/HelpFabMount";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { BusyProvider } from "@/components/ui/BusyProvider";
import { Preloader } from "@/components/ui/Preloader";
import { getAppBaseUrl } from "@/lib/url";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  applicationName: "Evenzi",
  title: {
    default: "Evenzi — Plan, Manage & Celebrate Your Events",
    template: "%s · Evenzi",
  },
  description:
    "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.",
  keywords: [
    "event planning",
    "wedding",
    "RSVP",
    "guest list",
    "invitations",
    "Evenzi",
  ],
  authors: [{ name: "Evenzi" }],
  creator: "Evenzi",
  publisher: "Evenzi",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Evenzi",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Evenzi",
    title: "Evenzi — Plan, Manage & Celebrate Your Events",
    description:
      "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Evenzi",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Evenzi — Plan, Manage & Celebrate Your Events",
    description:
      "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Preloader />
      <RevealObserver />
      <ServiceWorkerRegister />
      <BusyProvider>
        {children}
      </BusyProvider>
      <HelpFabMount />
    </>
  );
}
