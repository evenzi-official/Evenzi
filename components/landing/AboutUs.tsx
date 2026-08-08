"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUs() {
  return (
    <section id="about" className="w-full bg-[#F4EFE8] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">

        {/* Desktop: 3-col editorial grid */}
        <div className="hidden lg:grid grid-cols-[200px_1fr_240px] gap-x-10 items-start">

          {/* Col 1 — small photo top-left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="pt-2"
          >
            <Image
              src="https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=400&q=80"
              alt="Indian wedding ceremony"
              width={200}
              height={260}
              className="w-full h-[260px] object-cover rounded-[14px]"
            />
          </motion.div>

          {/* Col 2 — headline + body */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <h2
              className="font-serif font-light text-[#080808] leading-[1.2] tracking-tight"
              style={{ fontSize: "clamp(26px, 2.8vw, 44px)" }}
            >
              <span className="font-bold">Evenzi</span> is more than planning —
              it&apos;s every ceremony, every guest, every memory.
            </h2>

            <div className="mt-7 space-y-4">
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.9]" style={{ fontSize: "14px" }}>
                Here, families come together across cities and traditions. Some plan months ahead,
                others days before. All of them deserve a platform that keeps pace with the joy.
              </p>
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.9]" style={{ fontSize: "14px" }}>
                We built Evenzi for the Indian host — the one coordinating over WhatsApp, tracking
                RSVPs in a spreadsheet, and somehow holding everything together. You deserve better.
              </p>
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.9]" style={{ fontSize: "14px" }}>
                Our mission is simple: bring every part of your celebration into one place,
                so you can be fully present for the moments that matter most.
              </p>
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.9]" style={{ fontSize: "14px" }}>
                Because when the planning is taken care of, the joy takes over.
              </p>
            </div>
          </motion.div>

          {/* Col 3 — "About us" label top + large photo bottom */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-col justify-between h-full"
          >
            <p
              className="font-serif font-light text-[#080808] tracking-tight text-right"
              style={{ fontSize: "clamp(28px, 2.8vw, 46px)" }}
            >
              About us
            </p>
            <Image
              src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&q=80"
              alt="Indian wedding decor"
              width={240}
              height={300}
              className="w-full h-[300px] object-cover rounded-[14px] mt-6"
            />
          </motion.div>

        </div>

        {/* Mobile: stacked layout */}
        <div className="lg:hidden">
          <div className="flex items-start justify-between mb-6">
            <p
              className="font-sans font-bold uppercase text-[#c8a96e]"
              style={{ fontSize: "10px", letterSpacing: "0.35em", marginTop: "8px" }}
            >
              OUR STORY
            </p>
            <p
              className="font-serif font-light text-[#080808] tracking-tight"
              style={{ fontSize: "28px" }}
            >
              About us
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <h2
              className="font-serif font-light text-[#080808] leading-[1.25] tracking-tight"
              style={{ fontSize: "clamp(24px, 6vw, 36px)" }}
            >
              <span className="font-bold">Evenzi</span> is more than planning —
              it&apos;s every ceremony, every guest, every memory.
            </h2>

            <div className="mt-6 space-y-4">
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.85]" style={{ fontSize: "14px" }}>
                Here, families come together across cities and traditions. Some plan months ahead,
                others days before. All of them deserve a platform that keeps pace with the joy.
              </p>
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.85]" style={{ fontSize: "14px" }}>
                We built Evenzi for the Indian host — the one coordinating over WhatsApp,
                tracking RSVPs in a spreadsheet, and somehow holding everything together.
              </p>
              <p className="text-[rgba(8,8,8,0.6)] leading-[1.85]" style={{ fontSize: "14px" }}>
                Our mission: bring every part of your celebration into one place, so you can be
                fully present for the moments that matter most.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <Image
                src="https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=400&q=80"
                alt="Indian wedding ceremony"
                width={160}
                height={200}
                className="flex-1 h-[200px] object-cover rounded-[12px]"
              />
              <Image
                src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&q=80"
                alt="Indian wedding decor"
                width={160}
                height={200}
                className="flex-1 h-[200px] object-cover rounded-[12px]"
              />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
