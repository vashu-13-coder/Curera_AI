-- =============================================================================
-- CURERA AI — Database Schema (safe on a fresh Supabase project)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('patient', 'professional')),
  full_name   text not null,
  specialty   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  transcript  text,
  summary     jsonb,
  urgency     text not null default 'routine'
                check (urgency in ('routine', 'soon', 'urgent')),
  status      text not null default 'submitted'
                check (status in ('submitted', 'under_review', 'info_requested', 'scheduled', 'closed')),
  created_at  timestamptz not null default now()
);

create table if not exists public.case_messages (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.consents (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases(id) on delete cascade,
  professional_id  uuid references public.profiles(id) on delete set null,
  shared_fields    jsonb not null default '[]'::jsonb,
  granted_at       timestamptz not null default now(),
  revoked_at       timestamptz
);

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases(id) on delete cascade,
  professional_id  uuid not null references public.profiles(id) on delete cascade,
  scheduled_at     timestamptz not null,
  notes            text,
  created_at       timestamptz not null default now()
);

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  case_id     uuid references public.cases(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_cases_patient_id
  on public.cases(patient_id);
create index if not exists idx_consents_case_professional
  on public.consents(case_id, professional_id);
create index if not exists idx_case_messages_case_id
  on public.case_messages(case_id);
create index if not exists idx_appointments_case_professional
  on public.appointments(case_id, professional_id);
create index if not exists idx_audit_log_case_id
  on public.audit_log(case_id);

-- -----------------------------------------------------------------------------
-- 3. SECURITY DEFINER helpers (created BEFORE any policy)
--    All helpers: set search_path = public, filtered by auth.uid() inside,
--    execute revoked from public + anon, granted to authenticated.
-- -----------------------------------------------------------------------------

create or replace function public.is_professional()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'professional'
  );
$$;

create or replace function public.is_case_patient(p_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cases
    where cases.id = p_case_id
      and cases.patient_id = (select auth.uid())
  );
$$;

create or replace function public.has_active_consent(p_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.consents
    where consents.case_id = p_case_id
      and consents.professional_id = (select auth.uid())
      and consents.revoked_at is null
  );
$$;

create or replace function public.has_consent_on_patient(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.consents co
    join public.cases c on c.id = co.case_id
    where c.patient_id = p_patient_id
      and co.professional_id = (select auth.uid())
      and co.revoked_at is null
  );
$$;

