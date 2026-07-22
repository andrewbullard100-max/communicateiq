-- ============================================================================
-- CommunicateIQ Training — Initial Schema Migration
-- Reverse-engineered from live Supabase project (isgdzeyftlpvvqzjuzqt) on 2026-07-21.
-- This documents the schema that already exists in production. Running this
-- against a FRESH database reproduces it from source control, which the repo
-- currently cannot do (no migrations were checked in prior to this).
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists ltree;

-- ----------------------------------------------------------------------------
-- Lookup / reference tables (no dependencies)
-- ----------------------------------------------------------------------------

create table public.industries (
  id     text primary key,
  label  text not null,
  icon   text,
  active boolean not null default true
);

create table public.plans (
  id                   text primary key,
  name                 text not null,
  stripe_price_id      text,
  monthly_price_cents  integer,
  seat_limit           integer,
  description          text,
  sort_order           integer not null default 0
);

create table public.roles (
  id    text primary key,
  label text not null
);

-- ----------------------------------------------------------------------------
-- Core tenancy
-- ----------------------------------------------------------------------------

create table public.organizations (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  industry                  text references public.industries(id),
  transcript_retention      text not null default 'until_manager_review'
    check (transcript_retention in ('none','retain_30_days','until_manager_review','custom')),
  transcript_retention_days integer,
  created_at                timestamptz not null default now(),
  stripe_customer_id        text,
  stripe_subscription_id    text,
  plan_id                   text references public.plans(id),
  subscription_status       text not null default 'no_subscription'
    check (subscription_status in ('no_subscription','trialing','active','past_due','canceled','unpaid')),
  current_period_end        timestamptz,
  trial_ends_at             timestamptz,
  sso_enabled               boolean not null default false,
  sso_provider              text check (sso_provider is null or sso_provider in ('azure-ad','okta','google')),
  sso_domain                text,
  sso_tenant_id              text
);

create table public.org_units (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id),
  parent_id  uuid references public.org_units(id),
  unit_type  text not null,
  name       text not null,
  path       ltree,
  created_at timestamptz not null default now()
);

create table public.users (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id),
  org_unit_id   uuid not null references public.org_units(id),
  manager_id    uuid references public.users(id),
  email         text not null,
  name          text not null,
  password_hash text,
  sso_subject   text,
  status        text not null default 'active'
    check (status in ('invited','active','suspended','terminated')),
  created_at    timestamptz not null default now()
);

create table public.user_roles (
  user_id     uuid not null references public.users(id),
  role_id     text not null references public.roles(id),
  org_unit_id uuid not null references public.org_units(id),
  primary key (user_id, role_id, org_unit_id)
);

-- ----------------------------------------------------------------------------
-- Training content
-- ----------------------------------------------------------------------------

create table public.training_tracks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations(id),
  industry_id text not null references public.industries(id),
  name        text not null,
  description text
);

create table public.scenario_families (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references public.organizations(id),
  slug                text not null,
  industry_id         text not null references public.industries(id),
  training_type       text not null,
  current_version_id  uuid, -- FK added after scenario_versions exists (circular ref)
  created_at          timestamptz not null default now()
);

create table public.scenario_versions (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.scenario_families(id),
  version_number   integer not null,
  status           text not null default 'draft'
    check (status in ('draft','pending_review','approved','archived')),
  title            text not null,
  day_label        text,
  difficulty       text not null check (difficulty in ('Foundational','Intermediate','Advanced')),
  role_persona     text not null,
  context          text not null,
  opening_line     text not null,
  client_persona   text not null,
  data_packet      jsonb,
  success_criteria jsonb not null,
  rubric_weighting jsonb not null,
  authored_by      uuid not null references public.users(id),
  approved_by      uuid references public.users(id),
  approved_at      timestamptz,
  change_notes     text,
  created_at       timestamptz not null default now()
);

alter table public.scenario_families
  add constraint fk_current_version foreign key (current_version_id)
  references public.scenario_versions(id);

