"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, MotionValue } from "framer-motion";

const IMG_WIDTH = 64;
const IMG_HEIGHT = 90;
const CIRCLE_RADIUS = 300;
const TOTAL_IMAGES = 20;

const PHASE_FEATURES_START = 0.35;
const TOTAL_SLIDE_ITEMS = 8;
const ITEM_RANGE = (1.0 - PHASE_FEATURES_START) / TOTAL_SLIDE_ITEMS;

const IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=300&q=80",
  "https://images.unsplash.com/photo-1525328437458-0c4d4db7cab4?w=300&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80",
  "https://images.unsplash.com/photo-1511795409834-432f7b1728b2?w=300&q=80",
  "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=300&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&q=80",
  "https://images.unsplash.com/photo-1490750967868-88df5691cc5a?w=300&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=80",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80",
  "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=300&q=80",
  "https://images.unsplash.com/photo-1567165438555-47e4e8f9c8f4?w=300&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&q=80",
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
              href="/auth"
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
