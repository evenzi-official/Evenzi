"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "group",
    title: "Guest Management",
    desc: "Add guests, import via CSV, track RSVPs in real time. Replace the spreadsheet.",
  },
  {
    icon: "chat",
    title: "WhatsApp Invitations",
    desc: "Beautiful personalised invitations delivered via WhatsApp — where your guests actually are.",
  },
  {
    icon: "language",
    title: "Event Website",
    desc: "A stunning public page — venue, schedule, and RSVP — no tech skills needed.",
  },
  {
    icon: "payments",
    title: "Budget Tracker",
    desc: "Log expenses in ₹, track spending by category, and never go over budget.",
  },
  {
    icon: "photo_library",
    title: "Photo Gallery",
    desc: "Every memory from every guest, uploaded and curated in one beautiful place.",
  },
  {
    icon: "checklist",
    title: "Planning Checklist",
    desc: "Pre-built Indian wedding checklists. Tick off every detail from Haldi to Reception.",
  },
];

export default function FeatureShowcaseGrid() {
  return (
    <section id="features" className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <p
            className="font-sans font-bold tracking-[0.35em] uppercase text-[#c8a96e]"
            style={{ fontSize: "10px" }}
          >
            FEATURES
          </p>
          <h2 className="font-serif font-light tracking-tight mt-3 text-[#080808]" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
            Everything for your celebration
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
              className="group bg-white border border-[rgba(8,8,8,0.07)] rounded-[20px] p-7 transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(8,8,8,0.10)] hover:border-[rgba(187,0,32,0.25)]"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(187,0,32,0.08)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#BB0020]" style={{ fontSize: "20px" }}>
                  {f.icon}
                </span>
              </div>
              <h3 className="font-sans font-bold text-[#080808] mt-4 mb-2" style={{ fontSize: "16px" }}>
                {f.title}
              </h3>
              <p className="font-sans text-[rgba(8,8,8,0.55)] leading-[1.7]" style={{ fontSize: "13px" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
