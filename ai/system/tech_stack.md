## Core Architecture

* Fullstack: Next.js (Frontend + Backend APIs)
* Modular feature-based architecture

---

## Frontend

* Framework: Next.js (App Router)
* Styling: Tailwind CSS
* State Management: React Context / Zustand (if needed)

---

## Backend

* Next.js API Routes (Server-side logic)
* RESTful API design
* Server actions where applicable

---

## Database

* Supabase (PostgreSQL)

### Responsibilities:

* Store structured data (users, events, invites, expenses)
* Handle relationships (event ↔ users ↔ features)

---

## Authentication

* Supabase Auth

### Features:

* Email/password login
* OAuth (Google, etc.)
* Session management

---

## Storage

* Cloudflare R2

### Use Cases:

* Event images
* User uploads
* Media assets

---

## Deployment

* Vercel

### Responsibilities:

* Hosting frontend & backend (Next.js)
* Serverless API execution

---

## API Design

* REST-based APIs
* JSON responses
* Proper status codes

---

## Data Design Principles

* Normalize relational data
* Use foreign keys for relationships
* Avoid redundant data

---

## Security

* Use Supabase row-level security (RLS)
* Validate all API inputs
* Protect storage access

---

## Scalability Considerations

* Feature-based modular design
* Independent services per feature
* Optimized queries (PostgreSQL indexing)

---

## Evenzi-Specific Architecture

* Multi-event system (one user → multiple events)
* Feature toggles per event
* Role-based access (host, organizer, guest)

---

## Future Enhancements

* Background jobs (queues if needed)
* Webhooks for integrations
* Caching layer (Redis if scaling)
