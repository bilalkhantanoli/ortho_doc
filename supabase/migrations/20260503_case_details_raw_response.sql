create or replace view public.case_details
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
  bo.name as brace_option_name,
  a.raw_response as analysis_raw_response
from public.case_records c
join public.profiles patient on patient.id = c.patient_id
left join public.profiles doctor on doctor.id = c.doctor_id
left join public.analysis_runs a on a.id = c.latest_analysis_id
left join public.brace_preferences b on b.case_id = c.id
left join public.brace_options bo on bo.id = b.brace_option_id;
