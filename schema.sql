-- Run this once in the Supabase SQL editor for a new project.

-- One row per parent, mirroring auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz default now()
);

-- Automatically create a profile row whenever someone signs up
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
  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'starter',
  status text default 'inactive',
  created_at timestamptz default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  sent_at timestamptz
);

-- Row level security: parents can only ever see their own data.
-- API routes use the service role key and bypass these policies on purpose.
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stories enable row level security;

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
