# DreamTailor — v2 (everything from the backlog, built)

v1 was the smallest slice that could take a payment, generate a story,
and email it. This version adds everything that was deliberately
deferred from the original brief: multi-child plan limits, story
continuity, custom characters, family memories, audio narration, PDFs,
grandparent sharing, pause/resume, a moderation review queue, an admin
dashboard with analytics, and a full marketing site.

## What's new in this version

- **Plan-based limits** — Starter allows 1 child and 3 stories/week,
  Family allows 3 children with nightly stories, Premium is unlimited.
  Enforced both at the database level (a Postgres trigger blocks adding
  too many children) and in the story-sending API (a weekly quota check).
- **Per-child bedtime + timezone** — each child has their own `bedtime`
  and `timezone`; the nightly cron checks every active child against
  their own local time instead of one fixed UTC hour. **Read the cron
  section below — this needs Vercel Pro to actually run on schedule.**
- **Story continuity** — each generation can return a short "memory"
  that's fed into the next night's prompt, so characters and plot
  threads can carry forward if the model chooses to use them.
- **Custom characters, family memories, language, voice** — all
  per-child settings, editable from the dashboard.
- **Affirmations, discussion questions, a coloring-page prompt, and a
  breathing exercise** — included in every email alongside the story.
- **Audio narration** — generated with OpenAI's text-to-speech and
  uploaded to Supabase Storage; the email includes a "Listen now" link.
- **PDF download** — generated on demand, no extra storage needed.
- **Grandparent sharing** — additional emails are CC'd on every story
  for that child.
- **Pause / resume subscription** — via Stripe's pause_collection.
- **A human review queue** — anything OpenAI's moderation flags is held
  in `flagged_stories` instead of being sent, and shows up in `/admin`
  for a person to approve or reject.
- **Moderation audit log** — every generation attempt, flagged or not,
  is recorded in `moderation_logs`.
- **Basic prompt-injection hardening** — free-text fields (favorite
  animal, custom character, family memory notes) are stripped of
  newlines, code fences, and common "ignore previous instructions"
  phrasing before being used in the prompt. This is a basic mitigation,
  not a complete defense — see Backlog.
- **Admin dashboard** (`/admin`) — parent counts, active subscriptions by
  plan, cancellations, 30-day open rate and completion rate (tracked via
  a Resend webhook and a `/read` page), and the flagged-content queue.
- **Full marketing site** — FAQ, testimonials, a child-safety section, a
  privacy section, and basic SEO (sitemap, robots.txt, Open Graph tags).

## Setup

1. `npm install`
2. Create a Supabase project. In the SQL editor, run the entire contents
   of `supabase/schema.sql` (this is the full schema — if you're
   upgrading from v1, this file recreates everything from scratch, so
   use a fresh project or adapt it into a migration rather than
   re-running it against existing data).
3. **Set up Storage for audio**: in Supabase, go to Storage → New bucket
   → name it exactly `story-audio` → make it a **public** bucket.
4. Create an OpenAI API key with access to `gpt-4o-mini` and `tts-1`.
5. Create a Stripe account in test mode, create the three Prices
   (Starter/Family/Premium), copy the Price IDs and secret key.
6. Create a Resend account and API key. In the Resend dashboard, turn on
   **Open tracking** for your sending domain (Settings → your domain) —
   this is what powers the admin dashboard's open rate.
7. Copy `.env.example` to `.env.local` and fill in everything, including
   a new `ADMIN_SECRET` (any random string — this is your password for
   `/admin`).
8. `npm run dev`

## Important: the nightly cron needs Vercel Pro

Vercel's free Hobby plan only allows cron jobs that run **once per day**;
anything more frequent fails at deployment. The per-child bedtime
matching in this version needs the cron to run every 15 minutes to catch
each child's local bedtime window, so `vercel.json` is configured for
that — which means **this specific feature requires upgrading to Vercel
Pro ($20/month)** once you deploy. This isn't a bug to fix later: Hobby's
own terms describe it as for personal, non-commercial projects anyway, so
once you're taking real payments from real customers, Pro is the
appropriate tier regardless of the cron question.

