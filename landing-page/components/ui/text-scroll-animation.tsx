"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: any;
  className?: string;
};

const CharacterV1 = ({ char, index, centerIndex, scrollYProgress, className }: CharacterProps) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.4], [0, 0.6, 1]);

  return (
    <motion.span
      className={cn("inline-block", isSpace && "w-4", className)}
      style={{ x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
};


const TextScrollAnimation = () => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  const labelOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const labelY = useTransform(scrollYProgress, [0, 0.15], [30, 0]);
  const bodyOpacity = useTransform(scrollYProgress, [0.38, 0.55], [0, 1]);
  const bodyY = useTransform(scrollYProgress, [0.38, 0.55], [32, 0]);

  const problemWords = [
    { text: "WhatsApp.", size: "text-[clamp(22px,3vw,44px)]", color: "text-[rgba(8,8,8,0.2)]" },
    { text: "Spreadsheets.", size: "text-[clamp(30px,4.5vw,64px)]", color: "text-[rgba(8,8,8,0.42)]" },
    { text: "Chaos.", size: "text-[clamp(48px,7.5vw,108px)]", color: "text-[#c8a96e] italic" },
  ];


  return (
    <ReactLenis root>
      <div className="w-full bg-[#FAFAFA]">

        {/* Block 1 — problem headline */}
        <div
          ref={targetRef}
          className="relative box-border flex h-[150vh] flex-col items-center justify-center gap-16 overflow-hidden bg-[#FAFAFA] p-[2vw]"
        >
          {/* label */}
          <motion.p
            style={{ opacity: labelOpacity, y: labelY }}
            className="font-sans text-[18px] tracking-[5px] uppercase text-[#c8a96e] flex items-center gap-[14px] before:content-[''] before:w-7 before:h-px before:bg-[#c8a96e]"
          >
            The problem
          </motion.p>

          {/* animated headline — three stacked words */}
          <div className="flex flex-col items-center gap-1" style={{ perspective: "800px" }}>
            {problemWords.map(({ text, size, color }) => {
              const chars = text.split("");
              const ci = Math.floor(chars.length / 2);
              return (
                <div key={text} className={cn("w-full max-w-5xl text-center font-serif font-light tracking-tight leading-none", size)}>
                  {chars.map((char, index) => (
                    <CharacterV1
                      key={index}
                      char={char}
                      index={index}
                      centerIndex={ci}
                      scrollYProgress={scrollYProgress}
                      className={color}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* body + stats */}
          <motion.div
            style={{ opacity: bodyOpacity, y: bodyY }}
            className="w-full max-w-3xl flex flex-col items-center gap-10 px-4"
          >
            <p className="text-center text-[15px] font-light text-[rgba(8,8,8,0.5)] leading-[1.9]">
              Planning a wedding in India is genuinely hard — hundreds of guests,
              complex family dynamics, budgets in the lakhs. Yet the tools hosts
              reach for were never designed for this moment. Things fall through the cracks.
            </p>

            <div className="w-full h-px bg-[rgba(8,8,8,0.08)]" />

            <div className="w-full grid grid-cols-3">
              {[
                { num: "10M+", label: "Weddings per year in India" },
                { num: "₹4L Cr", label: "Annual industry spend" },
                { num: "Zero", label: "End-to-end platforms for Indian hosts" },
              ].map((stat, i) => (
                <div key={stat.label} className={`flex flex-col items-center text-center px-6 ${i < 2 ? "border-r border-[rgba(8,8,8,0.08)]" : ""}`}>
                  <div className="font-serif font-light text-[clamp(28px,3.5vw,52px)] leading-none text-[#080808]">
                    {stat.num}
                  </div>
                  <div className="mt-3 text-[10px] tracking-[2px] uppercase text-[rgba(8,8,8,0.4)] leading-[1.7]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </ReactLenis>
  );
};

export { CharacterV1, TextScrollAnimation };

