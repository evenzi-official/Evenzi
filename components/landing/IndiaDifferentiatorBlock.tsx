"use client";

import React from "react";
import { motion } from "framer-motion";

const SUB_EVENTS = [
  "Haldi",
  "Sangeet",
  "Mehendi",
  "Baraat",
  "Ceremony",
  "Reception",
  "Engagement",
  "Ring Ceremony",
];

const BADGES = [
  "WhatsApp Invitations",
  "+91 India Numbers",
  "₹ Pricing",
  "India-first Support",
];

export default function IndiaDifferentiatorBlock() {
  return (
    <section className="w-full bg-[#BB0020] py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <p
              className="font-sans font-bold uppercase text-[#c8a96e]"
              style={{ fontSize: "10px", letterSpacing: "0.35em" }}
            >
              BUILT FOR INDIA
            </p>
            <h2
              className="font-serif font-light text-white leading-[1.2] tracking-tight mt-4"
              style={{ fontSize: "clamp(28px, 3.5vw, 52px)" }}
            >
              The way India celebrates — we've built for all of it.
            </h2>
            <p
              className="text-[rgba(255,255,255,0.5)] leading-[1.85] mt-6 max-w-sm"
              style={{ fontSize: "14px" }}
            >
              Planning a wedding in India means multiple ceremonies, hundreds of
              guests, budgets in the lakhs, and coordinating everything over
              WhatsApp. Evenzi is built for exactly this.
            </p>
          </motion.div>

          {/* Right — sub-event pill grid */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-wrap gap-3 content-start"
          >
            {SUB_EVENTS.map((ev) => (
              <span
                key={ev}
                className="border border-[rgba(255,255,255,0.4)] text-white rounded-full px-4 py-2 font-semibold tracking-wide cursor-default transition-all duration-200 hover:border-white hover:bg-[rgba(255,255,255,0.12)]"
                style={{ fontSize: "12px" }}
              >
                {ev}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom badges bar */}
        <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-2">
          {BADGES.map((b, i) => (
            <React.Fragment key={b}>
              {i > 0 && (
                <span className="text-[rgba(255,255,255,0.2)]" style={{ fontSize: "11px" }}>
                  ·
                </span>
              )}
              <span
                className="text-[rgba(255,255,255,0.35)] tracking-wide"
                style={{ fontSize: "11px" }}
              >
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
