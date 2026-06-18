-- Run this once in the Supabase SQL editor for a new project.
-- This is the FULL schema, including everything originally deferred to
-- the backlog (continuity, custom characters, audio, PDF, moderation
-- logging, flagged-content review, multi-child plan limits, analytics).

-- One row per parent, mirroring auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  age int not null,
  favorite_animal text,

  -- per-child nightly scheduling
  timezone text not null default 'America/New_York',
  bedtime text not null default '20:00', -- 24h "HH:MM", local to `timezone`
  last_sent_date date,                   -- prevents double-sends on the same local day

  -- personalization / continuity
  story_memory text,                     -- short summary the model carries forward each night
  custom_character jsonb,                -- { "name": "...", "description": "..." }
  language text not null default 'English',
  voice text not null default 'alloy',   -- OpenAI TTS voice name
  grandparent_emails text[] not null default '{}',

  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'starter',
  status text default 'inactive', -- inactive | trialing | active | paused | past_due | cancelled
  created_at timestamptz default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  title text not null,
  content text not null,
  mood text,
  lesson_topic text,
  affirmation text,
  discussion_questions text[],
  coloring_prompt text,
  audio_url text,
  created_at timestamptz default now(),
  sent_at timestamptz,
  opened_at timestamptz,     -- set by the Resend webhook
  completed_at timestamptz   -- set by the /read page when a parent finishes it
);

-- A parent can jot down something real ("lost a tooth today") to be woven
-- into the next story. Cleared (used = true) after it's been used once.
create table public.family_memories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  note text not null,
  used boolean not null default false,
  created_at timestamptz default now()
);

-- Every generation attempt is logged here, flagged or not, for an audit trail.
create table public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  target text not null default 'output', -- 'input' (a free-text field) or 'output' (the generated story)
  flagged boolean not null,
  categories jsonb,
  created_at timestamptz default now()
);

-- Anything the moderation check flags is held here instead of being sent,
-- pending a human decision in /admin.
create table public.flagged_stories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  title text,
  content text,
  moderation_categories jsonb,
  status text not null default 'pending_review', -- pending_review | approved | rejected
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- One row per child enforces "1 child profile before subscribing" and the
-- per-plan caps once a subscription exists.
create or replace function public.enforce_child_limit()
returns trigger as $$
declare
  plan_text text;
  status_text text;
  child_count int;
  max_children int;
begin
  select s.plan, s.status into plan_text, status_text
  from public.subscriptions s
  where s.parent_id = new.parent_id;

  select count(*) into child_count from public.children where parent_id = new.parent_id;

  if status_text is null then
    max_children := 1; -- one free profile before choosing a plan
  elsif status_text not in ('active', 'trialing') then
    max_children := 0; -- paused / past_due / cancelled — no new profiles until resubscribed
  else
    max_children := case plan_text
      when 'starter' then 1
      when 'family' then 3
      else 999999 -- premium: unlimited
    end;
  end if;

  if child_count >= max_children then
    raise exception 'Plan limit reached: % plan(s) allow up to % child profile(s).',
      coalesce(plan_text, 'no'), max_children;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger before_insert_children
  before insert on public.children
  for each row execute procedure public.enforce_child_limit();

-- Row level security: parents can only ever see their own data.
-- API routes use the service role key and bypass these policies on purpose.
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stories enable row level security;
alter table public.family_memories enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.flagged_stories enable row level security;

create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

create policy "children_owner_all" on public.children
  for all using (auth.uid() = parent_id);

create policy "subscriptions_owner_select" on public.subscriptions
  for select using (auth.uid() = parent_id);

create policy "stories_owner_select" on public.stories
  for select using (
    exists (
      select 1 from public.children c
      where c.id = stories.child_id and c.parent_id = auth.uid()
    )
  );

create policy "family_memories_owner_all" on public.family_memories
  for all using (
    exists (
      select 1 from public.children c
      where c.id = family_memories.child_id and c.parent_id = auth.uid()
    )
  );

-- moderation_logs and flagged_stories have no public policies on purpose —
-- only the service role (admin routes, API routes) can read or write them.
