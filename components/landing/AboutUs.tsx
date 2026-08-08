"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUs() {
  return (
    <section id="about" className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-12 lg:gap-16 items-start">
        {/* Left — brand mark + eyebrow */}
        <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4">
          <Image
            src="/brand/mark-dark.png"
            alt="Evenzi"
            width={48}
            height={48}
            className="rounded-xl shrink-0"
          />
          <p
            className="font-sans font-bold uppercase text-[#c8a96e]"
            style={{ fontSize: "10px", letterSpacing: "0.35em" }}
          >
            OUR STORY
          </p>
        </div>

        {/* Right — copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2
            className="font-serif font-light text-[#080808] tracking-tight leading-[1.2]"
            style={{ fontSize: "clamp(24px, 3vw, 42px)" }}
          >
            We're building what Indian celebrations deserve.
          </h2>
          <p
            className="text-[rgba(8,8,8,0.6)] leading-[1.9] mt-6"
            style={{ fontSize: "15px" }}
          >
            Planning a wedding in India is one of the most joyful — and complex
            — things a family can do. Hundreds of guests, multiple ceremonies,
            budgets in the lakhs, WhatsApp chaos. The tools that exist were
            never built for this moment.
          </p>
          <p
            className="text-[rgba(8,8,8,0.6)] leading-[1.9] mt-4"
            style={{ fontSize: "15px" }}
          >
            We're a small team building the platform this moment has always
            deserved. One workspace. Every celebration. Start to finish.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
