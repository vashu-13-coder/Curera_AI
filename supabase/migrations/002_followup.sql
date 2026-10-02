begin;

alter table public.cases
  drop constraint if exists cases_status_check;

update public.cases
set status = case status
  when 'new' then 'submitted'
  when 'reviewed' then 'under_review'
  else status
end;

alter table public.cases
  alter column status set default 'submitted',
  add constraint cases_status_check
    check (status in (
      'submitted',
      'under_review',
      'info_requested',
      'scheduled',
      'closed'
    ));

create or replace function public.active_consent_shares_summary(p_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select share_summary
    from public.consents
    where case_id = p_case_id
      and revoked_at is null
    order by granted_at desc, id desc
    limit 1
  ), false);
$$;

revoke execute on function public.active_consent_shares_summary(uuid) from public, anon;
grant execute on function public.active_consent_shares_summary(uuid) to authenticated;

create or replace function public.active_consent_shares_transcript(p_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select share_transcript
    from public.consents
    where case_id = p_case_id
      and revoked_at is null
    order by granted_at desc, id desc
    limit 1
  ), false);
$$;

revoke execute on function public.active_consent_shares_transcript(uuid) from public, anon;
grant execute on function public.active_consent_shares_transcript(uuid) to authenticated;

drop policy if exists "Professionals can view consented cases" on public.cases;
create policy "Professionals can view consented cases"
  on public.cases for select to authenticated
  using (
    public.is_professional()
    and public.has_active_consent(cases.id)
    and public.active_consent_shares_summary(cases.id)
  );

drop policy if exists "Professionals can update consented cases" on public.cases;

create or replace function public.enforce_patient_case_updates()
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

  if tg_op = 'INSERT' then
    if new.patient_id = v_uid and new.status <> 'submitted' then
      raise exception 'Patients may only create cases with status submitted';
    end if;
    return new;
  end if;

  if old.patient_id = v_uid then
    if new.id is distinct from old.id
       or new.patient_id is distinct from old.patient_id
       or new.summary is distinct from old.summary
       or new.urgency is distinct from old.urgency
       or new.professional_note is distinct from old.professional_note
       or new.created_at is distinct from old.created_at then
      raise exception 'Patients may not edit submitted case content';
    end if;

    if new.status is distinct from old.status
       and new.status not in ('submitted', 'closed') then
      raise exception 'Patients may only set status to submitted or closed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_patient_case_updates on public.cases;
create trigger trg_enforce_patient_case_updates
  before insert or update on public.cases
  for each row execute function public.enforce_patient_case_updates();

create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists idx_case_messages_case_created
  on public.case_messages(case_id, created_at);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_case_scheduled
  on public.appointments(case_id, scheduled_at);

alter table public.case_messages enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "Case participants can view messages" on public.case_messages;
create policy "Case participants can view messages"
  on public.case_messages for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_messages.case_id
        and (
          c.patient_id = (select auth.uid())
          or (
            public.is_professional()
            and public.has_active_consent(c.id)
          )
        )
    )
  );

drop policy if exists "Case participants can send messages" on public.case_messages;
create policy "Case participants can send messages"
  on public.case_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.cases c
      where c.id = case_messages.case_id
        and (
          c.patient_id = (select auth.uid())
          or (
            public.is_professional()
            and public.has_active_consent(c.id)
          )
        )
    )
  );

drop policy if exists "Patients and assigned professionals can view appointments" on public.appointments;
create policy "Patients and assigned professionals can view appointments"
  on public.appointments for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = appointments.case_id
        and (
          c.patient_id = (select auth.uid())
          or (
            appointments.professional_id = (select auth.uid())
            and public.is_professional()
            and public.has_active_consent(c.id)
          )
        )
    )
  );

grant select, insert on public.case_messages to authenticated;
grant select on public.appointments to authenticated;

drop function if exists public.get_consented_cases();
create function public.get_consented_cases()
returns table (
  id uuid,
  patient_id uuid,
  transcript text,
  summary jsonb,
  urgency text,
  status text,
  created_at timestamptz,
  shared_fields text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.patient_id,
    case when co.share_transcript then ct.transcript else null end,
    case when co.share_summary then c.summary else null end,
    c.urgency,
    c.status,
    c.created_at,
    array_remove(array[
      case when co.share_summary then 'summary'::text else null end,
      case when co.share_transcript then 'transcript'::text else null end
    ], null)
  from public.cases c
  join lateral (
    select consent.share_summary, consent.share_transcript
    from public.consents consent
    where consent.case_id = c.id
      and consent.revoked_at is null
    order by consent.granted_at desc, consent.id desc
    limit 1
  ) co on true
  left join public.case_transcripts ct on ct.case_id = c.id
  where auth.uid() is not null
    and public.is_professional()
  order by c.created_at desc;
$$;

revoke execute on function public.get_consented_cases() from public, anon;
grant execute on function public.get_consented_cases() to authenticated;

drop function if exists public.update_case_status(uuid, text);
create function public.update_case_status(p_case_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not public.is_professional()
     or not public.has_active_consent(p_case_id) then
    raise exception 'Case is not available to this professional';
  end if;

  if p_status is null
     or p_status not in ('under_review', 'info_requested', 'closed') then
    raise exception 'Invalid professional case status';
  end if;

  update public.cases
  set status = p_status
  where id = p_case_id;

  if not found then
    raise exception 'Case does not exist';
  end if;
end;
$$;

drop function if exists public.set_professional_note(uuid, text);
create function public.set_professional_note(p_case_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not public.is_professional()
     or not public.has_active_consent(p_case_id) then
    raise exception 'Case is not available to this professional';
  end if;

  if coalesce(char_length(p_note), 0) > 2000 then
    raise exception 'Professional note is too long';
  end if;

  update public.cases
  set professional_note = nullif(btrim(p_note), '')
  where id = p_case_id;

  if not found then
    raise exception 'Case does not exist';
  end if;
end;
$$;

drop function if exists public.schedule_case_appointment(uuid, timestamptz, text);
create function public.schedule_case_appointment(
  p_case_id uuid,
  p_scheduled_at timestamptz,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment_id uuid;
begin
  if auth.uid() is null
     or not public.is_professional()
     or not public.has_active_consent(p_case_id) then
    raise exception 'Case is not available to this professional';
  end if;

  if p_scheduled_at is null or p_scheduled_at <= clock_timestamp() then
    raise exception 'Appointment time must be in the future';
  end if;

  if coalesce(char_length(p_notes), 0) > 2000 then
    raise exception 'Appointment notes are too long';
  end if;

  insert into public.appointments (case_id, professional_id, scheduled_at, notes)
  values (p_case_id, auth.uid(), p_scheduled_at, nullif(btrim(p_notes), ''))
  returning id into v_appointment_id;

  update public.cases
  set status = 'scheduled'
  where id = p_case_id;

  return v_appointment_id;
end;
$$;

revoke execute on function public.update_case_status(uuid, text) from public, anon;
revoke execute on function public.set_professional_note(uuid, text) from public, anon;
revoke execute on function public.schedule_case_appointment(uuid, timestamptz, text) from public, anon;
grant execute on function public.update_case_status(uuid, text) to authenticated;
grant execute on function public.set_professional_note(uuid, text) to authenticated;
grant execute on function public.schedule_case_appointment(uuid, timestamptz, text) to authenticated;

commit;
