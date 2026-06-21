# GROWTH for Google Calendar — Chrome Extension

Adds a GROWTH sidebar inside `calendar.google.com` showing today's habits (with
one-tap completion), urgent tasks, and night check-in status — so Google Calendar
becomes your home base with a GROWTH layer on top.

## Setup

1. **Configure** `config.js` with your own values:
   - `SUPABASE_URL` — same as the app's `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` — same as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `APP_URL` — your deployed GROWTH URL

2. **Add icons** (optional): the manifest works without them, but you can add
   `icons/16.png`, `48.png`, `128.png` and an `"icons"` block if desired.

3. **Load the extension**:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select this `chrome-extension/` folder

4. **Sign in**: click the GROWTH toolbar icon → enter your app email & password.
   The session is stored in `chrome.storage.local` and auto-refreshes.

5. **Use it**: open Google Calendar → click the floating **G** button (bottom-right)
   to open the sidebar.

## How it works

- Talks directly to Supabase's REST (`/rest/v1`) and Auth (`/auth/v1`) endpoints
  using your anon key + the signed-in user's access token — no SDK bundle.
- All reads/writes are protected by the same Row-Level Security as the app, so
  the extension can only ever see the signed-in user's own rows.
- Habit completion inserts into `habit_logs` (duplicate-safe via
  `Prefer: resolution=ignore-duplicates`).

## Security notes

- The anon key is a publishable key (safe for client use); RLS enforces access.
- Credentials are never stored — only the returned session tokens are kept in
  `chrome.storage.local`, scoped to this extension.
