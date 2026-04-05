## Feature: User Roles & Permissions

## Status

* Version: v0.1
* State: evolving

---

## Goal

Control access to events and features.

---

## Current Scope

* Event owner (full control)

---

## Future Scope

* Roles (admin, organizer, guest)
* Permissions per feature
* Role-based UI

---

## Database (Supabase)

Table: event_members

* id (uuid)
* event_id (uuid)
* user_id (uuid)
* role (text)

---

## API Routes

* POST /api/event-members → add member
* GET /api/event-members → list members

---

## Business Rules

* Each event has at least one owner
* Users can belong to multiple events

---

## Flexibility Guidelines

* Roles should not be hardcoded
* Allow adding permissions later
* Keep access logic modular

---

## Change Log

### v0.1

* Owner-based access only