create table public.training_track_items (
  track_id           uuid not null references public.training_tracks(id),
  sequence           integer not null,
  scenario_family_id uuid references public.scenario_families(id),
  module_key         text,
  primary key (track_id, sequence)
);

create table public.certification_pathways (
  id                            uuid primary key default gen_random_uuid(),
  org_id                        uuid references public.organizations(id),
  name                          text not null,
  track_id                      uuid not null references public.training_tracks(id),
  passing_score                 numeric not null,
  required_attempts_per_scenario integer not null default 1,
  expires_after_days            integer
);

-- ----------------------------------------------------------------------------
-- Cohorts & assignments
-- ----------------------------------------------------------------------------

create table public.cohorts (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id),
  name       text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.cohort_members (
  cohort_id uuid not null references public.cohorts(id),
  user_id   uuid not null references public.users(id),
  primary key (cohort_id, user_id)
);

create table public.assignments (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id),
  target_user_id      uuid references public.users(id),
  target_org_unit_id  uuid references public.org_units(id),
  target_cohort_id    uuid references public.cohorts(id),
  scenario_family_id  uuid references public.scenario_families(id),
  track_id            uuid references public.training_tracks(id),
  pathway_id          uuid references public.certification_pathways(id),
  due_at              timestamptz,
  passing_score       numeric,
  required_attempts   integer not null default 1,
  assigned_by         uuid not null references public.users(id),
  created_at          timestamptz not null default now(),
  status              text not null default 'active' check (status in ('active','cancelled'))
);

-- ----------------------------------------------------------------------------
-- Simulation attempts, transcripts, scoring validation
-- ----------------------------------------------------------------------------

create table public.simulation_attempts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id),
  assignment_id         uuid references public.assignments(id),
  scenario_version_id   uuid references public.scenario_versions(id),
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  ai_scores             jsonb,
  ai_certification_status text,
  ai_headline           text,
  ai_model_version      text not null,
  passed                boolean,
  created_at            timestamptz not null default now(),
  scenario_label        text,
  industry              text,
  training_type         text
);

create table public.transcripts (
  attempt_id       uuid primary key references public.simulation_attempts(id),
  content          jsonb not null,
  retention_policy text not null,
  expires_at       timestamptz,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create table public.score_reviews (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references public.simulation_attempts(id),
  reviewer_type text not null check (reviewer_type in ('human_expert','ai_rescoring')),
  reviewer_id   uuid references public.users(id),
  model_version text,
  scores        jsonb not null,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Audit / usage
-- ----------------------------------------------------------------------------

create table public.login_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id),
  org_id          uuid references public.organizations(id),
  email_attempted text,
  success         boolean not null,
  reason          text not null check (reason in (
    'ok','bad_password','inactive','not_found',
    'sso_no_account','sso_inactive','sso_not_enabled',
    'sso_domain_mismatch','sso_tenant_mismatch'
  )),
  created_at      timestamptz not null default now()
);

create table public.api_usage_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.users(id),
  org_id     uuid references public.organizations(id),
  route      text not null check (route in ('chat','transcribe','speak')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes (FK columns queried on the hot path — not present in production
-- today; added here since they cost nothing on a fresh DB and every
-- tenant-scoped query filters on org_id)
-- ----------------------------------------------------------------------------

create index idx_users_org_id on public.users(org_id);
create index idx_org_units_org_id on public.org_units(org_id);
create index idx_simulation_attempts_user_id on public.simulation_attempts(user_id);
create index idx_score_reviews_attempt_id on public.score_reviews(attempt_id);
create index idx_assignments_org_id on public.assignments(org_id);
create index idx_scenario_families_org_id on public.scenario_families(org_id);
create index idx_login_events_org_id on public.login_events(org_id);
create index idx_api_usage_events_org_id on public.api_usage_events(org_id);
create index idx_api_usage_events_created_at on public.api_usage_events(created_at);
