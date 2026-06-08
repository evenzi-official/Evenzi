"use client";

import { motion } from "framer-motion";
import IntroAnimation from "@/components/ui/scroll-morph-hero"; // kept for reuse
import { HeroGeometric } from "@/components/ui/hero-geometric";
import { TextScrollAnimation } from "@/components/ui/text-scroll-animation";

// ── Shared animation preset ──────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.75, ease: "easeOut" },
};

const stagger = (i: number) => ({
  ...fadeUp,
  transition: { duration: 0.6, ease: "easeOut", delay: i * 0.08 },
});

// ── Nav ──────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-[52px] py-7">
      <a
        className="font-serif font-normal text-xl tracking-[6px] text-[#080808] no-underline"
        href="#"
      >
        EVENZI
      </a>
      <ul className="hidden md:flex gap-10 list-none">
        <li>
          <a
            href="#problem"
            className="text-[10px] tracking-[3px] uppercase text-[rgba(8,8,8,0.5)] no-underline hover:text-[#080808] transition-colors"
          >
            Why Evenzi
          </a>
        </li>
        <li>
          <a
            href="#features"
            className="text-[10px] tracking-[3px] uppercase text-[rgba(8,8,8,0.5)] no-underline hover:text-[#080808] transition-colors"
          >
            Platform
          </a>
        </li>
        <li>
          <a
            href="#market"
            className="text-[10px] tracking-[3px] uppercase text-[rgba(8,8,8,0.5)] no-underline hover:text-[#080808] transition-colors"
          >
            Market
          </a>
        </li>
      </ul>
      <a
        className="text-[10px] tracking-[3px] uppercase text-[#FAFAFA] bg-[#FAFAFA] px-[26px] py-[11px] no-underline transition-colors hover:bg-[#c8a96e]"
        href="#"
      >
        Get Early Access
      </a>
    </nav>
  );
}

// ── Problem Section ───────────────────────────────────────
function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative min-h-screen bg-[#FAFAFA] flex flex-col justify-start px-[52px] pt-[120px] pb-0 overflow-hidden"
    >
      <div>
        <motion.div
          className="h-px bg-[rgba(8,8,8,0.1)] mb-9 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
        />
        <motion.div
          {...fadeUp}
          className="text-[10px] tracking-[5px] uppercase text-[#c8a96e] flex items-center gap-[14px] mb-[18px] before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e] before:flex-shrink-0"
        >
          The problem
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
          className="font-serif font-light text-[clamp(44px,7vw,108px)] leading-[0.95] tracking-tight text-[#080808]"
        >
          WhatsApp.
          <br />
          Spreadsheets.
          <br />
          <em className="italic text-[#c8a96e]">Chaos.</em>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.3 }}
          className="mt-7 max-w-[460px] text-[13px] font-light text-[rgba(8,8,8,0.5)] leading-[1.85]"
        >
          Planning a wedding in India is genuinely hard — hundreds of guests,
          complex family dynamics, budgets in the lakhs. Yet the tools hosts
          reach for were never designed for this moment. Things fall through the
          cracks.
        </motion.p>

        {/* Stats */}
        <div className="flex mt-11 border-t border-[rgba(8,8,8,0.1)]">
          {[
            { num: "10M+", label: "Weddings per year in India" },
            { num: "₹4L Cr", label: "Annual industry spend" },
            { num: "Zero", label: "End-to-end platforms for Indian hosts" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              {...stagger(i)}
              className="flex-1 pt-6 pr-7 border-r border-[rgba(8,8,8,0.1)] last:border-r-0 last:pr-0"
            >
              <div className="font-serif font-light text-[clamp(28px,4vw,52px)] leading-none text-[#080808]">
                {stat.num}
              </div>
              <div className="mt-1.5 text-[10px] tracking-[2px] uppercase text-[rgba(8,8,8,0.5)]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div
        className="absolute right-11 bottom-9 font-serif font-light text-[clamp(120px,18vw,240px)] leading-none tracking-[-6px] text-[rgba(8,8,8,0.04)] pointer-events-none select-none"
        aria-hidden="true"
      >
        02
      </div>
    </section>
  );
}

// ── Solution Section ──────────────────────────────────────
function SolutionSection() {
  return (
    <section
      id="solution"
      className="relative min-h-screen bg-[#FAFAFA] flex flex-col justify-start px-[52px] pt-[120px] overflow-hidden"
    >
      <div>
        <motion.div
          className="h-px bg-[rgba(8,8,8,0.1)] mb-9 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
        />
        <motion.div
          {...fadeUp}
          className="text-[10px] tracking-[5px] uppercase text-[#c8a96e] flex items-center gap-[14px] mb-[18px] before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e] before:flex-shrink-0"
        >
          Our answer
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
          className="font-serif font-light text-[clamp(44px,7vw,108px)] leading-[0.95] tracking-tight text-[#080808]"
        >
          One workspace.
          <br />
          Every <em className="italic text-[#c8a96e]">celebration.</em>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.3 }}
          className="mt-7 max-w-[460px] text-[13px] font-light text-[rgba(8,8,8,0.5)] leading-[1.85]"
        >
          Evenzi is a single beautifully designed platform — create your event,
          build your guest list, send WhatsApp invitations, track RSVPs, manage
          budget, share photos, and publish an event website. Everything in one
          place, from &ldquo;we&apos;re getting married&rdquo; to the last
          memory uploaded.
        </motion.p>
      </div>

      <div
        className="absolute right-11 bottom-9 font-serif font-light text-[clamp(120px,18vw,240px)] leading-none tracking-[-6px] text-[rgba(8,8,8,0.04)] pointer-events-none select-none"
        aria-hidden="true"
      >
        03
      </div>
    </section>
  );
}

