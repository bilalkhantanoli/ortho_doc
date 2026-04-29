create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.user_role as enum ('doctor', 'patient');
create type public.relationship_status as enum ('active', 'inactive');
create type public.case_status as enum ('uploading', 'processing', 'analyzed', 'approved', 'failed');
create type public.analysis_status as enum ('queued', 'processing', 'completed', 'partial', 'failed', 'rate_limited');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled');
create type public.appointment_type as enum ('consultation', 'follow_up', 'check_up', 'treatment', 'emergency');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  role public.user_role not null,
  age integer check (age is null or age between 1 and 120),
  phone text,
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.doctor_patient_links (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  relationship_status public.relationship_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint doctor_patient_links_unique unique (doctor_id, patient_id),
  constraint doctor_patient_links_distinct check (doctor_id <> patient_id)
);

create table public.brace_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  default_color_hex text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.case_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status public.case_status not null default 'uploading',
  image_bucket text not null default 'case-images',
  image_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  error_message text,
  latest_analysis_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.case_records(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status public.analysis_status not null default 'queued',
  provider text,
  model_name text,
  summary text,
  notes text,
  metrics jsonb,
  raw_response jsonb,
  failure_reason text,
  recommended_brace_option_id uuid references public.brace_options(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.case_records
  add constraint case_records_latest_analysis_fkey
  foreign key (latest_analysis_id)
  references public.analysis_runs(id)
  on delete set null;

create table public.brace_preferences (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.case_records(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  selected_by uuid not null references public.profiles(id) on delete cascade,
  brace_option_id uuid not null references public.brace_options(id) on delete restrict,
  color_hex text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 240),
  appointment_type public.appointment_type not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index profiles_role_idx on public.profiles(role);
create index doctor_patient_links_doctor_idx on public.doctor_patient_links(doctor_id, relationship_status);
create index doctor_patient_links_patient_idx on public.doctor_patient_links(patient_id, relationship_status);
create index case_records_patient_idx on public.case_records(patient_id, status, created_at desc);
create index case_records_doctor_idx on public.case_records(doctor_id, status, created_at desc);
create index analysis_runs_case_idx on public.analysis_runs(case_id, created_at desc);
create index appointments_doctor_idx on public.appointments(doctor_id, scheduled_at desc);
create index appointments_patient_idx on public.appointments(patient_id, scheduled_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger doctor_patient_links_set_updated_at
before update on public.doctor_patient_links
for each row execute function public.set_updated_at();

create trigger case_records_set_updated_at
before update on public.case_records
for each row execute function public.set_updated_at();

create trigger analysis_runs_set_updated_at
before update on public.analysis_runs
for each row execute function public.set_updated_at();

create trigger brace_preferences_set_updated_at
before update on public.brace_preferences
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'patient')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.ensure_case_relationship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.doctor_id is not null then
    insert into public.doctor_patient_links (doctor_id, patient_id, relationship_status)
    values (new.doctor_id, new.patient_id, 'active')
    on conflict (doctor_id, patient_id) do update
    set relationship_status = 'active',
        updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger case_records_ensure_relationship
after insert on public.case_records
for each row execute function public.ensure_case_relationship();

create or replace function public.current_profile_role()
returns text
language sql
stable
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_doctor_for_patient(p_doctor uuid, p_patient uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.doctor_patient_links
    where doctor_id = p_doctor
      and patient_id = p_patient
      and relationship_status = 'active'
  );
$$;

create or replace function public.profile_has_role(p_profile_id uuid, p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and role = p_role
  );
$$;

create or replace function public.can_access_case(p_case_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.case_records c
    where c.id = p_case_id
      and (
        c.patient_id = auth.uid()
        or c.uploaded_by = auth.uid()
        or c.doctor_id = auth.uid()
        or public.is_doctor_for_patient(auth.uid(), c.patient_id)
      )
  );
$$;

create or replace function public.get_dashboard_metrics(target_role text)
returns jsonb
language plpgsql
stable
as $$
declare
  result jsonb;
begin
  if target_role = 'doctor' then
    select jsonb_build_object(
      'totalPatients', (
        select count(*) from public.doctor_patient_links where doctor_id = auth.uid() and relationship_status = 'active'
      ),
      'activeCases', (
        select count(*) from public.case_records where doctor_id = auth.uid() and status <> 'approved'
      ),
      'scheduledAppointments', (
        select count(*) from public.appointments where doctor_id = auth.uid() and status = 'scheduled'
      )
    ) into result;
  else
    select jsonb_build_object(
      'openCases', (
        select count(*) from public.case_records where patient_id = auth.uid() and status <> 'approved'
      ),
      'scheduledAppointments', (
        select count(*) from public.appointments where patient_id = auth.uid() and status = 'scheduled'
      )
    ) into result;
  end if;

  return coalesce(result, '{}'::jsonb);
end;
$$;

create view public.case_details
with (security_invoker = true) as
select
  c.id as case_id,
  c.title,
  c.status as case_status,
  c.patient_id,
  patient.full_name as patient_name,
  c.doctor_id,
  doctor.full_name as doctor_name,
  c.image_bucket,
  c.image_path,
  c.uploaded_by,
  c.created_at as case_created_at,
  c.updated_at,
  a.id as analysis_id,
  a.status as analysis_status,
  a.summary as analysis_summary,
  a.notes as analysis_notes,
  a.metrics as analysis_metrics,
  a.failure_reason as analysis_failure_reason,
  a.completed_at as analysis_completed_at,
  b.color_hex as brace_color_hex,
  bo.code as brace_option_code,
  bo.name as brace_option_name
from public.case_records c
join public.profiles patient on patient.id = c.patient_id
left join public.profiles doctor on doctor.id = c.doctor_id
left join public.analysis_runs a on a.id = c.latest_analysis_id
left join public.brace_preferences b on b.case_id = c.id
left join public.brace_options bo on bo.id = b.brace_option_id;

insert into public.brace_options (code, name, description, default_color_hex)
values
  ('metal', 'Metal Braces', 'Traditional and reliable', '#C0C0C0'),
  ('ceramic', 'Ceramic Braces', 'Tooth-colored, less visible', '#F5F5DC'),
  ('clear', 'Clear Aligners', 'Nearly invisible and removable', '#3B82F6'),
  ('lingual', 'Lingual Braces', 'Placed behind the teeth', '#D4AF37')
on conflict (code) do nothing;

alter table public.profiles enable row level security;
alter table public.doctor_patient_links enable row level security;
alter table public.case_records enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.brace_options enable row level security;
alter table public.brace_preferences enable row level security;
alter table public.appointments enable row level security;

create policy "profiles_select_self_linked_or_doctors"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or role = 'doctor'
  or exists (
    select 1
    from public.doctor_patient_links dpl
    where (
      (dpl.doctor_id = auth.uid() and dpl.patient_id = profiles.id)
      or (dpl.patient_id = auth.uid() and dpl.doctor_id = profiles.id)
    )
  )
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "doctor_patient_links_read_participants"
on public.doctor_patient_links
for select
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid());

create policy "doctor_patient_links_manage_doctor"
on public.doctor_patient_links
for all
to authenticated
using (doctor_id = auth.uid())
with check (
  doctor_id = auth.uid()
  and public.profile_has_role(doctor_id, 'doctor')
  and public.profile_has_role(patient_id, 'patient')
);

create policy "appointments_read_participants"
on public.appointments
for select
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid());

create policy "appointments_insert_participants"
on public.appointments
for insert
to authenticated
with check (
  (
    created_by = auth.uid()
    and doctor_id = auth.uid()
    and public.is_doctor_for_patient(doctor_id, patient_id)
  )
  or (
    created_by = auth.uid()
    and patient_id = auth.uid()
    and public.is_doctor_for_patient(doctor_id, patient_id)
  )
);

create policy "appointments_update_participants"
on public.appointments
for update
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid())
with check (doctor_id = auth.uid() or patient_id = auth.uid());