-- Returns cases the caller holds active consent on.
-- transcript / summary are returned only if listed in shared_fields.
create or replace function public.get_consented_cases()
returns table (
  id            uuid,
  patient_id    uuid,
  transcript    text,
  summary       jsonb,
  urgency       text,
  status        text,
  created_at    timestamptz,
  shared_fields jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.patient_id,
    case when co.shared_fields @> '["transcript"]'::jsonb then c.transcript else null end as transcript,
    case when co.shared_fields @> '["summary"]'::jsonb    then c.summary    else null end as summary,
    c.urgency,
    c.status,
    c.created_at,
    co.shared_fields
  from public.cases c
  join public.consents co on co.case_id = c.id
  where co.professional_id = (select auth.uid())
    and co.revoked_at is null;
$$;

-- Professional-only status update.
create or replace function public.update_case_status(p_case_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_active_consent(p_case_id) then
    raise exception 'No active consent for this case';
  end if;
  if p_status not in ('under_review', 'info_requested', 'scheduled', 'closed') then
    raise exception 'Invalid status for professional: %', p_status;
  end if;
  update public.cases set status = p_status where cases.id = p_case_id;
end;
$$;

-- Lock down execute privileges.
revoke execute on function public.is_professional()               from public, anon;
revoke execute on function public.is_case_patient(uuid)           from public, anon;
revoke execute on function public.has_active_consent(uuid)        from public, anon;
revoke execute on function public.has_consent_on_patient(uuid)    from public, anon;
revoke execute on function public.get_consented_cases()           from public, anon;
revoke execute on function public.update_case_status(uuid, text)  from public, anon;

grant execute on function public.is_professional()               to authenticated;
grant execute on function public.is_case_patient(uuid)           to authenticated;
grant execute on function public.has_active_consent(uuid)        to authenticated;
grant execute on function public.has_consent_on_patient(uuid)    to authenticated;
grant execute on function public.get_consented_cases()           to authenticated;
grant execute on function public.update_case_status(uuid, text)  to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Trigger functions
-- -----------------------------------------------------------------------------

-- Every new auth user gets a profile as 'patient'.
-- Professionals are created only via the admin client or the seed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, specialty)
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed user'),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- role and id are immutable for regular users (auth.uid() not null).
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Role is immutable for regular users';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Profile id is immutable';
  end if;
  return new;
end;
$$;

-- Patients may only use 'submitted' or 'closed' on their own cases,
-- and may not modify immutable columns. Skipped when auth.uid() is null
-- so the admin client and the seed can operate freely.
create or replace function public.enforce_patient_status_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;

  if v_uid = new.patient_id then
    if tg_op = 'INSERT' then
      if new.status <> 'submitted' then
        raise exception 'Patients may only create cases with status submitted';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status
        and new.status not in ('submitted', 'closed') then
        raise exception 'Patients may only set status to submitted or closed';
      end if;
      if new.patient_id is distinct from old.patient_id
         or new.id         is distinct from old.id
         or new.created_at is distinct from old.created_at then
        raise exception 'Cannot modify immutable case fields';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- A consent's professional_id must reference a professional profile.
create or replace function public.enforce_consent_professional_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.professional_id is not null then
    if not exists (
      select 1 from public.profiles
      where profiles.id = new.professional_id
        and profiles.role = 'professional'
    ) then
      raise exception 'professional_id must reference a professional profile';
    end if;
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Enable RLS
-- -----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.cases          enable row level security;
alter table public.case_messages  enable row level security;
alter table public.consents       enable row level security;
alter table public.appointments   enable row level security;
alter table public.audit_log      enable row level security;

-- -----------------------------------------------------------------------------
-- 6. Policies
--    NOTE: no policy below reads public.cases as a professional.
--    Professionals go through SECURITY DEFINER helpers and RPCs only.
-- -----------------------------------------------------------------------------

-- 6.1 profiles -----------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( profiles.id = (select auth.uid()) );

drop policy if exists "Professionals can view consented patient profiles" on public.profiles;
create policy "Professionals can view consented patient profiles"
  on public.profiles for select
  to authenticated
  using ( public.has_consent_on_patient(profiles.id) );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( profiles.id = (select auth.uid()) )
  with check ( profiles.id = (select auth.uid()) );

-- No INSERT policy — profiles are created by handle_new_user() and by the
-- admin client / seed.

-- 6.2 cases --------------------------------------------------------------------
drop policy if exists "Patients can view own cases" on public.cases;
create policy "Patients can view own cases"
  on public.cases for select
  to authenticated
  using ( cases.patient_id = (select auth.uid()) );

drop policy if exists "Patients can create own cases" on public.cases;
create policy "Patients can create own cases"
  on public.cases for insert
  to authenticated
  with check ( cases.patient_id = (select auth.uid()) );

drop policy if exists "Patients can update own cases" on public.cases;
create policy "Patients can update own cases"
  on public.cases for update
  to authenticated
  using ( cases.patient_id = (select auth.uid()) )
  with check ( cases.patient_id = (select auth.uid()) );

-- No professional SELECT and no professional UPDATE on cases.
-- Professionals use get_consented_cases() and update_case_status().

-- 6.3 case_messages ------------------------------------------------------------
drop policy if exists "Participants can view case messages" on public.case_messages;
create policy "Participants can view case messages"
  on public.case_messages for select
  to authenticated
  using (
    public.is_case_patient(case_messages.case_id)
    or public.has_active_consent(case_messages.case_id)
  );

drop policy if exists "Participants can send case messages" on public.case_messages;
create policy "Participants can send case messages"
  on public.case_messages for insert
  to authenticated
  with check (
    case_messages.sender_id = (select auth.uid())
    and (
      public.is_case_patient(case_messages.case_id)
      or public.has_active_consent(case_messages.case_id)
    )
  );

-- 6.4 consents -----------------------------------------------------------------
drop policy if exists "Patients can view own case consents" on public.consents;
create policy "Patients can view own case consents"
  on public.consents for select
  to authenticated
  using ( public.is_case_patient(consents.case_id) );

drop policy if exists "Professionals can view own consents" on public.consents;
create policy "Professionals can view own consents"
  on public.consents for select
  to authenticated
  using ( consents.professional_id = (select auth.uid()) );

drop policy if exists "Patients can grant consent" on public.consents;
create policy "Patients can grant consent"
  on public.consents for insert
  to authenticated
  with check ( public.is_case_patient(consents.case_id) );

drop policy if exists "Patients can revoke consent" on public.consents;
create policy "Patients can revoke consent"
  on public.consents for update
  to authenticated
  using ( public.is_case_patient(consents.case_id) )
  with check ( public.is_case_patient(consents.case_id) );

-- 6.5 appointments -------------------------------------------------------------
drop policy if exists "Participants can view appointments" on public.appointments;
create policy "Participants can view appointments"
  on public.appointments for select
  to authenticated
  using (
    public.is_case_patient(appointments.case_id)
    or appointments.professional_id = (select auth.uid())
  );

drop policy if exists "Professionals can create appointments" on public.appointments;
create policy "Professionals can create appointments"
  on public.appointments for insert
  to authenticated
  with check (
    appointments.professional_id = (select auth.uid())
    and public.has_active_consent(appointments.case_id)
  );

-- 6.6 audit_log ----------------------------------------------------------------
-- audit_log is INSERT-only for clients. There is intentionally NO SELECT,
-- UPDATE or DELETE policy: reads and rewrites are refused for every
-- authenticated user. Auditing reads are performed by the service role
-- (admin client), which bypasses RLS.
drop policy if exists "Authenticated users can insert audit entries" on public.audit_log;
create policy "Authenticated users can insert audit entries"
  on public.audit_log for insert
  to authenticated
  with check (
    audit_log.actor_id = (select auth.uid())
    and (
      audit_log.case_id is null
      or public.is_case_patient(audit_log.case_id)
      or public.has_active_consent(audit_log.case_id)
    )
  );

-- -----------------------------------------------------------------------------
-- 7. Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_prevent_profile_role_change on public.profiles;
create trigger trg_prevent_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

drop trigger if exists trg_enforce_patient_status_rules on public.cases;
create trigger trg_enforce_patient_status_rules
  before insert or update on public.cases
  for each row execute function public.enforce_patient_status_rules();

drop trigger if exists trg_enforce_consent_professional_role on public.consents;
create trigger trg_enforce_consent_professional_role
  before insert or update on public.consents
  for each row execute function public.enforce_consent_professional_role();