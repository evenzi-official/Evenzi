import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Cormorant_Garamond, Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Preloader } from "@/components/ui/Preloader";
import { HelpFabMount } from "@/components/layout/HelpFabMount";
import { BusyProvider } from "@/components/ui/BusyProvider";
import { getAppBaseUrl } from "@/lib/url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const APP_DESCRIPTION =
  "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  applicationName: "Evenzi",
  title: {
    default: "Evenzi — Plan, Manage & Celebrate Your Events",
    template: "%s · Evenzi",
  },
  description: APP_DESCRIPTION,
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
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
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
    description: APP_DESCRIPTION,
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
    description: APP_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} ${cormorantGaramond.variable} ${poppins.variable} ${playfairDisplay.variable} antialiased`}>
        <Preloader />
        <RevealObserver />
        <ServiceWorkerRegister />
        <BusyProvider>
          {children}
        </BusyProvider>
        <HelpFabMount />
      </body>
    </html>
  );
}
