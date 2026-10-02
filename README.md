# CURERA AI

**Healthcare That Listens Before It Routes**

CURERA AI helps patients organize their own words into a case summary and share
it with a healthcare professional. Professionals can update a case status,
request more information, exchange messages, and schedule an appointment.

CURERA AI is not an AI doctor. It does not diagnose, prescribe, or make
clinical decisions. The summary is a communication aid, not a substitute for
professional judgement or emergency care.

## Technology

- Next.js 15 App Router and React 19
- TypeScript
- Supabase Auth and Postgres with row-level security
- Tailwind CSS and local UI components
- Vitest and ESLint

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `LLM_API_KEY`
   - `LLM_MODEL` (optional; defaults to the model configured by the app)

   `NEXT_PUBLIC_*` values are browser-visible. Never put a service-role key in
   a `NEXT_PUBLIC_*` variable or in client-side code.

3. In the Supabase SQL Editor, apply
   [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql)
   followed by
   [`supabase/migrations/002_followup.sql`](./supabase/migrations/002_followup.sql).
   The second migration adds case messages and appointments, updates case
   statuses, and installs the RPCs used by the professional workflow.

4. Start the development server:

   ```bash
   pnpm dev
   ```

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```

## Database and access notes

- Patients can read, revoke sharing for, or delete their own cases.
- Professionals can view cases only while consent is active. Transcript access
  follows the transcript-sharing choice; status changes and professional notes
  go through database RPCs.
- Messages and appointments are scoped to the case and are removed when the
  case is deleted.
- A server-only admin helper exists in `lib/supabase/admin.ts`. It is not
  required for the patient/professional flows described above. Do not expose a
  Supabase service-role key to the browser.

## Deployment

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`LLM_API_KEY`, and `LLM_MODEL` in the hosting provider's server environment.
Configure the deployed domain in Supabase Authentication URL settings. Do not
add a service-role key to client-visible environment variables.
