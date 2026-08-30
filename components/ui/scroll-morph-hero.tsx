"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, MotionValue } from "framer-motion";
import { getAppBaseUrl } from "@/lib/url";

const APP_AUTH_URL = `${getAppBaseUrl()}/auth`;

const IMG_WIDTH = 64;
const IMG_HEIGHT = 90;
const CIRCLE_RADIUS = 300;
const TOTAL_IMAGES = 20;

const PHASE_FEATURES_START = 0.35;
const TOTAL_SLIDE_ITEMS = 8;
const ITEM_RANGE = (1.0 - PHASE_FEATURES_START) / TOTAL_SLIDE_ITEMS;

const IMAGES = [
  // Indian wedding ceremony
  "https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=300&q=80",
  "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=300&q=80",
  "https://images.unsplash.com/photo-1587271315307-eaebc181c749?w=300&q=80",
  "https://images.unsplash.com/photo-1587271339318-2e78fdf79586?w=300&q=80",
  "https://images.unsplash.com/photo-1601121868898-4581104b29de?w=300&q=80",
  "https://images.unsplash.com/photo-1633104502699-b2ecf0fee294?w=300&q=80",
  "https://images.unsplash.com/photo-1680491024206-7321f775d538?w=300&q=80",
  // Indian wedding decor
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=300&q=80",
  "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=300&q=80",
  "https://images.unsplash.com/photo-1591203281954-23fa2ff8ef18?w=300&q=80",
  "https://images.unsplash.com/photo-1744805624954-a6686543c3ff?w=300&q=80",
  "https://images.unsplash.com/photo-1729237261107-6fc4279f6d1c?w=300&q=80",
  "https://images.unsplash.com/photo-1680491026542-a99730a0e235?w=300&q=80",
  // Haldi ceremony
  "https://images.unsplash.com/photo-1670774837214-21b88943a6bb?w=300&q=80",
  "https://images.unsplash.com/photo-1670774544351-96d2464fd873?w=300&q=80",
  "https://images.unsplash.com/photo-1681717166573-f71589207785?w=300&q=80",
  "https://images.unsplash.com/photo-1697347816275-83728d258959?w=300&q=80",
  "https://images.unsplash.com/photo-1634693343333-9b6013c30d57?w=300&q=80",
  "https://images.unsplash.com/photo-1671339911465-7e8c3944a762?w=300&q=80",
  "https://images.unsplash.com/photo-1671339911501-622930e159ee?w=300&q=80",
];

const FEATURES = [
  { n: "01", title: "Guest Management", desc: "Add guests, track RSVPs, segment by group. Replace the spreadsheet." },
  { n: "02", title: "Digital Invitations", desc: "Beautiful invitations via WhatsApp with delivery tracking." },
  { n: "03", title: "Budget Tracker", desc: "Manage expenses and vendor payments in real time." },
  { n: "04", title: "Event Website", desc: "A public page for venue, schedule, directions, and RSVP." },
  { n: "05", title: "Photo Gallery", desc: "Every memory from every guest, in one curated place." },
  { n: "06", title: "Event Magazine", desc: "A printed photo book keepsake delivered to your door." },
];

interface CircleImageProps {
  src: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

function CircleImage({ src, index, total, scrollYProgress }: CircleImageProps) {
  const angle = (index / total) * 2 * Math.PI;
  const targetX = Math.cos(angle) * CIRCLE_RADIUS;
  const targetY = Math.sin(angle) * CIRCLE_RADIUS;
  const rotation = (angle * 180) / Math.PI + 90;

  const rawX = useTransform(scrollYProgress, [0.07, 0.22], [0, targetX]);
  const rawY = useTransform(scrollYProgress, [0.07, 0.22], [0, targetY]);
  const opacity = useTransform(scrollYProgress, [0.06, 0.18], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.07, 0.20], [0.3, 1]);

  const x = useSpring(rawX, { stiffness: 60, damping: 18 });
  const y = useSpring(rawY, { stiffness: 60, damping: 18 });

  return (
    <motion.div
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        left: "50%",
        top: "50%",
        marginLeft: -IMG_WIDTH / 2,
        marginTop: -IMG_HEIGHT / 2,
        x,
        y,
        opacity,
        scale,
        rotate: rotation,
      }}
    >
      <div className="w-full h-full overflow-hidden rounded-xl shadow-lg">
        <img src={src} alt={`celebration-${index}`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </motion.div>
  );
}

interface FeatureSlideProps {
  itemIndex: number;
  scrollYProgress: MotionValue<number>;
  children: React.ReactNode;
}

