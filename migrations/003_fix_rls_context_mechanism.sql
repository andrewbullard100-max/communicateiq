-- Corrects 002_rls_policies: the previous current_org_id()/current_user_id()
-- read a session GUC set via a separate rpc() call, which does not persist
-- across separate PostgREST requests (each is its own transaction). This
-- redefines them to read the per-request 'request.headers' GUC that
-- PostgREST sets within the SAME transaction as the query itself — the
-- officially supported mechanism for non-Supabase-Auth tenant claims.
-- All existing CREATE POLICY statements are unaffected since they only
-- reference these two function names.

create or replace function public.current_org_id() returns uuid
language sql stable as $$
  select nullif(
    (current_setting('request.headers', true)::json ->> 'x-app-org-id'),
    ''
  )::uuid
$$;

create or replace function public.current_user_id() returns uuid
language sql stable as $$
  select nullif(
    (current_setting('request.headers', true)::json ->> 'x-app-user-id'),
    ''
  )::uuid
$$;

-- No longer needed — was only used by the broken two-call approach.
drop function if exists public.set_request_context(uuid, uuid);
