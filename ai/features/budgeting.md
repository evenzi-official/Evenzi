## Feature: Budgeting

## Status

* Version: v0.1
* State: evolving

---

## Goal

Help users track expenses for each event.

---

## Current Scope

* Add expense
* View expenses list

---

## Future Scope

* Budget limits
* Category-wise summaries
* Visual analytics
* Vendor tracking

---

## Database (Supabase)

Table: expenses

* id (uuid)
* event_id (uuid)
* category (text)
* amount (numeric)
* notes (text)
* created_at (timestamp)

---

## API Routes

* POST /api/expenses → add expense
* GET /api/expenses → list expenses

---

## Business Rules

* Each expense belongs to an event
* Amount must be positive

---

## Flexibility Guidelines

* Categories should not be fixed
* Allow adding metadata later (vendor, tags)
* Avoid strict schema constraints early

---

## Change Log

### v0.1

* Basic expense tracking
