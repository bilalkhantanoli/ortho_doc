create unique index if not exists appointments_doctor_slot_unique
on public.appointments (doctor_id, scheduled_at)
where status = 'scheduled';
