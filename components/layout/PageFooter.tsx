import Link from "next/link";
import { SUPPORT_MAILTO } from "@/lib/constants/support";

type FooterLink = { label: string; href: string };

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Guest Management", href: "/auth" },
  { label: "Digital Invitations", href: "/auth" },
  { label: "Event Website", href: "/auth" },
  { label: "Budget Tracker", href: "/auth" },
  { label: "Photo Gallery", href: "/auth" },
  { label: "Planning Tools", href: "/auth" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Help & Support", href: "/help" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Contact Us", href: SUPPORT_MAILTO() },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "About Evenzi", href: "#about" },
  { label: "Contact Us", href: SUPPORT_MAILTO() },
];

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p
        className="font-bold text-[#9ca3af] tracking-[0.2em] uppercase mb-4"
        style={{ fontSize: "10px" }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map((l) =>
          l.href.startsWith("mailto:") || l.href.startsWith("#") ? (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-[#6b7280] hover:text-[#BB0020] transition-colors duration-200"
                style={{ fontSize: "13px" }}
              >
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link
                href={l.href}
                className="text-[#6b7280] hover:text-[#BB0020] transition-colors duration-200"
                style={{ fontSize: "13px" }}
              >
                {l.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="w-full bg-[#f9fafb] border-t border-[#e5e7eb]">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 shrink-0 rounded-full bg-[#BB0020] text-white inline-flex items-center justify-center text-sm font-bold">
                E
              </span>
              <span
                className="font-bold text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: "16px" }}
              >
                Evenzi
              </span>
            </div>
            <p className="text-[#9ca3af] leading-[1.7]" style={{ fontSize: "12px" }}>
              Capture · Share · Cherish
            </p>
          </div>

          <FooterCol title="Product" links={PRODUCT_LINKS} />
          <FooterCol title="Support" links={SUPPORT_LINKS} />
          <FooterCol title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#f3f4f6] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#9ca3af]" style={{ fontSize: "12px" }}>
            © 2026 Evenzi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[#9ca3af]" style={{ fontSize: "12px" }}>
            <Link href="/legal/privacy" className="hover:text-[#BB0020] transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-[#BB0020] transition-colors">
              Terms
            </Link>
            <a href={SUPPORT_MAILTO()} className="hover:text-[#BB0020] transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
