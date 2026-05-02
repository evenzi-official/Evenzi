"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventListItem } from "@/lib/types/events";

interface Props {
  events: EventListItem[];
  userDisplay: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  sparkles: "✨", palette: "🎨", music: "🎵", heart: "💍",
  utensils: "🍽️", wine: "🍷", coffee: "☕", leaf: "🌿",
  paintbrush: "🖌️", toast: "🥂", camera: "📸", flower: "🌸",
  fire: "🔥", star: "⭐", cake: "🎂", gem: "💎",
  briefcase: "💼", baby: "👶", calendar: "📅",
};

function resolveEmoji(iconName: string | null | undefined): string {
  if (!iconName) return "🎉";
  return ICON_MAP[iconName] ?? "🎉";
}

function getDaysToEvent(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBD";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusLabel(dateStr: string | null): string {
  const days = getDaysToEvent(dateStr);
  if (days === null) return "ACTIVE PLANNING";
  if (days < 0) return "COMPLETED";
  if (days <= 30) return "FINAL PREPARATIONS";
  if (days <= 90) return "ACTIVE PLANNING";
  return "EARLY PLANNING";
}

function getEventBg(slug: string): string {
  switch (slug) {
    case "wedding": return "linear-gradient(160deg, #f4a9a8 0%, #d97070 100%)";
    case "birthday": return "linear-gradient(160deg, #ffd89b 0%, #ff9a8b 100%)";
    case "corporate": return "linear-gradient(160deg, #667eea 0%, #764ba2 100%)";
    case "anniversary": return "linear-gradient(160deg, #f093fb 0%, #f5576c 100%)";
    default: return "linear-gradient(160deg, #a8edea 0%, #66a6ff 100%)";
  }
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function BellIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GearIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PersonIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PinIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PeopleIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MonitorIcon(): React.JSX.Element {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

function AvatarCircle({ letter, color, overlap, dark }: { letter: string; color: string; overlap?: boolean; dark?: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        background: color,
        border: `2px solid ${dark ? "#1a2035" : "#ffffff"}`,
        marginLeft: overlap ? "-9px" : 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
        color: "#ffffff",
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
      }}
    >
      {letter}
    </div>
  );
}

// ── Featured Event Card ───────────────────────────────────────────────────────

