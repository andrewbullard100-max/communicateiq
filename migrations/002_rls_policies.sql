-- ============================================================================
-- CommunicateIQ Training — Row Level Security policies
--
-- IMPORTANT — read before applying:
-- This app authenticates via NextAuth against the custom `users` table, not
-- Supabase Auth, so there is no auth.uid()/auth.jwt() for policies to key
-- off. These policies instead read a per-request Postgres session variable,
-- `app.current_org_id`, which the application must set on the connection
-- BEFORE running any query, e.g.:
--
--   await supabase.rpc('set_request_context', { org_id: session.user.orgId })
--
-- (see the set_request_context() function below).
--
-- CRITICAL: these policies only take effect for connections that do NOT use
-- the service-role key. The service-role key bypasses RLS unconditionally —
-- that's the gap SECURITY.md already documents. To get real defense in
-- depth, the app's Supabase client for tenant-scoped reads/writes needs to
-- switch from the service-role key to the anon/authenticated key + this
-- session variable. Admin/cron scripts (purge-expired-transcripts.js, etc.)
-- can keep using the service-role key deliberately, since they need
-- cross-tenant access by design.
-- ============================================================================

-- Helper: current org from session context, NULL if unset.
create or replace function public.current_org_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_org_id', true), '')::uuid
$$;

-- Helper: current user id from session context, NULL if unset.
create or replace function public.current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

-- Called once per request by the app to scope the connection.
create or replace function public.set_request_context(org_id uuid, user_id uuid)
returns void
language plpgsql security definer as $$
begin
  perform set_config('app.current_org_id', org_id::text, true);
  perform set_config('app.current_user_id', user_id::text, true);
end;
$$;

-- ----------------------------------------------------------------------------
-- organizations: a user may only see their own org row
-- ----------------------------------------------------------------------------
create policy org_isolation_select on public.organizations
  for select using (id = public.current_org_id());

-- ----------------------------------------------------------------------------
-- Direct org_id tables: standard tenant isolation
-- ----------------------------------------------------------------------------
create policy org_scope on public.org_units
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy org_scope on public.users
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy org_scope on public.training_tracks
  for all using (org_id is null or org_id = public.current_org_id())
  with check (org_id is null or org_id = public.current_org_id());

create policy org_scope on public.scenario_families
  for all using (org_id is null or org_id = public.current_org_id())
  with check (org_id is null or org_id = public.current_org_id());
  -- org_id null = global/shared scenario library content, visible to all tenants

create policy org_scope on public.certification_pathways
  for all using (org_id is null or org_id = public.current_org_id())
  with check (org_id is null or org_id = public.current_org_id());

create policy org_scope on public.cohorts
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy org_scope on public.assignments
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy org_scope on public.login_events
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy org_scope on public.api_usage_events
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ----------------------------------------------------------------------------
-- Tables reached via a join (no org_id column of their own)
-- ----------------------------------------------------------------------------
create policy org_scope on public.user_roles
  for all using (
    exists (select 1 from public.users u
            where u.id = user_roles.user_id and u.org_id = public.current_org_id())
  )
  with check (
    exists (select 1 from public.users u
            where u.id = user_roles.user_id and u.org_id = public.current_org_id())
  );

create policy org_scope on public.cohort_members
  for all using (
    exists (select 1 from public.cohorts c
            where c.id = cohort_members.cohort_id and c.org_id = public.current_org_id())
  )
  with check (
    exists (select 1 from public.cohorts c
            where c.id = cohort_members.cohort_id and c.org_id = public.current_org_id())
  );

create policy org_scope on public.scenario_versions
  for all using (
    exists (select 1 from public.scenario_families f
            where f.id = scenario_versions.family_id
              and (f.org_id is null or f.org_id = public.current_org_id()))
  )
  with check (
    exists (select 1 from public.scenario_families f
            where f.id = scenario_versions.family_id
              and (f.org_id is null or f.org_id = public.current_org_id()))
  );

create policy org_scope on public.training_track_items
  for all using (
    exists (select 1 from public.training_tracks t
            where t.id = training_track_items.track_id
              and (t.org_id is null or t.org_id = public.current_org_id()))
  )
  with check (
    exists (select 1 from public.training_tracks t
            where t.id = training_track_items.track_id
              and (t.org_id is null or t.org_id = public.current_org_id()))
  );

create policy org_scope on public.simulation_attempts
  for all using (
    exists (select 1 from public.users u
            where u.id = simulation_attempts.user_id and u.org_id = public.current_org_id())
  )
  with check (
    exists (select 1 from public.users u
            where u.id = simulation_attempts.user_id and u.org_id = public.current_org_id())
  );

create policy org_scope on public.transcripts
  for all using (
    exists (select 1 from public.simulation_attempts a
            join public.users u on u.id = a.user_id
            where a.id = transcripts.attempt_id and u.org_id = public.current_org_id())
  )
  with check (
    exists (select 1 from public.simulation_attempts a
            join public.users u on u.id = a.user_id
            where a.id = transcripts.attempt_id and u.org_id = public.current_org_id())
  );

create policy org_scope on public.score_reviews
  for all using (
    exists (select 1 from public.simulation_attempts a
            join public.users u on u.id = a.user_id
            where a.id = score_reviews.attempt_id and u.org_id = public.current_org_id())
  )
  with check (
    exists (select 1 from public.simulation_attempts a
            join public.users u on u.id = a.user_id
            where a.id = score_reviews.attempt_id and u.org_id = public.current_org_id())
  );

-- ----------------------------------------------------------------------------
-- Global reference data: readable by everyone, writable by no one via RLS
-- (manage via migrations / service role only)
-- ----------------------------------------------------------------------------
create policy read_all on public.industries for select using (true);
create policy read_all on public.plans      for select using (true);
create policy read_all on public.roles      for select using (true);

-- ----------------------------------------------------------------------------
-- NOTE ON MANAGER VISIBILITY SCOPE (flagged separately by the code review):
-- These policies isolate by organization only. They do NOT yet restrict a
-- manager to their org_unit / direct reports — that's a narrower policy
-- layered on top (e.g. an additional USING clause on simulation_attempts /
-- users that checks org_unit_id against a ltree ancestor path, or
-- manager_id = current_user_id() for direct reports). Left out of this pass
-- because it depends on which visibility model you commit to (org_unit
-- subtree vs. direct-report chain vs. both) — worth a short design decision
-- before encoding it, rather than guessing.
-- ============================================================================
