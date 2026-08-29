-- Proposal Generation Platform — initial schema
-- Single-tenant app: RLS is enabled everywhere with authenticated-only owner
-- policies for the dashboard. There are NO anon policies. All public-facing
-- reads/writes (the /p/[slug] page, sign action, checkout, Stripe webhook) go
-- through Next.js Route Handlers using the service-role key, which bypasses
-- RLS by design — lib/supabase/admin.ts is the actual security boundary.
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / DROP+CREATE for policies
-- so a partial prior run doesn't block the rest from completing.

create extension if not exists "pgcrypto";

-- Reusable sender profile: single row, edited from /dashboard/settings
create table if not exists sender_profile (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  logo_url text,
  bio text,
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,
  client_company text,
  quote text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                          -- random token, assigned on publish; used in /p/[slug]
  client_name text not null,
  client_company text,
  client_email text,
  client_phone text,
  brief text not null,
  price numeric(12, 2) not null,
  currency text not null default 'usd',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'viewed', 'signed', 'paid', 'archived')),
  ai_content jsonb,                          -- { greeting, valueProposition, processOverview[], timingTable[], scopeOfWork }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  signer_name text not null,
  signed_at timestamptz not null default now(),
  ip_address text
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount numeric(12, 2),
  currency text,
  status text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists proposals_slug_idx on proposals(slug);
create index if not exists signatures_proposal_id_idx on signatures(proposal_id);
create index if not exists payments_proposal_id_idx on payments(proposal_id);

-- RLS: enabled everywhere, authenticated-only. No anon policies —
-- public access is mediated exclusively by service-role server routes.
alter table sender_profile enable row level security;
alter table team_members enable row level security;
alter table testimonials enable row level security;
alter table proposals enable row level security;
alter table signatures enable row level security;
alter table payments enable row level security;

drop policy if exists "authenticated full access" on sender_profile;
create policy "authenticated full access" on sender_profile
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on team_members;
create policy "authenticated full access" on team_members
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on testimonials;
create policy "authenticated full access" on testimonials
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on proposals;
create policy "authenticated full access" on proposals
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on signatures;
create policy "authenticated full access" on signatures
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on payments;
create policy "authenticated full access" on payments
  for all to authenticated using (true) with check (true);

-- Storage bucket for logo + team photos: public read, authenticated write.
insert into storage.buckets (id, name, public)
values ('proposal-assets', 'proposal-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read proposal-assets" on storage.objects;
create policy "public read proposal-assets" on storage.objects
  for select to public using (bucket_id = 'proposal-assets');

drop policy if exists "authenticated write proposal-assets" on storage.objects;
create policy "authenticated write proposal-assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'proposal-assets');

drop policy if exists "authenticated update proposal-assets" on storage.objects;
create policy "authenticated update proposal-assets" on storage.objects
  for update to authenticated using (bucket_id = 'proposal-assets');

drop policy if exists "authenticated delete proposal-assets" on storage.objects;
create policy "authenticated delete proposal-assets" on storage.objects
  for delete to authenticated using (bucket_id = 'proposal-assets');
