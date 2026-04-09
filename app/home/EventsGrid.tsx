"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventListItem } from "@/lib/types/events";

interface Props {
  events: EventListItem[];
  userDisplay: string;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Date not set";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Date not set";
  }
}

function EventCard({ event }: { event: EventListItem }) {
  const isIncomplete = !event.primaryDate || !event.primaryVenue;

  // Gradient backgrounds keyed by event type slug
  const gradients: Record<string, string> = {
    wedding: "linear-gradient(135deg, #f5a7c7 0%, #c084fc 100%)",
    birthday: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
    corporate: "linear-gradient(135deg, #60a5fa 0%, #6366f1 100%)",
    anniversary: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
  };
  const gradient =
    gradients[event.eventType.slug] ??
    "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)";

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Card image / gradient placeholder */}
      <div
        className="h-40 flex items-center justify-center text-4xl"
        style={{ background: gradient }}
      >
        {event.eventType.iconName ?? "🎉"}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-base font-semibold leading-snug"
            style={{ color: "var(--color-text-primary)" }}
          >
            {event.name ?? "Untitled Event"}
          </h3>
          {isIncomplete && (
            <span
              className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "var(--color-error-bg)",
                color: "var(--color-error)",
              }}
            >
              Setup incomplete
            </span>
          )}
        </div>

        <p
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatDate(event.primaryDate)}
        </p>

        <p
          className="text-sm truncate"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {event.primaryVenue ?? "Venue not set"}
        </p>

        {event.subEventCount > 0 && (
          <p
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {event.subEventCount} sub-event
            {event.subEventCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function EventsGrid({ events, userDisplay }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Navigation */}
      <nav
        className="border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Evenzi
          </div>
          <div className="flex items-center gap-4">
            <span
              className="text-sm hidden sm:block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {userDisplay}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {events.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-24">
            <h1
              className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Welcome to Evenzi!
            </h1>
            <p
              className="text-xl mb-10 max-w-md"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Start planning your perfect event.
            </p>
            <Link
              href="/events/create"
              className="px-8 py-4 text-lg font-semibold text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              style={{ background: "var(--color-primary)" }}
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          /* Events grid */
          <>
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Your Events
                </h1>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Ready to plan your next special occasion?
                </p>
              </div>
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full shadow hover:shadow-md hover:scale-105 transition-all duration-200 whitespace-nowrap"
                style={{ background: "var(--color-primary)" }}
              >
                <span>+</span>
                <span>Create New Event</span>
              </Link>
            </div>

            {/* 3-column responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
