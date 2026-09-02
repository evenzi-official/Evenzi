import type { Metadata } from "next";
import { getAdminBaseUrl } from "@/lib/url";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";

export const metadata: Metadata = {
  metadataBase: new URL(getAdminBaseUrl()),
  manifest: null,
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
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