While building/testing on Hobby, trigger `/api/cron/send-nightly`
manually instead of relying on the schedule (see Testing below). If you
want to avoid the $20/month before you have paying customers, an
external scheduler (e.g. a free tool like cron-job.org, or a GitHub
Actions scheduled workflow) can call that same URL on a tighter schedule
without needing Vercel Pro — just know that GitHub Actions disables
scheduled workflows automatically after 60 days with no commits to the
repo, so it needs occasional upkeep if you go that route.

## Testing plan, feature by feature

**Plan limits** — Sign up, add a child (works with no subscription —
one free profile is allowed). Try adding a second child before
subscribing — it should fail with a clear error from the database
trigger. Subscribe to Starter, try adding a second child — still
blocked (Starter allows 1). Subscribe to Family instead — now a second
and third child should work, a fourth should be blocked.

**Weekly story quota** — On Starter, send "tonight's story" 3 times in
a row for the same child (you can just click the button repeatedly for
testing). The 4th attempt within 7 days should return a 429 with a
clear message instead of generating another story.

**Continuity** — Send a story, note the `story_memory` value in the
`children` table afterward. Send a second story for the same child and
check whether the new story's content references anything from that
memory.

**Custom character / family memory / language / voice** — Set each of
these in a child's dashboard settings, send a story, and confirm the
generated story actually reflects them (the character appears, the
note is woven in, the story is in the right language).

**Audio + PDF** — After sending a story, check the email for "Listen
now" and "Download PDF" links. Confirm the audio file appears in your
Supabase Storage `story-audio` bucket, and that the PDF downloads and
opens correctly.

**Grandparent sharing** — Add an email you control to a child's
"grandparent emails" field, send a story, confirm that address receives
a CC.

**Pause / resume** — Subscribe, then click "Pause subscription." Confirm
`/api/send-story` now refuses to send for that account, and that Stripe
shows the subscription as not being billed. Click "Resume" and confirm
sending works again.

**Moderation review queue** — This is hard to trigger on purpose since
the safety prompt is intentionally strict. You can temporarily lower the
bar by editing the system prompt in `lib/openai.ts` to test the flow,
then revert it. A flagged story should appear in `/admin` instead of
being emailed, and Approve/Reject should work from there.

**Admin dashboard** — Visit `/admin`, enter your `ADMIN_SECRET`. Confirm
the counts roughly match what's in Supabase, and that open/completion
rates move when you open a story email and read one all the way to the
bottom of `/read/[id]` (completion is tracked via a scroll-to-bottom
trigger on that page).

**Nightly cron** — `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-nightly`.
Confirm it only sends to children whose local time is currently within
15 minutes of their bedtime, and that it skips a child it already sent
to today (check `last_sent_date` on the `children` table).

## Deployment

Same as before — push to GitHub, import into Vercel, set every
environment variable (including the new `ADMIN_SECRET`), update
`NEXT_PUBLIC_APP_URL`, point Stripe's webhook at your live domain, and
add a Resend webhook pointing at `/api/resend/webhook` for open
tracking. Remember the Vercel Pro requirement above before relying on
the automatic nightly send.

## Backlog — what's still simplified or left out

Everything from the original brief is now implemented in some real
form, but a few things are intentionally not production-hardened:

- **Resend webhook signature verification** — `/api/resend/webhook`
  trusts incoming payloads without verifying Resend's Svix signature.
  Fine for getting open-rate numbers directionally right; not safe
  against someone spoofing "opened" events at scale.
- **Prompt-injection hardening is basic** — string stripping of obvious
  patterns, not a robust defense. For a product handling many users'
  free-text input at scale, a dedicated moderation/classification pass
  on inputs (not just outputs) would be the next step.
- **Admin auth is a single shared secret**, not real accounts/roles.
  Fine for one founder; not fine for a team without further work.
- **No automated test suite** — everything above has a manual testing
  plan, but nothing runs in CI.
- **Educational progress tracking** is implicit (via `lesson_topic` on
  each story) rather than a dedicated parent-facing report.
- **Multilingual output quality hasn't been human-verified** beyond
  English — the model is simply instructed to write in the requested
  language.
