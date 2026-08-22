import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORT_MAILTO } from '@/lib/constants/support'

export const metadata: Metadata = {
  title: 'Terms of Service | Evenzi',
  description: 'The terms and conditions governing your use of Evenzi.',
}

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-[#6b7280] mb-12" style={{ fontSize: "14px" }}>
          Last updated: August 2026
        </p>

        <div className="prose max-w-none text-[#374151]" style={{ fontSize: "15px", lineHeight: "1.75" }}>
          <p className="mb-6">
            By accessing or using Evenzi (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service. Please read them carefully before using the platform.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Use of the Service
          </h2>
          <p className="mb-4">
            Evenzi provides event planning tools including guest management, RSVP
            collection, digital invitations, and event websites. You agree to use the
            Service only for lawful purposes and in accordance with these Terms.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Accounts
          </h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account. You must
            notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            User Content
          </h2>
          <p className="mb-4">
            You retain ownership of content you upload to Evenzi (photos, event details,
            guest information). By uploading content, you grant Evenzi a limited license
            to store and serve that content to provide the Service. We do not sell or
            share your content with third parties.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Limitation of Liability
          </h2>
          <p className="mb-4">
            Evenzi is provided &quot;as is&quot; during its early access period. We are not liable
            for any indirect, incidental, or consequential damages arising from your use
            of the Service. Our total liability shall not exceed the amount you paid us in
            the twelve months preceding the claim.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Changes to Terms
          </h2>
          <p className="mb-4">
            We may update these Terms from time to time. We will notify you of material
            changes by email or through the Service. Continued use after changes take
            effect constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-[#1a1a1a] font-semibold mb-3 mt-8" style={{ fontSize: "18px" }}>
            Contact
          </h2>
          <p className="mb-4">
            Questions about these Terms? Contact us at{' '}
            <a
              href={SUPPORT_MAILTO()}
              className="text-[#BB0020] hover:underline"
            >
              support@evenzii.com
            </a>
            .
          </p>

          <p className="text-[#9ca3af] mt-12 pt-8 border-t border-[#f3f4f6]" style={{ fontSize: "13px" }}>
            These terms are being finalized as Evenzi completes its legal registration.
            The full terms will be published before public launch. Governing law: India.
          </p>
        </div>
      </div>
    </main>
  )
}
