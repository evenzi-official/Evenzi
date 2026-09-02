"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AnimatedList } from "@/components/ui/animated-list";
import { getAppBaseUrl } from "@/lib/url";

const APP_AUTH_URL = `${getAppBaseUrl()}/auth`;

interface WaItem {
  guest: string;
  event: string;
  status: string;
  icon: string;
  color: string;
  time: string;
}

const WA_ITEMS: WaItem[] = [
  { guest: "Rahul & Family", event: "Wedding · Dec 14", status: "Invitation sent", icon: "💌", color: "#075E54", time: "10:42 AM" },
  { guest: "Priya Mehta", event: "Wedding · Dec 14", status: "RSVP: Attending ✓", icon: "✅", color: "#00C9A7", time: "10:43 AM" },
  { guest: "Anjali Sharma", event: "Sangeet · Dec 13", status: "Invitation sent", icon: "💌", color: "#075E54", time: "10:44 AM" },
  { guest: "Vikram Nair", event: "Wedding · Dec 14", status: "RSVP: Attending ✓", icon: "✅", color: "#00C9A7", time: "10:45 AM" },
  { guest: "Deepa Iyer", event: "Haldi · Dec 12", status: "Invitation sent", icon: "💌", color: "#075E54", time: "10:46 AM" },
  { guest: "Sunita Rao", event: "Wedding · Dec 14", status: "RSVP: Not attending", icon: "❌", color: "#FF3D71", time: "10:47 AM" },
];

const FEED = Array.from({ length: 4 }, () => WA_ITEMS).flat();

function WaCard({ guest, event, status, icon, color, time }: WaItem) {
  return (
    <figure
      className={cn(
        "relative mx-auto w-full max-w-[340px] cursor-default overflow-hidden rounded-2xl px-4 py-3",
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.04),0_2px_6px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)]",
        "transition-all duration-200 ease-in-out hover:scale-[102%]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: color + "20" }}
        >
          <span style={{ fontSize: "18px" }}>{icon}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 whitespace-pre">
            <span className="text-[13px] font-semibold text-[#080808] truncate">{guest}</span>
            <span className="text-[#9ca3af] text-[11px]">·</span>
            <span className="text-[11px] text-[#9ca3af]">{time}</span>
          </div>
          <p className="text-[12px] text-[#6b7280] truncate">{event}</p>
          <p className="text-[12px] font-medium mt-0.5" style={{ color }}>{status}</p>
        </div>
      </div>
    </figure>
  );
}

function WhatsAppMockup() {
  return (
    <div className="w-full max-w-[360px] mx-auto select-none rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(8,8,8,0.14)]">
      {/* WhatsApp header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
          <span className="text-white font-bold" style={{ fontSize: "13px" }}>E</span>
        </div>
        <div>
          <p className="text-white font-semibold leading-none" style={{ fontSize: "14px" }}>Evenzi</p>
          <p className="text-white/60 mt-0.5" style={{ fontSize: "11px" }}>142 guests · 3 RSVPs today</p>
        </div>
      </div>

      {/* Animated feed */}
      <div className="bg-[#ECE5DD] px-3 py-3 h-[280px] overflow-hidden">
        <AnimatedList delay={1800}>
          {FEED.map((item, i) => (
            <WaCard key={i} {...item} />
          ))}
        </AnimatedList>
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
            href={APP_AUTH_URL}
            className="mt-8 inline-flex items-center gap-1.5 text-[#BB0020] font-semibold hover:underline transition-all"
            style={{ fontSize: "13px" }}
          >
            Try it free →
          </Link>
        </motion.div>

        {/* Right — phone mockup with bee behind */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex justify-center relative"
        >
          {/* Bee mascot — sits behind the mockup card */}
          <div
            className="absolute pointer-events-none z-10"
            style={{ top: "38%", left: "55%", transform: "translate(-50%, -50%)" }}
          >
            <Image
              src="/flw-1.gif"
              alt="Evenzi bee"
              width={200}
              height={200}
              unoptimized
            />
          </div>

          {/* Mockup — on top of the bee */}
          <div className="relative z-20 w-full">
            <WhatsAppMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
