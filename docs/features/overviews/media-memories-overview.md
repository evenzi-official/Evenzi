# Evenzi Media & Memories (Photo Gallery) — Team Overview

**Status:** Not started. Design in Google Stitch.
**Priority:** P2
**Owner:** Abhijith (product), Dheeraj (engineering)
**Created:** 2026-04-16

---

## 1. What it is in one line

A photo gallery built into every Evenzi event — hosts upload and organize wedding photos into albums, and guests browse them directly on the public event website.

---

## 2. Why we're building it

Every wedding generates hundreds of photos, and right now those photos live scattered across WhatsApp groups, phone galleries, and Google Drive folders that no one can find a year later. Evenzi gives couples one place to collect, organize, and share their memories — tied directly to their event, not a separate app.

For guests, being able to relive the day through a curated gallery on the event website turns a static event page into something worth revisiting. It extends the life of the event well beyond the RSVP stage.

For the platform, photo galleries are a high-engagement feature that keeps both hosts and guests coming back after the event is over — increasing long-term retention and the perceived value of a subscription.

---

## 3. Who it serves

| Audience | What they do here | Supported in MVP? |
|---|---|---|
| **Event hosts** | Upload photos, create albums, manage the gallery | Yes |
| **Guests** | Browse the event photo gallery on the public website | Yes (view only) |
| **Guests** | Upload their own photos to the event | No — post-MVP |

---

## 4. What users experience

### Host experience

A host navigating to the Media & Memories section of their event sees a clean gallery dashboard with three areas: a Recent Uploads strip showing the latest additions, an Albums grid showing named collections, and a bulk-upload area at the top.

Uploading is simple: drag photos from a folder onto the upload zone, or click to open a file picker and select multiple files at once. Standard phone photo formats are accepted (JPG, PNG, HEIC). Photos upload in the background while the host continues working.

After uploading, the host can assign photos to albums — "Ceremony," "Reception," "Mehendi," "Candids," "Pre-Wedding," or any custom name they choose. The gallery grid shows photos in a clean layout with a lightbox viewer: clicking any photo opens it full-size with previous/next navigation, so the host can review the collection without leaving the page. Individual photos can be deleted at any time.

### Guest experience

Guests visiting the public event website see a photo gallery section automatically populated with whatever the host has uploaded. They can browse the full grid, click into albums by name, and open any photo in the lightbox viewer. No account or login is needed to view the gallery.

---

## 5. MVP scope

### In scope

| Capability | Notes |
|---|---|
| Multi-file upload | Drag-and-drop or file picker, multiple files at once |
| Album creation and organization | Host creates named albums; photos assigned after upload |
| Gallery grid view | Clean photo grid layout on both host dashboard and public website |
| Lightbox viewer | Click any photo to open full-size, prev/next navigation |
| Recent uploads section | Quick view of the latest additions |
| Photo deletion | Host can delete any photo |
| Guest view (public website) | Read-only gallery visible to anyone with the event URL |

### Out of scope (post-MVP)

| Capability | Reason deferred |
|---|---|
| Guest photo upload | Requires moderation logic and storage management per guest; complex for MVP |
| Video upload | File size, transcoding, and playback complexity; separate effort |
| AI face detection / AI Photo Finder | Significant ML infrastructure; planned as a future premium feature |
| Shared photo links | Direct album share links — post-MVP |
| Watermarking | Branding/copyright feature — post-MVP |
| Print ordering | Third-party fulfillment integration — post-MVP |

---

## 6. How it works (non-technical)

Photos are stored in a secure cloud file system (Supabase Storage) connected to Evenzi's database. When a host uploads a photo, it gets saved to a private folder tied to their event. The gallery page on the event website pulls photos from that folder and displays them.

Albums are just labels — a photo can be tagged with an album name, and the gallery filters by that tag. Nothing is stored in duplicate.

The public event website has read access to the gallery but cannot add or delete anything — only the host can do that from their dashboard.

---

## 7. Design reference

Design for this feature is in the Google Stitch project. The Stitch screens show:

- **Photo Albums grid** — named album cards with cover photo and photo count
- **Videos section** — visible in Stitch design (video upload is post-MVP; the section will either be hidden in MVP or shown as "coming soon")
- **Recent Uploads area** — horizontal strip of the most recently added photos

Stitch project: `https://stitch.withgoogle.com/projects/3859360114226566614`

---

## 8. Timeline

| Phase | Status |
|---|---|
| Design (Google Stitch) | Done |
| Spec & Architecture | Not started |
| Data Modeling | Not started |
| Frontend Development | Not started |
| Backend Development | Not started |
| QA | Not started |
| Integration with Digital Presence | Not started |

This feature is in the **Backlog** — it will be scheduled after P0 sprint work (Reusable Component Library, Event CRUD Wizard, Host Dashboard) is complete.

---

## 9. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Scope decisions, approval gates, priority |
| Lead Engineer | Dheeraj | Architecture, backend, infrastructure |
| AI Dev Support | Claude Code | Frontend implementation, component development |

---

## 10. Dependencies

| Dependency | Why it matters |
|---|---|
| **Reusable Component Library** | Gallery grid, lightbox, and upload components will be built from the shared library |
| **Event CRUD Wizard** | The event must exist before photos can be uploaded to it |
| **Digital Presence (Event Website)** | The guest-facing gallery lives inside the public event website |
| **Supabase Storage** | File hosting infrastructure — must be configured with correct bucket policies |

---

## 11. Key documents

- Design: Google Stitch project (link above)
- Implementation plan: `docs/superpowers/plans/` (to be created when sprint begins)
- Component Library spec: `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`

---

## 12. FAQ

**Can guests upload their own photos?**
Not in MVP. Guest photo upload is a planned post-MVP feature. In the first version, only the host can upload. We're building in the right foundation so guest upload can be added without a rearchitecture.

**What file formats are supported?**
JPG, PNG, and HEIC — the three standard formats that come off any iPhone or Android camera. We're not supporting PDFs, RAW files, or non-photo formats.

**Is there a storage limit per event?**
Storage limits will be tied to subscription tier — the exact limits are to be decided as part of pricing. Free tier will have a cap; paid tiers will have higher or unlimited storage.

**Can I delete individual photos?**
Yes. The host has full control — any photo can be deleted individually from the gallery dashboard. There is no bulk delete in MVP.

**Will photos appear on our event website automatically?**
Yes. Any photo uploaded by the host is automatically visible in the gallery section of the public event website. There's no separate publish step.

**Can I organize photos into albums before uploading?**
Not quite — albums are assigned after upload. The host uploads photos first, then moves them into albums from the gallery view. Pre-upload organization (like folder-based upload) is not in MVP scope.

**What happens to photos if I cancel my subscription?**
Subscription and data retention policies are still being decided. Photos will not be deleted without notice — there will be a grace period and data export option. Final policy will be documented before launch.
