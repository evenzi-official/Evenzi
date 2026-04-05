## Feature: Invitations

## Status

* Version: v0.1
* State: evolving

---

## Goal

Allow event hosts to manage guest invitations and track RSVP.

---

## Current Scope

* Add guest manually
* Track RSVP status (pending / accepted / rejected)

---

## Future Scope

* Email invitations
* Bulk upload (CSV)
* Guest categories (VIP, family, etc.)
* +1 handling

---

## Database (Supabase)

Table: invitations

* id (uuid)
* event_id (uuid)
* guest_name (text)
* status (text)
* created_at (timestamp)

---

## API Routes

* POST /api/invitations → add guest
* GET /api/invitations → list guests

---

## Business Rules

* Each invitation is tied to an event
* Default status = "pending"

---

## Flexibility Guidelines

* Status should be extendable (don’t hardcode enums)
* Allow adding more guest attributes later
* Avoid rigid validation

---

## Change Log

### v0.1

* Basic guest + RSVP tracking
