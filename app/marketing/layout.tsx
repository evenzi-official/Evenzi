import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/url";

export const metadata: Metadata = {
  // TODO(subdomain-split): use getMarketingBaseUrl() in Pass 2.
  metadataBase: new URL(getAppBaseUrl()),
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
  return children;
}
