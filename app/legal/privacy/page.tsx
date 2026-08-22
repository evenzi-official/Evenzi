import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORT_MAILTO } from '@/lib/constants/support'

export const metadata: Metadata = {
  title: 'Privacy Policy | Evenzi',
  description: 'How Evenzi collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-[#6b7280] hover:text-[#BB0020] transition-colors"
          >
            ← Back to Evenzi
          </Link>
        </div>

        <h1
          className="text-[#1a1a1a] font-bold mb-4"
          style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: "32px" }}
        >
          Privacy Policy
        </h1>
        <p className="text-[#6b7280] mb-12" style={{ fontSize: "14px" }}>
          Last updated: August 2026
        </p>

        <div className="prose max-w-none text-[#374151]" style={{ fontSize: "15px", lineHeight: "1.75" }}>
          <p className="mb-6">
            Evenzi (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting the privacy of
            our users. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our platform.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Information We Collect
          </h2>
          <p className="mb-4">
            We collect information you provide directly to us when you create an account,
            create events, manage guest lists, or contact us for support. This may include
            your name, email address, phone number, and event details.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            How We Use Your Information
          </h2>
          <p className="mb-4">
            We use the information we collect to provide, maintain, and improve our
            services, process transactions, send event-related communications, and respond
            to your requests and inquiries.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Data Security
          </h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration, disclosure, or
            destruction. Your data is stored securely on Supabase (PostgreSQL) with
            row-level security policies.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Your Rights (DPDP Act, 2023)
          </h2>
          <p className="mb-4">
            Under India&apos;s Digital Personal Data Protection Act, 2023, you have the right
            to access, correct, and request deletion of your personal data. To exercise
            these rights, contact us at the address below.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Contact Us
          </h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy or our data practices, please
            reach out to us at{' '}
            <a
              href={SUPPORT_MAILTO()}
              className="text-[#BB0020] hover:underline"
            >
              support@evenzii.com
            </a>
            . We will respond within 3 business days.
          </p>

          <p className="text-[#9ca3af] mt-12 pt-8 border-t border-[#f3f4f6]" style={{ fontSize: "13px" }}>
            This policy is being finalized as Evenzi completes its legal registration.
            The full policy will be published before public launch.
          </p>
        </div>
      </div>
    </main>
  )
}