function FeatureSlide({ itemIndex, scrollYProgress, children }: FeatureSlideProps) {
  const start = PHASE_FEATURES_START + itemIndex * ITEM_RANGE;
  const isLast = itemIndex === TOTAL_SLIDE_ITEMS - 1;
  const fadeInEnd = start + ITEM_RANGE * 0.3;
  const stayEnd = start + ITEM_RANGE * 0.7;
  const end = start + ITEM_RANGE;

  const inputRange = isLast
    ? [start, fadeInEnd]
    : [start, fadeInEnd, stayEnd, end];

  const opacity = useTransform(
    scrollYProgress,
    inputRange,
    isLast ? [0, 1] : [0, 1, 1, 0]
  );
  const scale = useTransform(
    scrollYProgress,
    inputRange,
    isLast ? [0.82, 1] : [0.82, 1, 1, 1.08]
  );

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-6"
    >
      {children}
    </motion.div>
  );
}

export default function IntroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Single combined motion value: 0→1→1→0 across the scroll range
  const phase1Opacity = useTransform(
    scrollYProgress,
    [0, 0.07, 0.18, 0.28],
    [0, 1, 1, 0]
  );
  const phase1Y = useTransform(scrollYProgress, [0.00, 0.07], [30, 0]);
  const phase1Scale = useTransform(scrollYProgress, [0.18, 0.28], [1, 0.85]);

  // Unmount Phase 1 text once it's fully transparent — eliminates bleed-through
  const [showPhase1, setShowPhase1] = useState(true);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setShowPhase1(latest < 0.30);
  });

  const circleExitScale = useTransform(scrollYProgress, [0.27, 0.40], [1, 3]);
  const circleExitOpacity = useTransform(scrollYProgress, [0.28, 0.40], [1, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[700vh]">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-[#FAFAFA] overflow-hidden">

        {showPhase1 && (
          <motion.div
            style={{ opacity: phase1Opacity, scale: phase1Scale, y: phase1Y }}
            className="absolute z-10 flex flex-col items-center text-center pointer-events-none px-8"
          >
            <h2 className="font-serif font-light text-[clamp(22px,3.5vw,48px)] text-[#080808] leading-[1.3] tracking-tight">
              <span className="block">One workspace.</span>
              <span className="block italic text-[#c8a96e]">Every celebration.</span>
            </h2>
          </motion.div>
        )}

        <motion.div
          style={{ scale: circleExitScale, opacity: circleExitOpacity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => (
            <CircleImage
              key={i}
              src={src}
              index={i}
              total={TOTAL_IMAGES}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </motion.div>

        <FeatureSlide itemIndex={0} scrollYProgress={scrollYProgress}>
          <h2 className="font-serif font-light text-[clamp(28px,4vw,56px)] text-[#080808] tracking-tight text-center leading-[1.1]">
            Everything your{" "}
            <em className="italic text-[#c8a96e]">celebration</em> needs
          </h2>
        </FeatureSlide>

        {FEATURES.map((f, i) => (
          <FeatureSlide key={f.n} itemIndex={i + 1} scrollYProgress={scrollYProgress}>
            <div className="flex flex-col items-center text-center max-w-sm">
              <div className="font-sans text-[10px] tracking-[4px] text-[#c8a96e] mb-6">{f.n}</div>
              <div className="font-serif font-light text-[clamp(28px,3.5vw,48px)] text-[#080808] mb-5 leading-tight tracking-tight whitespace-nowrap">
                {f.title}
              </div>
              <p className="text-[14px] font-light text-[rgba(8,8,8,0.45)] leading-[1.85] whitespace-nowrap">
                {f.desc}
              </p>
            </div>
          </FeatureSlide>
        ))}

        <FeatureSlide itemIndex={7} scrollYProgress={scrollYProgress}>
          <div className="flex flex-col items-center text-center">
            <h2 className="font-serif font-light text-[clamp(32px,4vw,56px)] text-[#080808] leading-[1.15] tracking-tight mb-8">
              Start planning<br />your celebration.
            </h2>
            <a
              href={APP_AUTH_URL}
              className="pointer-events-auto inline-flex items-center px-8 py-3.5 rounded-full bg-[#080808] text-[#f0ebe0] text-[13px] font-sans tracking-[0.12em] uppercase hover:bg-[#c8a96e] transition-colors duration-300 mb-4"
            >
              Get Early Access
            </a>
            <p className="text-[11px] font-light text-[rgba(8,8,8,0.35)] tracking-wide">
              Free to start · No credit card required
            </p>
          </div>
        </FeatureSlide>

      </div>
    </div>
  );
}