// ── Features Section ──────────────────────────────────────
const FEATURES = [
  { n: "01", title: "Guest Management", desc: "Add guests, track RSVPs, segment by group. Replace the spreadsheet." },
  { n: "02", title: "Digital Invitations", desc: "Beautiful invitations via WhatsApp with delivery tracking." },
  { n: "03", title: "Budget Tracker", desc: "Manage expenses and vendor payments in real time." },
  { n: "04", title: "Event Website", desc: "A public page for venue, schedule, directions, and RSVP." },
  { n: "05", title: "Photo Gallery", desc: "Every memory from every guest, in one curated place." },
  { n: "06", title: "Event Magazine", desc: "A printed photo book keepsake delivered to your door." },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-[#FAFAFA] flex flex-col items-center py-[140px] px-6 overflow-hidden"
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        className="text-center mb-20"
      >
        <p className="font-sans text-[11px] tracking-[5px] uppercase text-[#c8a96e] flex items-center justify-center gap-[14px] mb-5 before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e]">
          The platform
        </p>
        <h2 className="font-serif font-light text-[clamp(32px,4.5vw,60px)] leading-[1.05] tracking-tight text-[#080808]">
          Everything your{" "}
          <em className="italic text-[#c8a96e]">celebration</em> needs
        </h2>
      </motion.div>

      {/* Feature grid */}
      <div className="w-full max-w-4xl grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.n}
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.25, 0.4, 0.25, 1], delay: i * 0.07 }}
            className="flex flex-col items-center text-center px-8 py-10 border-b border-[rgba(8,8,8,0.07)] [&:nth-child(-n+3)]:border-t [&:not(:nth-child(3n))]:border-r border-[rgba(8,8,8,0.07)]"
          >
            <div className="font-sans text-[9px] tracking-[3px] text-[#c8a96e] mb-4">{f.n}</div>
            <div className="font-serif font-normal text-[clamp(17px,1.8vw,22px)] text-[#080808] mb-3 leading-tight">{f.title}</div>
            <p className="text-[12px] font-light text-[rgba(8,8,8,0.45)] leading-[1.75]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Market Section ────────────────────────────────────────
