create policy "analysis_runs_insert_authorized"
on public.analysis_runs
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and public.can_access_case(case_id)
);
