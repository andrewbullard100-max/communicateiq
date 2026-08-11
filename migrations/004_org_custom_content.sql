-- ============================================================================
-- Org-Custom Content — policy-document upload + AI-generated content
-- ============================================================================
-- Lets an org upload its own policies/procedures and have AI generate
-- training content grounded in them:
--   - simulation/leadership scenarios  -> existing scenario_families /
--     scenario_versions tables, with org_id set to the org (org_id IS NULL
--     rows are the shared library — see app/api/scenarios). New
--     source_document_id column added below for provenance.
--   - Financial Storytelling / QBR content -> new org_module_config table,
--     mirroring the SERVICE_LINE_CONFIG shape in lib/data.js so the frontend
--     can merge an org's override on top of the static base config.
--
-- Both content types reuse the same draft -> pending_review -> approved
-- gate scenario_versions already has: nothing generated from a policy
-- document reaches trainees until a content_approver signs off on it.
-- ============================================================================

-- ── Uploaded policy/procedure documents ─────────────────────────────────────
create table public.org_policy_documents (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id),
  uploaded_by    uuid not null references public.users(id),
  filename       text not null,
  mime_type      text not null,
  storage_path   text not null,   -- path within the 'policy-documents' storage bucket
  extracted_text text,            -- populated once text extraction completes
  status         text not null default 'processing'
    check (status in ('processing','processed','error')),
  error_message  text,
  created_at     timestamptz not null default now()
);

create index idx_org_policy_documents_org_id on public.org_policy_documents(org_id);

alter table public.org_policy_documents enable row level security;

create policy org_policy_documents_tenant_isolation on public.org_policy_documents
  for all
  using (org_id = (current_setting('request.headers', true)::json->>'x-app-org-id')::uuid)
  with check (org_id = (current_setting('request.headers', true)::json->>'x-app-org-id')::uuid);

-- ── Provenance on generated scenarios ────────────────────────────────────────
alter table public.scenario_versions
  add column source_document_id uuid references public.org_policy_documents(id);

-- ── Org overrides for Financial Storytelling / QBR content ─────────────────
create table public.org_module_config (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id),
  industry_id         text not null references public.industries(id),
  service_line        text not null default 'dining'
    check (service_line in ('dining','facilities-maintenance','facilities-housekeeping')),
  module              text not null check (module in ('financial','qbr')),
  -- Shape mirrors SERVICE_LINE_CONFIG in lib/data.js:
  --   module='financial' -> { financialMetrics: [...], financialChallenges: [...] }
  --   module='qbr'       -> { qbrSections: [...], qbrPersonas: [...] }
  config              jsonb not null,
  status              text not null default 'draft'
    check (status in ('draft','pending_review','approved','archived')),
  source_document_id  uuid references public.org_policy_documents(id),
  authored_by         uuid not null references public.users(id),
  approved_by         uuid references public.users(id),
  approved_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_org_module_config_lookup
  on public.org_module_config(org_id, industry_id, service_line, module, status);

alter table public.org_module_config enable row level security;

create policy org_module_config_tenant_isolation on public.org_module_config
  for all
  using (org_id = (current_setting('request.headers', true)::json->>'x-app-org-id')::uuid)
  with check (org_id = (current_setting('request.headers', true)::json->>'x-app-org-id')::uuid);

-- Reads always go through the scoped client with the caller's own
-- x-app-org-id header (see lib/policies.js getApprovedModuleConfig) — no
-- separate public/anon-key read path, so no additional read policy is
-- needed (and adding a status='approved' policy unconditioned on org would
-- leak every org's approved config to every other org — deliberately not
-- doing that).

-- ── Rate-limit bucket for the new generation route ──────────────────────────
-- api_usage_events.route is constrained to a fixed set; policy_generate
-- (see app/api/admin/policies/generate) needs its own bucket rather than
-- sharing 'chat', since generation is bulk/high-token and shouldn't count
-- against a trainee's per-day coaching-call limit.
alter table public.api_usage_events drop constraint api_usage_events_route_check;
alter table public.api_usage_events add constraint api_usage_events_route_check
  check (route in ('chat','transcribe','speak','policy_generate'));

insert into storage.buckets (id, name, public)
values ('policy-documents', 'policy-documents', false)
on conflict (id) do nothing;

-- Objects are stored at `${orgId}/${uuid}-${filename}` — the first path
-- segment is the org id, checked against the same x-app-org-id header RLS
-- already uses everywhere else.
create policy policy_documents_tenant_isolation on storage.objects
  for all
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (current_setting('request.headers', true)::json->>'x-app-org-id')
  )
  with check (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (current_setting('request.headers', true)::json->>'x-app-org-id')
  );
