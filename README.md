# DreamTailor — v1 (smallest working slice)

This is the smallest version of DreamTailor that can do all three things the
brief asked for first: take a payment, generate a personalized story, and
email it to a parent. It is not the full spec — see **Backlog** at the
bottom for everything deliberately deferred, and why.

## What's actually in this slice

- Parent signup (Supabase Auth, email + password)
- One child profile per parent (name, age, favorite animal)
- Story generation via OpenAI, with safety rules baked into the system
  prompt and an output moderation check before any story is saved
- Manual "Send tonight's story" button that generates a story and emails
  it via Resend
- An automated nightly route (`/api/cron/send-nightly`) wired to Vercel
  Cron, that does the same thing for every child whose parent has an
  active subscription
- Stripe Checkout for a single "Starter" plan, with a webhook that
  activates the subscription on successful payment
- Minimal marketing page, signup, onboarding, and dashboard pages

## Setup

1. `npm install`
2. Create a Supabase project. In the SQL editor, run `supabase/schema.sql`.
   Copy the project URL, anon key, and service role key from
   Project Settings → API.
3. Create an OpenAI API key with access to `gpt-4o-mini`
   (or swap providers — see `lib/openai.ts`, it's the only file that
   touches the model).
4. Create a Stripe account in **test mode**. Create three recurring Prices —
   Starter ($6/mo), Family ($12/mo), Premium ($19/mo) — and copy each Price
   ID. Copy your test secret key. The 3-day free trial on Starter is set in
   code (`app/api/stripe/checkout/route.ts`), not in the Stripe dashboard,
   so you don't need to configure anything trial-related on the Price itself.
5. Create a Resend account, verify a sending domain (or use their sandbox
   while testing), and copy the API key.
6. Copy `.env.example` to `.env.local` and fill in everything from steps
   2–5, plus a random string for `CRON_SECRET`.
7. `npm run dev`

## Testing plan, feature by feature

**Auth + onboarding** — Sign up at `/signup`. Check Supabase → Table
Editor → `profiles` for the new row (created automatically by the
trigger in `schema.sql`). Fill in the child form at `/onboarding`, then
check the `children` table.

**Story generation** — From `/dashboard`, click "Send tonight's story."
Check the `stories` table for the new row, and check your inbox (use a
real address you control). Read the story — confirm it actually follows
the safety rules (no scary content, ends calmly, etc.) since the
moderation check only catches clearly flagged content, not subtle misses.

**Payments** — On the dashboard, choose any of the three plans — use test
card `4242 4242 4242 4242`, any future expiry, any CVC. To receive the
webhook locally, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
in a second terminal, and put the webhook signing secret it prints into
`STRIPE_WEBHOOK_SECRET`. Choosing **Starter** creates a subscription with
`status: trialing` for 3 days before Stripe charges the card — check the
`subscriptions` table to confirm the status is `trialing`, not `active`.
Choosing Family or Premium charges immediately and the status should be
`active`. To test what happens when a trial ends, use Stripe's test clocks
(Dashboard → Developers → Test clocks) to fast-forward time without
waiting 3 real days, and confirm the webhook flips the status to `active`
(or `past_due` if you simulate a failing card).

**Plan gating** — Before subscribing, confirm "Send tonight's story" is
disabled on the dashboard. After subscribing (trial or paid), confirm it
becomes clickable. This is enforced twice: once in the UI (disabled
button) and once in `/api/send-story` itself, which checks subscription
status server-side — the UI check alone wouldn't be enough, since anyone
could call the API route directly.

**Nightly cron** — Don't wait for the schedule first. Test it directly:
`curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-nightly`.
Confirm it skips children whose parent isn't subscribed, and sends to
ones who are.

## Deployment

Push to GitHub, import the repo into Vercel, and add every variable from
`.env.local` to the Vercel project's Environment Variables. Update
`NEXT_PUBLIC_APP_URL` to your real domain. In Stripe, point your webhook
endpoint at `https://yourdomain.com/api/stripe/webhook` and copy the new
signing secret into Vercel. Redeploy. `vercel.json` will register the
nightly cron automatically once deployed.

## Known gaps in this slice (intentional, for now)

- Everyone is sent at the same UTC time in the nightly cron; per-child
  bedtime/timezone scheduling isn't implemented yet.
- Story sending is gated on subscription status (active/trialing), but not
  yet on each plan's actual limits — Starter is meant to cap at 3 stories a
  week and one child, Family/Premium allow more children. Those quotas
  aren't enforced yet.
- The marketing page is functional but plain — it doesn't yet have the
  FAQ, testimonials, child-safety, or privacy sections from the brief.

## Backlog — deferred from the original brief

These were all in scope of what you asked for, just not in the smallest
working slice:

- Multiple children per subscription, plan-based limits (Starter/Family/
  Premium quotas)
- Story continuity mode (recurring characters/locations across nights)
- Family memory integration, custom characters, educational progress
  tracking, affirmations, breathing exercises, discussion questions,
  coloring page prompts
- Audio narration, multiple voices, multilingual stories
- PDF download, grandparent email sharing, pause subscription
- Human review queue for flagged content, full moderation logging/audit
  trail, prompt-injection hardening on user-entered fields (favorite
  animal, interests, etc. — currently passed into the prompt with no
  sanitization beyond what the system prompt itself constrains)
- Admin dashboard, analytics (open rates, completion, churn)
- Full marketing site (FAQ, testimonials, safety/privacy sections, SEO
  pass) — the more elaborate "Nightly" landing page built earlier in this
  conversation could be adapted into this app's design system
