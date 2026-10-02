import Link from "next/link"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReviewForm from "@/components/professional/ReviewForm"
import { createClient } from "@/lib/supabase/server"
import type { CaseSummary, Urgency } from "@/types"

interface Params {
  params: Promise<{ id: string }>
}

export default async function ProfessionalCasePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/professional/${id}`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "professional") redirect("/dashboard")

  // RLS: returns a row ONLY while an active consent exists.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, summary, urgency, status, professional_note, created_at")
    .eq("id", id)
    .maybeSingle()

  if (!caseRow) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href="/professional"
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          ← Back to queue
        </Link>
        <Alert variant="destructive" role="alert">
          <AlertTitle>Access was withdrawn</AlertTitle>
          <AlertDescription>
            The patient has revoked consent for this case, or it no longer exists.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Transcript only appears if the active consent shares it.
  const { data: transcriptRow } = await supabase
    .from("case_transcripts")
    .select("transcript")
    .eq("case_id", id)
    .maybeSingle()

  const summary = caseRow.summary as CaseSummary
  const urgency = caseRow.urgency as Urgency

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/professional"
        className="text-sm underline text-muted-foreground hover:text-foreground"
      >
        ← Back to queue
      </Link>

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
      </header>

      <Alert role="note">
        <AlertTitle>Medical disclaimer</AlertTitle>
        <AlertDescription>
          AI-organized from the patient&apos;s own words. Not a diagnosis.
          Clinical judgement remains with you.
        </AlertDescription>
      </Alert>

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
          <Row label="In the patient's own words">
            <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
              “{summary.patientOwnWords}”
            </blockquote>
          </Row>
          <Row label="Suggested professional type">{summary.suggestedProfessionalType}</Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {transcriptRow ? (
            <p className="whitespace-pre-wrap">{transcriptRow.transcript as string}</p>
          ) : (
            <p className="text-muted-foreground">
              The patient did not share the full transcript for this case.
            </p>
          )}
        </CardContent>
      </Card>

      <ReviewForm
        caseId={caseRow.id}
        initialNote={caseRow.professional_note ?? ""}
        initialReviewed={caseRow.status === "reviewed"}
      />
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