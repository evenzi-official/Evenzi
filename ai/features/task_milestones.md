## Feature: Tasks & Milestones

## Status

* Version: v0.1
* State: evolving

---

## Goal

Allow users to manage tasks and track progress for events.

---

## Current Scope

* Create tasks
* Mark tasks as complete

---

## Future Scope

* Task assignment (multiple users)
* Deadlines
* Notifications
* Task dependencies

---

## Database (Supabase)

Table: tasks

* id (uuid)
* event_id (uuid)
* title (text)
* status (text)
* created_at (timestamp)

---

## API Routes

* POST /api/tasks → create task
* GET /api/tasks → list tasks
* PUT /api/tasks/[id] → update status

---

## Business Rules

* Tasks belong to an event
* Default status = "pending"

---

## Flexibility Guidelines

* Status should be extendable
* Allow future assignment fields
* Keep schema simple initially

---

## Change Log

### v0.1

* Basic task tracking
