import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CaseQueue from "@/components/professional/CaseQueue"
import type { CaseSummary, Urgency } from "@/types"

export const metadata = { title: "Professional queue — CURERA AI" }

interface RawCase {
  id: string
  summary: CaseSummary
  urgency: Urgency
  status: "new" | "reviewed"
  created_at: string
}

export default async function ProfessionalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/professional")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "professional") redirect("/dashboard")

  // RLS restricts this to cases with an active consent.
  const { data } = await supabase
    .from("cases")
    .select("id, summary, urgency, status, created_at")
    .order("created_at", { ascending: false })

  const cases = (data ?? []) as RawCase[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Cases shared with you</h1>
        <p className="text-sm text-muted-foreground">
          Cases where the patient has an active consent. Access ends immediately if
          the patient revokes.
        </p>
      </header>
      <CaseQueue cases={cases} />
    </div>
  )
}