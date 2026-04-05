## Core Principles

* Modular architecture
* Feature-based structure
* Loose coupling
* High cohesion

## Architecture Style

* Fullstack Next.js architecture
* API routes act as backend layer
* Supabase acts as DB + Auth provider

## Layers

* UI Layer (Next.js pages/components)
* API Layer (Next.js API routes / server actions)
* Data Layer (Supabase PostgreSQL)

## Backend Pattern (Updated)

* API Route → Service Logic → Supabase Client

## Frontend Pattern

* App Router → Components → Hooks/Services

## Feature Design

Each feature must be:

* Independent
* Replaceable
* Scalable

## Evenzi Specific

* Multi-event support
* Feature toggles per event
* Role-based access control