function MarketSection() {
  return (
    <section
      id="market"
      className="relative min-h-screen bg-[#FAFAFA] flex flex-col justify-start px-[52px] pt-[120px] overflow-hidden"
    >
      <div>
        <motion.div
          className="h-px bg-[rgba(8,8,8,0.1)] mb-9 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
        />
        <motion.div
          {...fadeUp}
          className="text-[10px] tracking-[5px] uppercase text-[#c8a96e] flex items-center gap-[14px] mb-[18px] before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e] before:flex-shrink-0"
        >
          The opportunity
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
          className="font-serif font-light text-[clamp(44px,7vw,108px)] leading-[0.95] tracking-tight text-[#080808]"
        >
          Shape India&apos;s
          <br />
          celebrations
          <br />
          with <em className="italic text-[#c8a96e]">purpose.</em>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.3 }}
          className="mt-7 max-w-[460px] text-[13px] font-light text-[rgba(8,8,8,0.5)] leading-[1.85]"
        >
          ₹4 lakh crore in annual spend. 10 million weddings a year. UPI,
          WhatsApp, and smartphones now ubiquitous across every city. The
          infrastructure is ready. No one owns the host&apos;s end-to-end
          workflow. That gap is ours.
        </motion.p>
      </div>

      <div
        className="absolute right-11 bottom-9 font-serif font-light text-[clamp(120px,18vw,240px)] leading-none tracking-[-6px] text-[rgba(8,8,8,0.04)] pointer-events-none select-none"
        aria-hidden="true"
      >
        05
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────
function CTASection() {
  return (
    <section
      id="cta"
      className="relative min-h-screen bg-[#FAFAFA] flex flex-col justify-start px-[52px] pt-[120px] overflow-hidden"
    >
      <div>
        <motion.div
          className="h-px bg-[rgba(8,8,8,0.1)] mb-9 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
        />
        <motion.div
          {...fadeUp}
          className="text-[10px] tracking-[5px] uppercase text-[#c8a96e] flex items-center gap-[14px] mb-[18px] before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e] before:flex-shrink-0"
        >
          Get started
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
          className="font-serif font-light text-[clamp(44px,7vw,108px)] leading-[0.95] tracking-tight text-[#080808]"
        >
          Start planning
          <br />
          your <em className="italic text-[#c8a96e]">celebration.</em>
        </motion.h2>
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
        >
          <a
            className="inline-block mt-10 px-11 py-[15px] bg-[#080808] text-[#FAFAFA] text-[11px] tracking-[4px] uppercase font-medium transition-colors hover:bg-[#c8a96e] no-underline"
            href="#"
          >
            Get Early Access
          </a>
          <p className="mt-3.5 text-[11px] text-[rgba(8,8,8,0.5)] tracking-[1px]">
            Free to start · No credit card required
          </p>
        </motion.div>
      </div>

      <div
        className="absolute right-11 bottom-9 font-serif font-light text-[clamp(120px,18vw,240px)] leading-none tracking-[-6px] text-[rgba(8,8,8,0.04)] pointer-events-none select-none"
        aria-hidden="true"
      >
        06
      </div>
    </section>
  );
}

// ── Footer Section ────────────────────────────────────────
function FooterSection() {
  return (
    <footer
      id="footer"
      className="relative bg-[#FAFAFA] flex flex-col justify-end px-[52px] pb-14 pt-20 border-t border-[rgba(8,8,8,0.1)]"
    >
      <motion.div
        {...fadeUp}
        className="flex justify-between items-end w-full max-md:flex-col max-md:gap-5"
      >
        <div
          className="font-serif font-light text-[clamp(48px,7vw,88px)] tracking-[8px] text-[rgba(8,8,8,0.06)] leading-none"
          aria-hidden="true"
        >
          EVENZI
        </div>
        <div className="text-right max-md:text-left">
          <div className="flex gap-7 mb-4 justify-end max-md:justify-start">
            {["Product", "About", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[10px] tracking-[2px] uppercase text-[rgba(8,8,8,0.5)] no-underline hover:text-[#080808] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-[10px] tracking-[4px] uppercase text-[#c8a96e] mb-2">
            India&apos;s celebration platform
          </div>
          <div className="text-[10px] tracking-[1px] text-[rgba(8,8,8,0.5)]">
            © 2026 Evenzi · Built by Abhijith &amp; Dheeraj
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-[#FAFAFA]">
      <Nav />

      {/* Hero */}
      <HeroGeometric
        titleClassName="text-[clamp(32px,5vw,68px)] leading-[1.1]"
        titleNode={
          <>
            <span className="block bg-clip-text text-transparent bg-gradient-to-b from-[#080808] to-[#080808]/80">
              We build the
            </span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-b from-[#080808]/90 to-[#080808]/60">
              future of Indian
            </span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-[#080808]/80 to-rose-400">
              celebrations
            </span>
          </>
        }
        description="From the first guest to the last photo — Evenzi brings every detail of your celebration together in one beautiful workspace."
      />

      <TextScrollAnimation />
      <IntroAnimation />
    </main>
  );
}
