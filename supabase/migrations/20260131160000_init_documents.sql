create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('quotation','invoice','quality','production','rnd')),
  external_id text,
  customer text,
  status text,
  total numeric,
  data jsonb not null default '{}'::jsonb,
  markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists documents_type_created_at_idx on public.documents (type, created_at desc);
create index if not exists documents_customer_idx on public.documents (customer);
create index if not exists documents_external_id_idx on public.documents (external_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'documents_select_public'
  ) then
    create policy documents_select_public on public.documents for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_logs' and policyname = 'audit_logs_select_public'
  ) then
    create policy audit_logs_select_public on public.audit_logs for select using (true);
  end if;
end $$;

revoke insert, update, delete on public.documents from anon, authenticated;
revoke insert, update, delete on public.audit_logs from anon, authenticated;
