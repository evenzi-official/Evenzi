"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function WhatsAppMockup() {
  return (
    <div className="w-[280px] mx-auto select-none rounded-[18px] overflow-hidden shadow-[0_20px_60px_rgba(8,8,8,0.14)]">
      {/* Header bar */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
          <span className="text-white font-bold" style={{ fontSize: "13px" }}>E</span>
        </div>
        <span className="text-white font-semibold" style={{ fontSize: "14px" }}>Evenzi</span>
      </div>

      {/* Message bubble */}
      <div className="bg-white px-4 py-4">
        <p className="font-semibold text-[#080808] leading-[1.5]" style={{ fontSize: "13px" }}>
          🎊 You're invited to Priya &amp; Arjun's Wedding!
        </p>
        <p className="text-[#4b5563] mt-2 leading-[1.65]" style={{ fontSize: "13px" }}>
          Ceremony: Dec 14, 2026<br />
          7:00 PM · Grand Hyatt, Mumbai
        </p>
        <p className="text-[#075E54] mt-3 font-medium" style={{ fontSize: "13px" }}>
          RSVP here → evenzi.app/e/priya-arjun
        </p>
        <div className="flex justify-end mt-3">
          <span className="text-[#9ca3af]" style={{ fontSize: "11px" }}>10:42 AM ✓✓</span>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppSpotlight() {
  return (
    <section className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-center">
        {/* Left — text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <p
            className="font-sans font-bold uppercase text-[#c8a96e]"
            style={{ fontSize: "10px", letterSpacing: "0.35em" }}
          >
            THE INVITATION
          </p>
          <h2
            className="font-serif font-light text-[#080808] tracking-tight leading-[1.2] mt-3"
            style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
          >
            Send wedding invitations via WhatsApp. In one tap.
          </h2>
          <p
            className="text-[rgba(8,8,8,0.55)] leading-[1.85] mt-6 max-w-lg"
            style={{ fontSize: "14px" }}
          >
            Your guests don't use email. They use WhatsApp. Evenzi generates a
            personalised invitation message for each guest and sends it with
            their RSVP link included — no copy-paste, no manual work.
          </p>
          <Link
            href="/auth"
            className="mt-8 inline-flex items-center gap-1.5 text-[#BB0020] font-semibold hover:underline transition-all"
            style={{ fontSize: "13px" }}
          >
            Try it free →
          </Link>
        </motion.div>

        {/* Right — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex justify-center"
        >
          <WhatsAppMockup />
        </motion.div>
      </div>
    </section>
  );
}
