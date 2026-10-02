-- =============================================================================
-- CURERA AI — 001_init.sql
--
-- Roles: "patient" (default, created by trigger) and "professional"
--        (promoted manually by an admin via SQL only).
-- Security: RLS is the ONLY security layer. The client uses the anon key.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECURITY DEFINER helpers (before any policy; no cross-table recursion)
-- -----------------------------------------------------------------------------

create or replace function public.is_professional()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'professional'
  );
$$;

create or replace function public.has_active_consent(p_case_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.consents
    where case_id = p_case_id and revoked_at is null
  );
$$;

create or replace function public.active_consent_shares_transcript(p_case_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.consents
    where case_id = p_case_id
      and revoked_at is null
      and share_transcript = true
  );
$$;

create or replace function public.has_consent_on_patient(p_patient_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from public.cases c
    join public.consents co on co.case_id = c.id
    where c.patient_id = p_patient_id and co.revoked_at is null
  );
$$;

revoke execute on function public.is_professional() from public, anon;
revoke execute on function public.has_active_consent(uuid) from public, anon;
revoke execute on function public.active_consent_shares_transcript(uuid) from public, anon;
revoke execute on function public.has_consent_on_patient(uuid) from public, anon;

grant execute on function public.is_professional() to authenticated;
grant execute on function public.has_active_consent(uuid) to authenticated;
grant execute on function public.active_consent_shares_transcript(uuid) to authenticated;
grant execute on function public.has_consent_on_patient(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'patient'
                check (role in ('patient','professional')),
  full_name   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.cases (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.profiles(id) on delete cascade,
  summary           jsonb not null,
  urgency           text not null check (urgency in ('routine','soon','urgent')),
  status            text not null default 'new' check (status in ('new','reviewed')),
  professional_note text,
  created_at        timestamptz not null default now()
);

create table if not exists public.case_transcripts (
  case_id    uuid primary key references public.cases(id) on delete cascade,
  transcript text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases(id) on delete cascade,
  share_summary    boolean not null default true,
  share_transcript boolean not null default false,
  granted_at       timestamptz not null default now(),
  revoked_at       timestamptz
);

create index if not exists idx_cases_patient_id on public.cases(patient_id);
create index if not exists idx_consents_case_id on public.consents(case_id);

-- -----------------------------------------------------------------------------
-- Trigger: create profile on signup. Role is ALWAYS 'patient'.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trigger: role and id are immutable for authenticated users.
-- Admins (SQL editor / service_role) have auth.uid() = null and can promote.
-- -----------------------------------------------------------------------------

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role then
      raise exception 'Role is immutable for regular users';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile id is immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_change on public.profiles;
create trigger trg_prevent_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

-- -----------------------------------------------------------------------------
-- Trigger: professionals may only change status and professional_note.
-- -----------------------------------------------------------------------------

create or replace function public.prevent_professional_case_edits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return new; end if;
  if v_uid <> old.patient_id then
    if new.summary      is distinct from old.summary
       or new.urgency    is distinct from old.urgency
       or new.patient_id is distinct from old.patient_id
       or new.id         is distinct from old.id
       or new.created_at is distinct from old.created_at then
      raise exception 'Professionals may only update status and professional_note';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_professional_case_edits on public.cases;
create trigger trg_prevent_professional_case_edits
  before update on public.cases
  for each row execute function public.prevent_professional_case_edits();

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.cases             enable row level security;
alter table public.case_transcripts  enable row level security;
alter table public.consents          enable row level security;

-- -----------------------------------------------------------------------------
-- PROFILES policies
-- -----------------------------------------------------------------------------

-- A user always reads their own profile.
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ( id = (select auth.uid()) );

-- A professional reads a patient's profile only if that patient has at least
-- one case with an active consent. Uses SECURITY DEFINER helper (no recursion).
create policy "Professionals can view consented patient profiles"
  on public.profiles for select to authenticated
  using ( public.has_consent_on_patient(profiles.id) );

-- A user updates their own profile. Role and id are protected by trigger.
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) );

-- No INSERT policy: profiles are created by the trigger only.

-- -----------------------------------------------------------------------------
-- CASES policies
-- -----------------------------------------------------------------------------

create policy "Patients can insert own cases"
  on public.cases for insert to authenticated
  with check ( patient_id = (select auth.uid()) );

create policy "Patients can view own cases"
  on public.cases for select to authenticated
  using ( patient_id = (select auth.uid()) );

create policy "Patients can update own cases"
  on public.cases for update to authenticated
  using ( patient_id = (select auth.uid()) )
  with check ( patient_id = (select auth.uid()) );

create policy "Patients can delete own cases"
  on public.cases for delete to authenticated
  using ( patient_id = (select auth.uid()) );

-- Professional sees a case ONLY while an active consent exists.
create policy "Professionals can view consented cases"
  on public.cases for select to authenticated
  using (
    public.is_professional()
    and public.has_active_consent(cases.id)
  );

-- Professional updates a consented case; trigger restricts columns.
create policy "Professionals can update consented cases"
  on public.cases for update to authenticated
  using (
    public.is_professional()
    and public.has_active_consent(cases.id)
  )
  with check (
    public.is_professional()
    and public.has_active_consent(cases.id)
  );

-- -----------------------------------------------------------------------------
-- CASE_TRANSCRIPTS policies
-- -----------------------------------------------------------------------------

create policy "Patients can view own transcripts"
  on public.case_transcripts for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_transcripts.case_id
        and c.patient_id = (select auth.uid())
    )
  );

create policy "Patients can insert own transcripts"
  on public.case_transcripts for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_transcripts.case_id
        and c.patient_id = (select auth.uid())
    )
  );

create policy "Patients can delete own transcripts"
  on public.case_transcripts for delete to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_transcripts.case_id
        and c.patient_id = (select auth.uid())
    )
  );

-- Professional sees a transcript ONLY if the active consent shares it.
create policy "Professionals can view consented transcripts"
  on public.case_transcripts for select to authenticated
  using (
    public.is_professional()
    and public.active_consent_shares_transcript(case_transcripts.case_id)
  );

-- -----------------------------------------------------------------------------
-- CONSENTS policies
-- -----------------------------------------------------------------------------

create policy "Patients can view own consents"
  on public.consents for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = consents.case_id
        and c.patient_id = (select auth.uid())
    )
  );

create policy "Patients can insert consents for own cases"
  on public.consents for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = consents.case_id
        and c.patient_id = (select auth.uid())
    )
  );

create policy "Patients can update consents for own cases"
  on public.consents for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = consents.case_id
        and c.patient_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = consents.case_id
        and c.patient_id = (select auth.uid())
    )
  );

create policy "Professionals can view consents on accessible cases"
  on public.consents for select to authenticated
  using (
    public.is_professional()
    and public.has_active_consent(consents.case_id)
  );

-- =============================================================================
-- Promote a user to professional (run as admin in the SQL editor):
--
--   update public.profiles set role = 'professional' where id = '<USER_UUID>';
--
-- SQL TEST: prove a second patient cannot read the first patient's case.
--
--   1. Sign in as Patient A, save one case. Copy its UUID (<CASE_A>).
--   2. In SQL Editor, run:
--
--      begin;
--      set local role authenticated;
--      select set_config('request.jwt.claims',
--                        '{"sub":"<PATIENT_B_UUID>","role":"authenticated"}',
--                        true);
--      select count(*) from public.cases where id = '<CASE_A>';
--      -- Expected: 0
--      rollback;
-- =============================================================================