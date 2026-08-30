import type { Metadata } from "next";
import { getMarketingBaseUrl } from "@/lib/url";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";

export const metadata: Metadata = {
  metadataBase: new URL(getMarketingBaseUrl()),
  manifest: null,
  title: {
    default: "Evenzi — Plan, Manage & Celebrate Your Events",
    template: "%s · Evenzi",
  },
  description:
    "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ServiceWorkerCleanup />
      {children}
    </>
  );
}
