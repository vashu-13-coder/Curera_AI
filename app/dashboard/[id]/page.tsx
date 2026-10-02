import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RevokeConsentButton from "@/components/dashboard/RevokeConsentButton"
import DeleteCaseButton from "@/components/dashboard/DeleteCaseButton"
import { createClient } from "@/lib/supabase/server"
import type { CaseSummary, Urgency } from "@/types"
import type { ConsentRow } from "@/types/app"

interface Params {
  params: Promise<{ id: string }>
}

export default async function CaseDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/dashboard/${id}`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "professional") redirect("/professional")

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, patient_id, summary, urgency, status, professional_note, created_at")
    .eq("id", id)
    .single()

  if (!caseRow) notFound()

  const { data: consents } = await supabase
    .from("consents")
    .select("id, case_id, share_summary, share_transcript, granted_at, revoked_at")
    .eq("case_id", id)
    .order("granted_at", { ascending: false })

  const activeConsent: ConsentRow | null =
    (consents ?? []).find((c) => c.revoked_at === null) ?? null

  const summary = caseRow.summary as CaseSummary
  const urgency = caseRow.urgency as Urgency

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
        <DeleteCaseButton caseId={caseRow.id} />
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{summary.concern}</h1>
          <Badge
            variant={
              urgency === "urgent" ? "destructive"
                : urgency === "soon" ? "default" : "secondary"
            }
          >
            {urgency === "urgent" ? "Urgent" : urgency === "soon" ? "Soon" : "Routine"}
          </Badge>
          <Badge variant="outline">
            {caseRow.status === "reviewed" ? "Reviewed" : "New"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Saved {new Date(caseRow.created_at).toLocaleString()}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Row label="Duration">{summary.duration}</Row>
          <Row label="Symptoms">
            {summary.symptoms.length ? (
              <ul className="list-disc pl-5">
                {summary.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            ) : <span className="text-muted-foreground">None reported</span>}
          </Row>
          <Row label="Severity (as reported)">{summary.severityReported}</Row>
          <Row label="Relevant history">
            {summary.relevantHistory.length ? (
              <ul className="list-disc pl-5">
                {summary.relevantHistory.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            ) : <span className="text-muted-foreground">None reported</span>}
          </Row>
          <Row label="Follow-up questions">
            {summary.followUpQuestions.length ? (
              <ul className="list-disc pl-5">
                {summary.followUpQuestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            ) : <span className="text-muted-foreground">None</span>}
          </Row>
          <Row label="In your own words">
            <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
              “{summary.patientOwnWords}”
            </blockquote>
          </Row>
          <Row label="Suggested professional type">{summary.suggestedProfessionalType}</Row>
          {caseRow.professional_note && (
            <Row label="Professional note">{caseRow.professional_note}</Row>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeConsent ? (
            <>
              <p>
                Shared with professionals. Summary:{" "}
                <strong>{activeConsent.share_summary ? "yes" : "no"}</strong>.
                Full transcript:{" "}
                <strong>{activeConsent.share_transcript ? "yes" : "no"}</strong>.
              </p>
              <RevokeConsentButton caseId={caseRow.id} consentId={activeConsent.id} />
            </>
          ) : (
            <p className="text-muted-foreground">
              Not currently shared with any professional.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  )
}