create policy "case_records_read_authorized"
on public.case_records
for select
to authenticated
using (
  patient_id = auth.uid()
  or uploaded_by = auth.uid()
  or doctor_id = auth.uid()
  or public.is_doctor_for_patient(auth.uid(), patient_id)
);

create policy "case_records_insert_authorized"
on public.case_records
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    (
      patient_id = auth.uid()
      and (
        doctor_id is null
        or exists (select 1 from public.profiles p where p.id = doctor_id and p.role = 'doctor')
      )
    )
    or (doctor_id = auth.uid() and public.is_doctor_for_patient(doctor_id, patient_id))
  )
);

create policy "case_records_update_authorized"
on public.case_records
for update
to authenticated
using (
  patient_id = auth.uid()
  or uploaded_by = auth.uid()
  or doctor_id = auth.uid()
)
with check (
  patient_id = auth.uid()
  or uploaded_by = auth.uid()
  or doctor_id = auth.uid()
);

create policy "case_records_delete_authorized"
on public.case_records
for delete
to authenticated
using (
  patient_id = auth.uid()
  or uploaded_by = auth.uid()
  or doctor_id = auth.uid()
);

create policy "analysis_runs_select_authorized"
on public.analysis_runs
for select
to authenticated
using (public.can_access_case(case_id));

create policy "analysis_runs_service_manage"
on public.analysis_runs
for all
to service_role
using (true)
with check (true);

create policy "brace_options_select_authenticated"
on public.brace_options
for select
to authenticated
using (true);

create policy "brace_preferences_select_authorized"
on public.brace_preferences
for select
to authenticated
using (public.can_access_case(case_id));

create policy "brace_preferences_manage_authorized"
on public.brace_preferences
for all
to authenticated
using (
  patient_id = auth.uid()
  or selected_by = auth.uid()
  or public.is_doctor_for_patient(auth.uid(), patient_id)
)
with check (
  patient_id = auth.uid()
  or selected_by = auth.uid()
  or public.is_doctor_for_patient(auth.uid(), patient_id)
);

insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', false)
on conflict (id) do nothing;

create policy "case_images_insert_own_prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'case-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "case_images_select_authorized"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'case-images'
  and exists (
    select 1
    from public.case_records c
    where c.image_path = name
      and (
        c.patient_id = auth.uid()
        or c.uploaded_by = auth.uid()
        or c.doctor_id = auth.uid()
        or public.is_doctor_for_patient(auth.uid(), c.patient_id)
      )
  )
);

create policy "case_images_delete_authorized"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'case-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.case_records c
      where c.image_path = name
        and (
          c.patient_id = auth.uid()
          or c.uploaded_by = auth.uid()
          or c.doctor_id = auth.uid()
        )
    )
  )
);