function FeaturedEventCard({ event }: { event: EventListItem }): React.JSX.Element {
  const days = getDaysToEvent(event.primaryDate);
  const status = getStatusLabel(event.primaryDate);
  const bg = getEventBg(event.eventType.slug);
  const emoji = resolveEmoji(event.eventType.iconName);

  const daysLabel =
    days === null ? "DATE TBD"
    : days > 0 ? `${days} DAYS TO GO`
    : days === 0 ? "TODAY!"
    : "PAST EVENT";

  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        minHeight: "520px",
      }}
    >
      {/* Left: image area */}
      <div
        className="lg:w-[38%]"
        style={{
          position: "relative",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "220px",
        }}
      >
        {/* FEATURED badge */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "#BB0020",
            borderRadius: "9999px",
            padding: "5px 14px",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.1em" }}>
            FEATURED
          </span>
        </div>

        {/* Large emoji */}
        <div aria-hidden="true" style={{ fontSize: "100px", opacity: 0.72, lineHeight: 1 }}>
          {emoji}
        </div>

        {/* Days-to-go badge */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(255,255,255,0.96)",
            borderRadius: "9999px",
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <span style={{ color: "#BB0020" }}><ClockIcon /></span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.06em" }}>
            {daysLabel}
          </span>
        </div>
      </div>

      {/* Right: details */}
      <div
        style={{
          flex: 1,
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
        }}
      >
        {/* Status + Owner tags */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: "9999px",
              padding: "5px 12px",
            }}
          >
            {status}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#BB0020",
              border: "1.5px solid #BB0020",
              borderRadius: "9999px",
              padding: "5px 12px",
            }}
          >
            OWNER
          </span>
        </div>

        {/* Event type */}
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#BB0020",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          {event.eventType.name}
        </p>

        {/* Event title */}
        <h2
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: "clamp(26px, 2.8vw, 40px)",
            fontWeight: 800,
            color: "#1a1a1a",
            lineHeight: "1.1",
            margin: "0 0 24px",
          }}
        >
          {event.name ?? "Untitled Event"}
        </h2>

        {/* Detail rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <span style={{ color: "#9ca3af", marginTop: "1px", flexShrink: 0 }}><PinIcon /></span>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", margin: "0 0 2px" }}>Venue</p>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                {event.primaryVenue?.trim() || "Venue TBD"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <span style={{ color: "#9ca3af", marginTop: "1px", flexShrink: 0 }}><CalIcon /></span>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", margin: "0 0 2px" }}>Date</p>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                {formatDate(event.primaryDate)}
              </p>
            </div>
          </div>

          {event.guestCapacity !== null && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <span style={{ color: "#9ca3af", marginTop: "1px", flexShrink: 0 }}><PeopleIcon /></span>
              <div>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", margin: "0 0 2px" }}>Guest Count</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                  {event.guestCapacity} Guests
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Avatar stack */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <AvatarCircle letter="A" color="#3b82f6" />
          <AvatarCircle letter="B" color="#10b981" overlap />
          <AvatarCircle letter="C" color="#f59e0b" overlap />
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#f0f0f0",
              border: "2px solid #ffffff",
              marginLeft: "-9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 700,
              color: "#6b7280",
              flexShrink: 0,
            }}
          >
            +12
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href={`/events/${event.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#BB0020",
              background: "transparent",
              border: "2px solid #BB0020",
              borderRadius: "9999px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            LIVE WEBSITE
          </Link>
          <Link
            href={`/events/${event.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#ffffff",
              background: "#BB0020",
              border: "none",
              borderRadius: "9999px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            MANAGE EVENT
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Light Sidebar Card ────────────────────────────────────────────────────────

function LightSidebarCard({ event }: { event: EventListItem }): React.JSX.Element {
  const emoji = resolveEmoji(event.eventType.iconName);
  const bg = getEventBg(event.eventType.slug);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #f0f0f0",
        borderRadius: "16px",
        padding: "18px 20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Top row: status + thumbnail */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#BB0020", flexShrink: 0 }} />
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase" }}>
            UPCOMING
          </span>
        </div>
        {/* Event type thumbnail */}
        <div
          aria-hidden="true"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "12px",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-manrope), sans-serif",
          fontSize: "20px",
          fontWeight: 700,
          color: "#1a1a1a",
          margin: "0 0 6px",
          lineHeight: "1.2",
        }}
      >
        {event.name ?? "Untitled Event"}
      </h3>

      {/* Subtitle */}
      <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 14px", lineHeight: "1.5" }}>
        {event.eventType.name.toUpperCase()}
        {event.guestCapacity !== null ? ` · ${event.guestCapacity} Guests` : ""}
      </p>

      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "#f5f5f5",
          borderRadius: "9999px",
          padding: "5px 12px",
        }}
      >
        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "#6b7280" }}>
          OWNER
        </span>
      </div>
    </div>
  );
}

// ── Dark Sidebar Card ─────────────────────────────────────────────────────────

function DarkSidebarCard({ event }: { event: EventListItem }): React.JSX.Element {
  const nameWords = (event.name ?? "EV").split(" ");
  const initials = nameWords.slice(0, 2).map((w) => (w[0] ?? "?").toUpperCase());

  return (
    <div
      style={{
        background: "#192133",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase" }}>
          ACTIVE PLANNING
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-manrope), sans-serif",
          fontSize: "20px",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0 0 8px",
          lineHeight: "1.2",
        }}
      >
        {event.name ?? "Untitled Event"}
      </h3>

      {/* Subtitle */}
      <p style={{ fontSize: "11px", fontWeight: 600, color: "#BB0020", margin: "0 0 18px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {event.guestCapacity !== null
          ? `GUESTS: ${event.guestCapacity} ATTENDEES`
          : event.eventType.name.toUpperCase()}
      </p>

      {/* Bottom row: avatars + link */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {initials.map((letter, i) => (
            <AvatarCircle key={i} letter={letter} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} overlap={i > 0} dark />
          ))}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#BB0020",
              border: "2px solid #192133",
              marginLeft: "-9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 700,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            +4
          </div>
        </div>
        <Link
          href={`/events/${event.id}`}
          style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
        >
          VIEW DETAILS →
        </Link>
      </div>
    </div>
  );
}

// ── New Project Card ──────────────────────────────────────────────────────────

