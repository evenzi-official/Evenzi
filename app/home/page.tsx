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
  event_guests: { count: number }[] | null;
}

function mapEventRow(row: EventListRow): EventListItem {
  return {
    id: row.id,
    name: row.name,
    eventType: { name: "Event", slug: "event", iconName: null },
    primaryDate: row.primary_date,
    primaryVenue: row.primary_venue,
    guestCapacity: row.guest_capacity,
    // Actual invited-guest count (PostgREST aggregate embed). "Expected"
    // capacity is a separate planning number — the card prefers this real
    // count and only falls back to capacity when no guests exist yet.
    guestCount: row.event_guests?.[0]?.count ?? 0,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    subEventCount: row.event_sub_events?.length ?? 0,
    createdAt: row.created_at,
  };
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
      event_sub_events ( id ),
      event_guests ( count )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    // Low (M-misc): don't silently swallow the fetch error — surface it so a
    // failed load renders an error state instead of looking like "no events".
    console.error("[home] failed to load events:", error);
  }

  const { data: collabRows, error: collabError } = await supabase
    .from("event_collaborators")
    .select(`
      event_id,
      events!inner(
        id, name, primary_date, primary_venue, guest_capacity,
        cover_image_url, status, created_at, deleted_at,
        event_sub_events ( id ),
        event_guests ( count )
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("events.deleted_at", null);

  if (collabError) {
    console.error("[home] failed to load collab events:", collabError);
  }

  const hasError = Boolean(error) || Boolean(collabError);
  const rows = (data ?? []) as unknown as EventListRow[];

  const events: EventListItem[] = rows.map(mapEventRow);

  type CollabJoinRow = {
    events: EventListRow | EventListRow[] | null;
  };
  const collabEvents: EventListItem[] = ((collabRows ?? []) as unknown as CollabJoinRow[])
    .map((row) => {
      const ev = Array.isArray(row.events) ? row.events[0] : row.events;
      return ev ? mapEventRow(ev) : null;
    })
    .filter((e): e is EventListItem => e !== null);

  // Pending collab invites for the Collaborations tab (DEFINER RPC; fails if
  // email is unconfirmed — treat as empty so the rest of home still loads).
  type PendingInviteRow = {
    id: string;
    event_id: string;
    event_name: string | null;
    role: string;
    invited_at: string;
    owner_display_name: string | null;
  };
  const { data: pendingRows, error: pendingError } = await supabase.rpc(
    "list_my_pending_invites"
  );
  if (pendingError) {
    console.error("[home] failed to load pending invites:", pendingError);
  }
  const pendingInvites = ((pendingRows ?? []) as PendingInviteRow[]).map(
    (row) => ({
      id: row.id,
      eventId: row.event_id,
      eventName: row.event_name ?? "Untitled Event",
      role: row.role,
      invitedAt: row.invited_at,
      ownerDisplayName: row.owner_display_name ?? "Host",
    })
  );

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
      collabEvents={collabEvents}
      pendingInvites={pendingInvites}
      userDisplay={userDisplay}
      avatarUrl={profile?.avatar_url ?? null}
      hasError={hasError}
    />
  );
}
