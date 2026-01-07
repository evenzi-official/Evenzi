# Setup Instructions

## 1. Install Dependencies

Run the following command to install the required Supabase packages:

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - Server-side rendering support for Next.js

## 2. Environment Variables

### For Local Development

Create a `.env.local` file in the root directory with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=https://rkakqjneqwlszcvqixxr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_-rux7UD3Ls5DRfRo13CFtw_AuIo5S6c
```

### For Vercel Deployment

Add these same environment variables in your Vercel project settings:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## 3. Test Phone Number Configuration

The application is configured to work with test phone numbers. To test:

1. Go to `http://localhost:3000/auth`
2. Enter phone number: `9999999999` (without country code)
3. Click "Send OTP"
4. Enter OTP: `123456`
5. You should be successfully logged in and redirected to `/home`

**Note:** The test configuration in Supabase is set as `919999999999=123456`, so entering `9999999999` will automatically format to `919999999999`.

## 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

## Features Implemented

✅ **Auth Page** (`/auth`) with:
- Tab system: "Sign Up" | "Log In"
- Phone OTP authentication
- Google OAuth
- Email magic link

✅ **Post-Signup Landing Page** (`/home`)
- Welcome page after successful authentication
- Sign out functionality

✅ **Route Protection**
- Middleware protects authenticated routes
- Public access to landing page (`/`)
- Auth pages accessible without login

## File Structure

```
app/
  ├── auth/
  │   ├── page.tsx          # Auth screen with all three methods
  │   └── callback/
  │       └── route.ts      # OAuth callback handler
  ├── home/
  │   └── page.tsx          # Post-signup landing page
  └── page.tsx              # Main landing page

lib/
  └── supabase/
      ├── client.ts         # Browser client
      ├── server.ts         # Server client
      └── middleware.ts     # Middleware utilities

middleware.ts               # Next.js middleware for route protection
```

