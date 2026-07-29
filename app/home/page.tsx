import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventListItem } from "@/lib/types/events";
import EventsGrid from "./EventsGrid";

// M7: always render fresh so a newly-created event appears on arrival,
// not after a manual refresh (defeats the Next.js router cache for /home).
export const dynamic = "force-dynamic";

interface EventListRow {
  id: string;
  name: string | null;
  primary_date: string | null;
  primary_venue: string | null;
  guest_capacity: number | null; 
  cover_image_url: string | null;
  status: string;
  created_at: string;
  event_sub_events: { id: string }[] | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data, error } = await supabase
    .from("events")
    .select(`
      id, name, primary_date, primary_venue, guest_capacity,
      cover_image_url, status, created_at,
      event_sub_events ( id )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    // Low (M-misc): don't silently swallow the fetch error — surface it so a
    // failed load renders an error state instead of looking like "no events".
    console.error("[home] failed to load events:", error);
  }

  const hasError = Boolean(error);
  const rows = (data ?? []) as unknown as EventListRow[];

  const events: EventListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    eventType: { name: "Event", slug: "event", iconName: null },
    primaryDate: row.primary_date,
    primaryVenue: row.primary_venue,
    guestCapacity: row.guest_capacity,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    subEventCount: row.event_sub_events?.length ?? 0,
    createdAt: row.created_at,
  }));

  // The name the host set in Settings wins, so editing it there actually shows
  // up here. Falls back to the email local-part / phone only when it isn't set.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single()

  // `||` not `??` on purpose: Supabase returns "" (not null) for an unset
  // email/phone, which `??` would happily pass through as a blank greeting.
  const fallback = user.email?.trim() || user.phone?.trim() || "User"
  const fallbackDisplay = fallback.includes("@")
    ? (fallback.split("@")[0] || fallback)
    : fallback
  const userDisplay = profile?.display_name?.trim() || fallbackDisplay

  return (
    <EventsGrid
      events={events}
      userDisplay={userDisplay}
      avatarUrl={profile?.avatar_url ?? null}
      hasError={hasError}
    />
  );
}
