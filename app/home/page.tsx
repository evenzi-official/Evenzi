import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventListItem } from "@/lib/types/events";
import EventsGrid from "./EventsGrid";

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

  const { data } = await supabase
    .from("events")
    .select(`
      id, name, primary_date, primary_venue, guest_capacity,
      cover_image_url, status, created_at,
      event_sub_events ( id )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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

  const raw = user.email ?? user.phone ?? "User"
  const userDisplay = raw.includes("@") ? (raw.split("@")[0] ?? raw) : raw

  return <EventsGrid events={events} userDisplay={userDisplay} />;
}
