# Khaata — the app

Five files. No build step, no npm, nothing to compile.

## Put it online (5 minutes)

It has to be served over HTTPS — iOS will not install a home-screen app from a
local file. Any static host works; you already have Vercel.

**Vercel (easiest):** go to vercel.com/new → *Deploy* → drag this whole folder in.
You get a URL like `khaata-xxxx.vercel.app`.

**Netlify:** app.netlify.com/drop → drag the folder.

## First run

1. Open the URL. It asks for your **Supabase project URL** and **anon key** —
   both are in your Supabase dashboard under *Settings → API*.
2. Sign in with the email and password you created in step 3 of the setup.

Those two values are stored in your browser only. The anon key is *designed* to
sit in a browser; row-level security is what protects your data, not the key.
The app refuses your `service_role` key on purpose — that one bypasses RLS and
must never go near a browser.

## Put it on your iPhone

Open the URL in **Safari** (not Chrome — only Safari can install), tap the Share
button, then **Add to Home Screen**. It gets its own icon and opens full screen
with no browser chrome.

## The five screens

- **Ledger** — everything, filtered by month, kind and account. Tap any row to
  recategorise it, rename the merchant, or mark it a transfer.
- **Review** — one transaction at a time, with category suggestions. This is the
  fast way to clear the backlog.
- **Add** — cash and anything email never sees. Four taps.
- **Debts** — who owes you, who you owe, and what's outstanding.
- **Insights** — spending by category, month by month, and what you're net.

## Notes

- Anything you change in the app is marked as yours, so the 6 AM job will never
  overwrite it.
- Transfers stay in the ledger but out of every total. Without that rule your
  spending would have read ₹2.2 lakh instead of ₹27,641.
- The service worker caches the app shell so it opens instantly offline, but it
  never caches your financial data — that is always fetched live, so you can't
  be shown a stale balance.