function NewProjectCard(): React.JSX.Element {
  return (
    <Link
      href="/events/create"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: "36px 20px",
        background: "rgba(187,0,32,0.04)",
        border: "2px dashed rgba(187,0,32,0.22)",
        borderRadius: "16px",
        textDecoration: "none",
        cursor: "pointer",
        minHeight: "160px",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#BB0020",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(187,0,32,0.3)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#BB0020", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
          NEW PROJECT
        </p>
        <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" }}>
          Ready to host another unforgettable event?
        </p>
      </div>
    </Link>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState(): React.JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
      <h2
        style={{
          fontFamily: "var(--font-manrope), sans-serif",
          fontSize: "28px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "10px",
        }}
      >
        No events yet
      </h2>
      <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "36px", maxWidth: "360px", lineHeight: "1.6" }}>
        Start planning your perfect celebration.
      </p>
      <div style={{ width: "300px" }}>
        <NewProjectCard />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EventsGrid({ events, userDisplay: _userDisplay }: Props): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"my-events" | "collaborations">("my-events");
  const [activeFilter, setActiveFilter] = useState<"active" | "past">("active");

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>

      {/* ── NAV ── */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #eeeeee",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: brand */}
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
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-manrope), sans-serif" }}>
                E
              </span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: "16px", fontWeight: 800, color: "#1a1a1a", margin: 0, lineHeight: 1 }}>
                Evenzi
              </p>
              <p style={{ fontSize: "9px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", margin: "3px 0 0", lineHeight: 1, textTransform: "uppercase" }}>
                Host Dashboard
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/events/create"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                background: "#BB0020",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                borderRadius: "9999px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              + CREATE EVENT
            </Link>

            {/* Bell */}
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "6px", position: "relative", display: "flex" }}
            >
              <BellIcon />
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#BB0020",
                  border: "1.5px solid #ffffff",
                }}
              />
            </button>

            {/* Gear */}
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "6px", display: "flex" }}
            >
              <GearIcon />
            </button>

            {/* Person / sign out */}
            <button
              type="button"
              onClick={() => { void handleSignOut(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "6px", display: "flex" }}
              title="Sign out"
            >
              <PersonIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "48px 24px 64px" }}>

        {/* Heading row */}
        <div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          style={{ marginBottom: "36px" }}
        >
          {/* Left */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: "#BB0020", textTransform: "uppercase", margin: "0 0 6px" }}>
              WELCOME BACK
            </p>
            <h1
              style={{
                fontFamily: "var(--font-manrope), sans-serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                color: "#1a1a1a",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Your Events
            </h1>
          </div>

          {/* Right: tab groups */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* MY EVENTS | COLLABORATIONS */}
            <div
              style={{
                display: "flex",
                background: "#efefef",
                borderRadius: "9999px",
                padding: "4px",
                gap: "2px",
              }}
            >
              {(["my-events", "collaborations"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    transition: "all 0.15s",
                    background: activeTab === tab ? "#BB0020" : "transparent",
                    color: activeTab === tab ? "#ffffff" : "#6b7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab === "my-events" ? "MY EVENTS" : "COLLABORATIONS"}
                </button>
              ))}
            </div>

            {/* ACTIVE | PAST */}
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setActiveFilter("active")}
                style={{
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  border: activeFilter === "active" ? "2px solid #BB0020" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  background: "transparent",
                  color: activeFilter === "active" ? "#BB0020" : "#9ca3af",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                ACTIVE
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("past")}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  background: "transparent",
                  color: activeFilter === "past" ? "#1a1a1a" : "#9ca3af",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                PAST
              </button>
            </div>
          </div>
        </div>

        {/* Content grid */}
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            <FeaturedEventCard event={events[0]} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {events.length > 1 && <LightSidebarCard event={events[1]} />}
              {events.length > 2 && <DarkSidebarCard event={events[2]} />}
              <NewProjectCard />
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #eeeeee", background: "#ffffff", padding: "20px 24px" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#BB0020",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>E</span>
            </div>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
              © 2026 Evenzi. All rights reserved.
            </p>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {(["PRIVACY POLICY", "TERMS", "HELP CENTER"] as const).map((label) => (
              <a
                key={label}
                href="#"
                style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "#9ca3af", textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>

      {/* ── FLOATING SUPPORT BUTTON ── */}
      <button
        type="button"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#BB0020",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(187,0,32,0.35)",
          zIndex: 50,
        }}
        title="Help"
      >
        <MonitorIcon />
      </button>
    </div>
  );
}
