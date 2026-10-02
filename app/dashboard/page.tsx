import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CaseList from "@/components/dashboard/CaseList"
import type { CaseStatus, CaseSummary, Urgency } from "@/types"
import type { CaseWithConsent, ConsentRow } from "@/types/app"

export const metadata = { title: "Dashboard — CURERA AI" }

interface RawCase {
  id: string
  patient_id: string
  summary: CaseSummary
  urgency: Urgency
  status: CaseStatus
  professional_note: string | null
  created_at: string
  consents: ConsentRow[] | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/dashboard")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "professional") redirect("/professional")

  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, patient_id, summary, urgency, status, professional_note, created_at, consents(id, case_id, share_summary, share_transcript, granted_at, revoked_at)"
    )
    .order("created_at", { ascending: false })

  const cases: CaseWithConsent[] = (
    error ? [] : ((data ?? []) as RawCase[])
  ).map((row) => {
    const active = row.consents?.find((c) => c.revoked_at === null) ?? null
    return {
      id: row.id,
      patient_id: row.patient_id,
      summary: row.summary,
      urgency: row.urgency,
      status: row.status,
      professional_note: row.professional_note,
      created_at: row.created_at,
      consent: active,
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Your dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cases you have saved. You can revoke sharing or delete any case at any time.
        </p>
      </header>
      <CaseList cases={cases} />
    </div>
  )
}