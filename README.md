# OrthoDoc AI

This application is now wired for a Supabase-backed production architecture instead of local mock state.

## Stack

- React 18 + Vite + TypeScript
- TanStack Query for server state
- Supabase Auth for signup, login, and session persistence
- Supabase Postgres for relational data
- Supabase Storage for private case images
- Supabase Edge Functions for privileged workflows:
  - `process-case-analysis`
  - `upsert-patient-link`

## Domain Model

- `profiles`: doctor and patient identities synced from `auth.users`
- `doctor_patient_links`: active/inactive doctor-patient relationships
- `appointments`: scheduled, completed, and cancelled visits
- `case_records`: uploaded image cases and processing state
- `analysis_runs`: AI outputs, metrics, failures, and partial responses
- `brace_options`: seeded treatment options
- `brace_preferences`: saved per-case brace selections

The schema, constraints, indexes, RLS policies, and storage policies live in [supabase/migrations/20260422_initial_schema.sql](/C:/Users/spark/Desktop/ortho_doc/supabase/migrations/20260422_initial_schema.sql).

## Environment

Frontend app values live in [.env](/C:/Users/spark/Desktop/ortho_doc/.env):

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_SUPABASE_ANALYSIS_FUNCTION=process-case-analysis
```

Edge Function custom secrets live in [supabase/.env.functions](/C:/Users/spark/Desktop/ortho_doc/supabase/.env.functions):

```bash
CUSTOM_MODEL_URL=https://your-ngrok-url/your-endpoint
CUSTOM_MODEL_API_KEY=
```

Important:

- `Deno.env.get("SUPABASE_URL")`
- `Deno.env.get("SUPABASE_ANON_KEY")`
- `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`

are provided automatically by hosted Supabase Edge Functions. Do not add `SUPABASE_*` names to `supabase/.env.functions`.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL migration from `supabase/migrations/20260422_initial_schema.sql`.
3. Upload the custom function secrets:

```bash
pnpm dlx supabase secrets set --env-file supabase/.env.functions
```

4. Deploy the Edge Functions in `supabase/functions/process-case-analysis` and `supabase/functions/upsert-patient-link`.
5. Put the frontend `VITE_...` values into your local `.env`.

## App Flows

- Auth pages use Supabase Auth directly.
- Doctor dashboards, patients, appointments, and uploads read/write live Supabase data.
- Patient dashboards, cases, uploads, and customization screens are database-driven.
- Image uploads go to private Storage, then the case id is sent to `process-case-analysis`.
- The Edge Function downloads the image securely, sends it to your custom model endpoint, stores the structured result in `analysis_runs`, updates `case_records`, and upserts a brace recommendation.

## Local Development

```bash
npm install
npm run dev
```

## Verification Notes

This workspace does not currently have installed dependencies or a local TypeScript toolchain, so `npm install`, `npm run build`, and `npm run lint` were not runnable here. Run them after adding the Supabase keys and installing dependencies.
