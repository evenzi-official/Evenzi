"use client";

import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const handleSignup = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>

      {/* Navigation */}
      <nav style={{ borderBottom: "1px solid #eeeeee", background: "#ffffff" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">

          {/* Logo — matches /home nav */}
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

      {/* Hero */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-5xl mx-auto text-center">

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: "1.08",
              marginBottom: "24px",
            }}
          >
            The Smartest Way to Plan &amp; Share{" "}
            <span style={{ color: "#BB0020" }}>Your Celebration.</span>
          </h1>

          {/* Sub-headline */}
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "#6b7280",
              lineHeight: "1.65",
              marginBottom: "48px",
              maxWidth: "560px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Smart Invites, Beautiful Event Websites, and AI-Powered Experiences — all in one place.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleSignup}
              style={{
                padding: "16px 40px",
                background: "#BB0020",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-manrope), sans-serif",
                letterSpacing: "0.04em",
                boxShadow: "0 4px 20px rgba(187,0,32,0.25)",
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              Create Free Event
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="w-full sm:w-auto flex-1 sm:flex-initial max-w-md">
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find an Event..."
                  style={{
                    width: "100%",
                    padding: "16px 52px 16px 24px",
                    fontSize: "14px",
                    color: "#1a1a1a",
                    background: "#ffffff",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "9999px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#BB0020"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
                />
                <button
                  type="submit"
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                  aria-label="Search"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Feature cards */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">

            {/* Smart Invites */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "32px 28px",
                border: "1.5px solid #f0f0f0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(187,0,32,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#BB0020" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "10px",
                }}
              >
                Smart Invites
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.65", margin: 0 }}>
                Send beautiful, personalized invitations via WhatsApp that your guests will love.
              </p>
            </div>

            {/* Event Websites */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "32px 28px",
                border: "1.5px solid #f0f0f0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(187,0,32,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#BB0020" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "10px",
                }}
              >
                AI Photo Finder
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.65", margin: 0 }}>
                Let AI help you find and organize all your event photos effortlessly.
              </p>
            </div>

            {/* Zero-Cost */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "32px 28px",
                border: "1.5px solid #f0f0f0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(187,0,32,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#BB0020" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "10px",
                }}
              >
                Zero-Cost
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.65", margin: 0 }}>
                Create stunning event websites and manage celebrations completely free.
              </p>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
