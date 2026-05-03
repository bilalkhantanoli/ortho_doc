create or replace function public.get_doctor_booked_slots(p_doctor uuid, p_day date)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(to_char(a.scheduled_at, 'HH24:MI') order by a.scheduled_at),
    array[]::text[]
  )
  from public.appointments a
  where a.doctor_id = p_doctor
    and a.status = 'scheduled'
    and a.scheduled_at::date = p_day
    and (
      auth.uid() = p_doctor
      or exists (
        select 1
        from public.doctor_patient_links dpl
        where dpl.doctor_id = p_doctor
          and dpl.patient_id = auth.uid()
          and dpl.relationship_status = 'active'
      )
    );
$$;
