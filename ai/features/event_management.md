## Feature: Event Management

## Status

* Version: v0.1
* State: evolving

---

## Goal

Allow users to create and manage multiple events.

---

## Current Scope

* Create event
* Update event details
* View events list

---

## Future Scope

* Event templates
* Public event pages
* Event duplication

---

## Database (Supabase)

Table: events

* id (uuid)
* user_id (uuid)
* name (text)
* date (timestamp)
* location (text)
* created_at (timestamp)

---

## API Routes (Next.js)

* POST /api/events → create event
* GET /api/events → list user events
* PUT /api/events/[id] → update event

---

## Business Rules

* One user can have multiple events
* Each event belongs to a single owner (initially)

---

## Flexibility Guidelines

* Allow optional fields (location, date)
* Keep schema extendable for future fields
* Avoid strict validation early

---

## Change Log

### v0.1

* Basic event creation and listing
