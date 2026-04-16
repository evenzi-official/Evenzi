# Evenzi Auth & Role Selection — Team Overview

**Status:** Complete (March–April 2026)
**Owner:** Abhijith (product), Dheeraj (engineering)
**Completed:** April 2026
**Created:** 2026-04-16

---

## 1. What it is in one line

The front door to Evenzi — users create an account or log in using their phone number or Google, then pick whether they're a Host or a Vendor before reaching the app.

## 2. Why we're building it

Before any Evenzi feature is usable, users need a way to prove who they are and tell us what kind of user they are. Authentication is the foundation everything else builds on.

We chose phone OTP and Google OAuth specifically for the Indian market:

- **Phone OTP** is familiar and frictionless for Indian users. No need to create yet another username/password pair.
- **Google OAuth** covers users who prefer not to share their phone number, or who are signing up on a desktop.
- **No email/password** — we deliberately skipped this because it adds friction (password resets, weak password problems, forgotten credentials) without adding value when phone and Google are available.

Role selection matters because Hosts and Vendors will eventually have completely different experiences in Evenzi. Hosts plan events; Vendors service them. Capturing the role at signup means we can route users to the right dashboard immediately, and we never have to ask again.

## 3. Who it serves

| Audience | What they do here | Supported in MVP? |
|---|---|---|
| **New users — Hosts** | Sign up, verify phone or Google, select Host role, enter the app | Yes |
| **New users — Vendors** | Sign up, see "Vendor coming soon" message | Partial — role selection shows, but Vendor experience is deferred |
| **Returning users** | Log back in quickly (phone OTP or Google) | Yes |
| **Admins** | Authenticate with same flow (admin permissions are set in database) | Yes |

## 4. What users experience (step by step)

### Signing up for the first time

1. Visit Evenzi — landing page or direct link
2. Click "Get Started" or "Sign In"
3. Arrive at the Auth page — tabbed interface: **Sign Up** or **Log In**
4. **Path A — Phone OTP:**
   - Enter mobile number (India +91 prefix pre-filled)
   - Tap "Send OTP" — SMS arrives in seconds
   - Enter the 6-digit code
   - Account created and session started
5. **Path B — Google OAuth:**
   - Click "Continue with Google"
   - Standard Google sign-in popup/redirect
   - Approve permissions
   - Account created and session started
6. **First-time only — Role Selection page:**
   - Two cards: **Host** ("I'm planning an event") and **Vendor** ("I offer event services")
   - Vendor shows "Coming Soon" badge — tapping it shows a message explaining Vendor access is on the roadmap
   - Select Host → role saved → redirect to the Host Dashboard
7. You're in. Role is remembered — this screen never appears again.

### Logging back in

1. Visit Evenzi → Sign In
2. Enter phone number → receive OTP → verify, OR click "Continue with Google"
3. Land directly on the Host Dashboard (role already known)

### Protected routes

Any page that requires being logged in (dashboard, event management, etc.) will automatically redirect to `/auth` if the user has no active session. After logging in, they're sent back to where they were trying to go.

## 5. What admins can do

Authentication and role management happen at the database level. There is no admin UI for this feature yet.

- User accounts and sessions are visible in the Supabase dashboard
- Role can be corrected directly in the `user_profiles` table if needed (rare edge case)
- Supabase Auth handles password resets, session expiry, and provider management
- Rate limiting on OTP requests is managed through Supabase and Twilio

## 6. MVP scope — what's in vs what's out

### In for MVP

- Phone OTP sign up and log in (India +91)
- Google OAuth sign up and log in
- Role Selection page — Host and Vendor (Vendor as "coming soon")
- Session management — protected routes, automatic redirects
- `user_profiles` table storing role, display name, auth provider, phone/email
- Tabbed Auth UI with Sign Up and Log In flows
- 3 design variants (light, dark, gradient) — Google Stitch

### Out of scope

