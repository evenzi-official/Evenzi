"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="w-full bg-[#1C0A08] py-28 md:py-40">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="font-serif font-light text-white leading-[1.1] tracking-tight"
          style={{ fontSize: "clamp(32px, 5vw, 68px)" }}
        >
          Your celebration deserves better.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-[rgba(255,255,255,0.45)] mt-6 leading-[1.7]"
          style={{ fontSize: "15px" }}
        >
          Join hosts planning smarter Indian celebrations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <Link
            href="/auth"
            className="inline-flex items-center px-8 py-4 rounded-full bg-white text-[#080808] font-semibold tracking-[0.06em] shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:bg-[#c8a96e] hover:text-[#080808] transition-all duration-300"
            style={{ fontSize: "14px" }}
          >
            Start Planning Free →
          </Link>
          <p
            className="text-[rgba(255,255,255,0.3)] tracking-wide"
            style={{ fontSize: "11px" }}
          >
            Free to start · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
