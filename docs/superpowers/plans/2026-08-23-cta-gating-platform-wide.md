# Build Doc — Platform-wide "disable CTA until required fields are filled"

**Owner:** Cursor (auto mode, free NVIDIA model). Mechanical multi-file normalization from this Claude-authored spec.
**Review gate:** returns to Claude for a diff review before merge.
**Branch:** create `feature/cta-required-gating` off `Dev-Vibe`.
**Date:** 2026-08-23. Author: Claude (Abhijith session).

---

## 1. Objective and context

Across Evenzi's forms, the primary submit / CTA button is gated inconsistently:

- Some buttons are `disabled` only while saving (`disabled={saving}`), so they are clickable while the form is empty and only fail on submit.
- Some rely on the HTML `required` attribute, which blocks native submit but leaves the button visually enabled and gives no affordance until a click.
- A few already gate correctly on validity (e.g. `disabled={!addTypeName.trim() || addTypeSaving}` in `PlanningClient.tsx`).

**Goal:** every primary submit/CTA that writes data must be `disabled` when any required field is empty or invalid, **and** while a save is in flight. Establish one consistent pattern and apply it everywhere.

This is UX-only. Do not change API contracts, validation rules on the server, or data shapes. The server-side validation stays as the source of truth; this is a client-side affordance so the button reflects whether a submit can succeed.

## 2. The pattern to apply

For each form, derive a single boolean `canSubmit` from the required fields, then gate the button on it plus the in-flight flag:

```tsx
const canSubmit = name.trim().length > 0 && phone.trim().length > 0
// ...
<button type="submit" className="btn-pill btn-pill-primary" disabled={!canSubmit || saving} aria-busy={saving}>
  Save
</button>
```

Rules:

1. **Required = what the server rejects an empty value for.** Read each form's existing submit handler / server route to see which fields are mandatory. Do not invent new required fields, and do not make optional fields required.
2. **Trim before checking** text inputs (`value.trim().length > 0`) so whitespace-only does not count as filled.
3. **Validate format only where the form already does it** (e.g. TicketForm already checks the email regex — fold that same check into `canSubmit`; do not add new format rules elsewhere).
4. **Keep the existing `disabled={saving}` behaviour** — the new condition is `disabled={!canSubmit || saving}`, never replacing the in-flight guard.
5. **Add `aria-busy={saving}`** where it is not already present, for the loading state.
6. **Do not remove the HTML `required` attributes** — they stay as a second line of defence.
7. **Disabled styling already exists** in `shell.css` for `.btn-pill[disabled]`. Do not add new CSS. If a specific button has no disabled affordance, verify against `designs/shared/shell.css` first and only extend via an existing modifier — do not fork styles.

## 3. Files in scope (verify required fields per form by reading its submit handler)

Primary write-forms — confirm the required set in code, then gate:

| File | Likely required fields (verify) |
|---|---|
| `app/events/[id]/guests/GuestFormModal.tsx` | name, phone |
| `app/events/[id]/guests/TagManagerModal.tsx` | tag name (for the create action) |
| `app/events/[id]/guests/ImportCsvModal.tsx` | a parsed/selected file before the confirm CTA |
| `app/events/[id]/planning/PlanningClient.tsx` | task label; budget amount; expense amount (three separate forms — gate each) |
| `app/events/[id]/media/MediaClient.tsx` | album name (create-album action) |
| `app/events/[id]/settings/GeneralSettingsForm.tsx` | whatever it rejects empty (e.g. event name) |
| `app/events/[id]/settings/registry/RegistryContent.tsx` | verify per add/save action |
| `app/events/[id]/settings/website/WebsiteContent.tsx` | verify per save action |
| `app/events/[id]/settings/admins/AdminsContent.tsx` | invite email/phone before "invite" CTA |
| `app/events/[id]/website/edit/[pageId]/StoryEditor.tsx` | verify |
| `app/events/[id]/website/edit/[pageId]/QAEditor.tsx` | question + answer per add |
| `app/events/[id]/website/edit/[pageId]/TravelEditor.tsx` | verify per add (e.g. stay name) |
| `app/events/[id]/website/edit/[pageId]/WeddingPartyEditor.tsx` | verify per add (e.g. member name) |
| `app/events/[id]/website/edit/[pageId]/SectionEditor.tsx` | verify |
| `app/events/[id]/website/design/CoverOgSection.tsx` | verify |
| `app/events/[id]/website/ShareSiteDialog.tsx` | verify (only if it has a required input) |
| `app/settings/ProfileSection.tsx` | display name (save-profile CTA) |
| `components/help/TicketForm.tsx` | email (valid format) + message |
| `app/e/[slug]/GuestLookupForm.tsx` | name, phone (public) |
| `app/e/[slug]/PasswordGate.tsx` | password (public) |

Notes:
- The **create-event wizard** (`app/events/create/components/Step1..Step4`) already has step gating; audit each step's Next/Create button for the same rule and only tighten where a required field is currently ungated. Do not regress existing step validation.
- Skip pure filter/search/toggle controls and destructive-confirm dialogs (those are handled by `ConfirmDialog` and are not data-entry forms).

## 4. Definition of done

- [ ] Every file above: primary write CTA is `disabled={!canSubmit || saving}` with a correctly-derived `canSubmit`.
- [ ] No required field was invented; no optional field became required. Cross-checked against each submit handler / server route.
- [ ] Existing in-flight (`saving`) guards preserved; `aria-busy` present on async CTAs.
- [ ] HTML `required` attributes left intact.
- [ ] No new CSS; disabled affordance uses existing `shell.css` styles.
- [ ] `npx tsc --noEmit` clean.
- [ ] Manual check on 3 representative forms (GuestFormModal, TicketForm, a website editor): CTA is disabled on empty, enables when required fields are filled, disables again while saving.
- [ ] Diff handed back to Claude for review before merge to `Dev-Vibe`.

## 5. Out of scope

- Server-side validation changes.
- New format/validation rules beyond what each form already enforces.
- Restyling buttons or the disabled state.
- The create-event wizard's existing multi-step logic (only tighten ungated required fields, do not rework).

### Files to LEAVE UNTOUCHED (owned by a concurrent build — do not edit, avoids merge conflicts)

A separate branch (`feature/our-journey-rebuild`, build-doc `2026-08-23-our-journey-1to1-rebuild.md`) is running in parallel and owns these. Do NOT edit them here — they already implement CTA gating themselves:

- `app/events/[id]/journey/**` (the Our Journey rebuild)
- `app/events/create/components/Step3Modals.tsx` and `app/events/create/components/SubEventCard.tsx` (the sub-event add/edit modal — the parallel build may extract/reuse it)

Drop these from the §3 table if present. Everything else in §3 is fair game.
