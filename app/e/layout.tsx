import { BusyProvider } from "@/components/ui/BusyProvider";

/**
 * Layout for the public guest site (`/e/[slug]`).
 *
 * The guest site lives outside `app/app/`, so it does NOT inherit the app
 * surface's providers. `BusyProvider` used to wrap it via the root layout, but
 * the subdomain split (881d8a94) moved `BusyProvider` into `app/app/layout.tsx`
 * and left the root layout bare — which left `GuestLookupForm` / `PasswordGate`
 * calling `useBusy()` with no provider ancestor, crashing every guest page with
 * "useBusy must be used within <BusyProvider>". This layout restores the
 * provider for the guest-site subtree only.
 */
export default function GuestSiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BusyProvider>{children}</BusyProvider>;
}
