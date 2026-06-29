"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { HeroGeometric } from "@/components/ui/hero-geometric";

const FlyCanvas = dynamic(
  () => import("@/app/website-theme-framer/components/FlyCanvas"),
  { ssr: false }
);
import { TextScrollAnimation } from "@/components/ui/text-scroll-animation";
import IntroAnimation from "@/components/ui/scroll-morph-hero";
import { PageFooter } from "@/components/layout/PageFooter";

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignup = () => {
    window.location.href = "/auth";
  };

  return (
    <nav style={{ borderBottom: "1px solid #eeeeee", background: "#ffffff" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">

        {/* Logo — hidden on mobile when drawer is open */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", visibility: menuOpen ? "hidden" : "visible" }}>
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

        {/* Desktop nav links */}
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

        {/* Hamburger button — mobile only */}
        <button
          className="md:hidden flex flex-col items-center justify-center gap-[5px]"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {menuOpen ? (
            /* X icon */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <line x1="3" y1="3" x2="19" y2="19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
              <line x1="19" y1="3" x2="3" y2="19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <line x1="3" y1="6" x2="19" y2="6" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="11" x2="19" y2="11" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="16" x2="19" y2="16" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile right-side drawer */}
      {menuOpen && (
        <>
          {/* Scrim */}
          <div
            className="md:hidden"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 40,
            }}
          />
          {/* Drawer panel */}
          <div
            className="md:hidden"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "72%",
              maxWidth: "300px",
              background: "#ffffff",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px 32px",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
            }}
          >
            {/* Drawer header: logo + close */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#BB0020", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-manrope), sans-serif" }}>E</span>
                </div>
                <span style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>Evenzi</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <line x1="3" y1="3" x2="19" y2="19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="3" x2="3" y2="19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: "15px", color: "#374151", textDecoration: "none", fontWeight: 500 }}
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: "15px", color: "#374151", textDecoration: "none", fontWeight: 500 }}
              >
                About
              </a>
              <button
                onClick={() => { setMenuOpen(false); handleSignup(); }}
                style={{
                  alignSelf: "flex-start",
                  marginTop: "4px",
                  padding: "9px 24px",
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
        </>
      )}
    </nav>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      <FlyCanvas sizeVw={0.307} />
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
