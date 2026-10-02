-- =============================================================================
-- CURERA AI — DEMO SEED DATA
-- ⚠️  DEMO ONLY. DO NOT USE IN PRODUCTION.
--
-- Prerequisite:
--   Create these three users in Supabase Dashboard → Authentication → Users
--   → "Add user" with **Auto Confirm User** ticked:
--
--     patient@demo.cureera.ai      (patient)
--     dr.sharma@demo.cureera.ai    (professional)
--     dr.verma@demo.cureera.ai     (professional)
--
--   The script looks up their UUIDs by email and raises a clear exception
--   if any is missing. It is idempotent and can be re-run safely.
-- =============================================================================

do $$
declare
  v_patient_id uuid;
  v_sharma_id  uuid;
  v_verma_id   uuid;
  v_case_1     uuid;
  v_case_2     uuid;
  v_case_3     uuid;
begin
  -- ---------------------------------------------------------------------------
  -- Look up demo users
  -- ---------------------------------------------------------------------------
  select id into v_patient_id from auth.users where email = 'patient@demo.cureera.ai';
  select id into v_sharma_id  from auth.users where email = 'dr.sharma@demo.cureera.ai';
  select id into v_verma_id   from auth.users where email = 'dr.verma@demo.cureera.ai';

  if v_patient_id is null then
    raise exception 'Demo patient user (patient@demo.cureera.ai) not found in auth.users. Create it first (Auto Confirm User).';
  end if;
  if v_sharma_id is null then
    raise exception 'Demo professional (dr.sharma@demo.cureera.ai) not found in auth.users. Create it first (Auto Confirm User).';
  end if;
  if v_verma_id is null then
    raise exception 'Demo professional (dr.verma@demo.cureera.ai) not found in auth.users. Create it first (Auto Confirm User).';
  end if;

  -- ---------------------------------------------------------------------------
  -- Profiles (upsert; role changes allowed because auth.uid() is null here)
  -- ---------------------------------------------------------------------------
  insert into public.profiles (id, role, full_name, specialty)
  values (v_patient_id, 'patient', 'Demo Patient', null)
  on conflict (id) do update
    set role = excluded.role,
        full_name = excluded.full_name,
        specialty = excluded.specialty;

  insert into public.profiles (id, role, full_name, specialty)
  values (v_sharma_id, 'professional', 'Dr. Ananya Sharma', 'General Physician')
  on conflict (id) do update
    set role = excluded.role,
        full_name = excluded.full_name,
        specialty = excluded.specialty;

  insert into public.profiles (id, role, full_name, specialty)
  values (v_verma_id, 'professional', 'Dr. Rajesh Verma', 'Cardiologist')
  on conflict (id) do update
    set role = excluded.role,
        full_name = excluded.full_name,
        specialty = excluded.specialty;

  -- ---------------------------------------------------------------------------
  -- Cases
  -- ---------------------------------------------------------------------------
  select id into v_case_1 from public.cases
    where patient_id = v_patient_id
      and transcript like 'Demo: recurring headache%' limit 1;
  if v_case_1 is null then
    insert into public.cases (patient_id, transcript, summary, urgency, status)
    values (
      v_patient_id,
      'Demo: recurring headache for three days, worse in the evening, no fever.',
      jsonb_build_object(
        'concern', 'Recurring headache',
        'duration', '3 days',
        'symptoms', jsonb_build_array('headache', 'worse in evening'),
        'severityReported', 'mild',
        'relevantHistory', jsonb_build_array(),
        'followUpQuestions', jsonb_build_array('Any vision changes?', 'Any nausea?'),
        'patientOwnWords', 'Mild headache for three days.',
        'urgency', 'routine',
        'suggestedProfessionalType', 'General Physician'
      ),
      'routine',
      'submitted'
    )
    returning id into v_case_1;
  end if;

  select id into v_case_2 from public.cases
    where patient_id = v_patient_id
      and transcript like 'Demo: sharp chest pain%' limit 1;
  if v_case_2 is null then
    insert into public.cases (patient_id, transcript, summary, urgency, status)
    values (
      v_patient_id,
      'Demo: sharp chest pain when breathing deeply since this morning.',
      jsonb_build_object(
        'concern', 'Chest pain on deep breathing',
        'duration', 'since this morning',
        'symptoms', jsonb_build_array('sharp chest pain', 'pain on deep breath'),
        'severityReported', 'moderate',
        'relevantHistory', jsonb_build_array(),
        'followUpQuestions', jsonb_build_array('Any shortness of breath?', 'Any recent injury?'),
        'patientOwnWords', 'Sharp chest pain when breathing deeply.',
        'urgency', 'soon',
        'suggestedProfessionalType', 'Cardiologist'
      ),
      'soon',
      'under_review'
    )
    returning id into v_case_2;
  end if;

  select id into v_case_3 from public.cases
    where patient_id = v_patient_id
      and transcript like 'Demo: mild rash%' limit 1;
  if v_case_3 is null then
    insert into public.cases (patient_id, transcript, summary, urgency, status)
    values (
      v_patient_id,
      'Demo: mild rash on arms for two days, no itching, no fever.',
      jsonb_build_object(
        'concern', 'Mild rash on arms',
        'duration', '2 days',
        'symptoms', jsonb_build_array('rash', 'no itching', 'no fever'),
        'severityReported', 'mild',
        'relevantHistory', jsonb_build_array(),
        'followUpQuestions', jsonb_build_array('Any new food or medication?', 'Any spread?'),
        'patientOwnWords', 'Mild rash on arms for two days.',
        'urgency', 'routine',
        'suggestedProfessionalType', 'Pediatrician'
      ),
      'routine',
      'closed'
    )
    returning id into v_case_3;
  end if;

  -- ---------------------------------------------------------------------------
  -- Consents
  -- ---------------------------------------------------------------------------
  if not exists (
    select 1 from public.consents
    where case_id = v_case_1
      and professional_id = v_sharma_id
      and revoked_at is null
  ) then
    insert into public.consents (case_id, professional_id, shared_fields, granted_at, revoked_at)
    values (v_case_1, v_sharma_id, '["summary","transcript"]'::jsonb, now(), null);
  end if;

  -- Consent on case 2 shares only "summary" → transcript must come back NULL.
  if not exists (
    select 1 from public.consents
    where case_id = v_case_2
      and professional_id = v_verma_id
      and revoked_at is null
  ) then
    insert into public.consents (case_id, professional_id, shared_fields, granted_at, revoked_at)
    values (v_case_2, v_verma_id, '["summary"]'::jsonb, now(), null);
  end if;

  -- Revoked consent example (case 3).
  if not exists (
    select 1 from public.consents
    where case_id = v_case_3
      and professional_id = v_sharma_id
  ) then
    insert into public.consents (case_id, professional_id, shared_fields, granted_at, revoked_at)
    values (
      v_case_3,
      v_sharma_id,
      '["summary"]'::jsonb,
      now() - interval '5 days',
      now() - interval '1 day'
    );
  end if;

  -- ---------------------------------------------------------------------------
  -- Appointment
  -- ---------------------------------------------------------------------------
  if not exists (
    select 1 from public.appointments
    where case_id = v_case_1
      and professional_id = v_sharma_id
  ) then
    insert into public.appointments (case_id, professional_id, scheduled_at, notes)
    values (v_case_1, v_sharma_id, now() + interval '2 days', 'Review headache pattern.');
  end if;

  -- ---------------------------------------------------------------------------
  -- Audit entry (audit_log has no SELECT policy; inserts only).
  -- ---------------------------------------------------------------------------
  if not exists (
    select 1 from public.audit_log
    where actor_id = v_patient_id
      and action = 'case_created'
      and case_id = v_case_1
  ) then
    insert into public.audit_log (actor_id, action, case_id)
    values (v_patient_id, 'case_created', v_case_1);
  end if;
end $$;