- Vendor role experience (deferred — shown as "coming soon" only)
- Email and password login
- Social login beyond Google (Facebook, Apple, etc.)
- Biometric authentication
- Ability to change role after signup
- Multi-account support
- Admin UI for user management
- Two-factor authentication beyond OTP

## 7. How it works (non-technical overview)

Evenzi uses **Supabase** for authentication — the same platform used by thousands of production apps worldwide. Think of Supabase as a trusted identity vault: it handles all the sensitive parts of authentication (securely storing credentials, managing sessions, talking to SMS providers) so we never store passwords ourselves.

```
User enters phone number
    ↓
Supabase sends OTP via Twilio (SMS provider)
    ↓
User enters 6-digit code
    ↓
Supabase verifies the code and issues a session token
    ↓
Browser stores the session securely
    ↓
Every page load: middleware checks the token → valid = access, invalid = redirect to /auth
    ↓
First visit only: Role Selection → role saved to user_profiles table
```

For Google OAuth, the flow is similar but Google handles the identity verification step instead of SMS.

## 8. Design

Three visual variants were designed in Google Stitch:
- **Light** — clean white background, ideal for daytime use
- **Dark** — elegant dark theme
- **Gradient** — celebration-forward, warm gradient background

The auth interface uses a tab component (Sign Up / Log In) so users always land on the right action without being on a separate page.

## 9. Timeline

| Phase | What happened | Status |
|---|---|---|
| **Design** | 3 variants designed in Google Stitch | Done |
| **Backend** | Supabase Auth setup, user_profiles table, middleware | Done |
| **Frontend** | Auth page, OTP flow, Google OAuth, Role Selection | Done |
| **QA** | Flows tested — sign up, log in, role selection, protected routes | Done |
| **Production** | Live on Dev-Vibe branch | Done — pending Vercel fix |

## 10. Who's involved

| Role | Person | What they own |
|---|---|---|
| **Product owner** | Abhijith | Scope decisions, role selection UX, approvals |
| **Engineering** | Dheeraj | Auth implementation, middleware, database |
| **Implementation support** | Claude Code | Code review, test support |

## 11. Key documents

| Document | Audience | Purpose |
|---|---|---|
| This overview (`docs/features/overviews/auth-overview.md`) | Everyone | High-level shareable reference |
| `app/auth/` | Engineering | Auth page source code |
| `lib/supabase/` | Engineering | Supabase client utilities (browser + server) |
| `middleware.ts` | Engineering | Session refresh and route protection logic |

## 12. FAQ

**Q: Can I sign up with email and password?**
A: No — Evenzi uses phone OTP and Google OAuth only. We made this decision deliberately: email/password adds friction (password resets, forgotten credentials) with no benefit when phone and Google are available to everyone.

**Q: What if I don't have an Indian (+91) phone number?**
A: Use "Continue with Google." Google OAuth has no phone number requirement and works from any country.

**Q: Can I change my role after I sign up?**
A: Not currently. Role is saved once at signup and is not editable from within the app. If you genuinely need a role change, contact the team — it can be updated in the database manually.

**Q: Is the Vendor role available?**
A: Not yet. The Role Selection screen shows both options, but Vendor shows a "Coming Soon" badge. Vendor flows are a planned future feature — they require a completely different set of screens and logic that will be built after Host features are complete.

**Q: Is my phone number and data safe?**
A: Yes. Phone numbers are stored by Supabase, a widely used and security-audited platform. OTPs expire quickly (typically 60 seconds) and can only be used once. We never store OTP codes ourselves. Google OAuth follows Google's security standards. No passwords exist in our system.

**Q: What happens if I close the tab before selecting a role?**
A: Your account is created and you're logged in, but you'll land back at the Role Selection screen the next time you open the app. The role is not saved until you make a selection.

**Q: Can two people share an account?**
A: Not in the current design — accounts are tied to a single phone number or Google account. Collaborative event management (multiple hosts per event) is on the product roadmap but is a separate feature.

---

## Contact

Questions about this feature? Ping Abhijith (product) or Dheeraj (engineering).
