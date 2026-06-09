"use client";

import { HeroGeometric } from "@/components/ui/hero-geometric";
import { TextScrollAnimation } from "@/components/ui/text-scroll-animation";
import IntroAnimation from "@/components/ui/scroll-morph-hero";
import { PageFooter } from "@/components/layout/PageFooter";

function Nav() {
  const handleSignup = () => {
    window.location.href = "/auth";
  };

  return (
    <nav style={{ borderBottom: "1px solid #eeeeee", background: "#ffffff" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#BB0020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#ffffff",
                fontFamily: "var(--font-manrope), sans-serif",
              }}
            >
              E
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: "18px",
              fontWeight: 800,
              color: "#1a1a1a",
            }}
          >
            Evenzi
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
          >
            Features
          </a>
          <a
            href="#about"
            style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
          >
            About
          </a>
          <button
            onClick={handleSignup}
            style={{
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#BB0020",
              background: "transparent",
              border: "1.5px solid #BB0020",
              borderRadius: "9999px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-manrope), sans-serif",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <Nav />
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
      <PageFooter />
    </div>
  );
}
