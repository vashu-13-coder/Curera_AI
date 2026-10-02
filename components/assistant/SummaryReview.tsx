import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CaseSummary, Urgency } from "@/types"

interface SummaryReviewProps {
  summary: CaseSummary
  disclaimer: string
  onBack: () => void
}

function urgencyLabel(u: Urgency): string {
  switch (u) {
    case "urgent":
      return "Urgent"
    case "soon":
      return "Soon"
    case "routine":
      return "Routine"
  }
}

function urgencyVariant(
  u: Urgency
): "default" | "secondary" | "destructive" | "outline" {
  switch (u) {
    case "urgent":
      return "destructive"
    case "soon":
      return "default"
    case "routine":
      return "secondary"
  }
}

export default function SummaryReview({
  summary,
  disclaimer,
  onBack,
}: SummaryReviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl">Structured case summary</CardTitle>
          <Badge variant={urgencyVariant(summary.urgency)}>
            Urgency: {urgencyLabel(summary.urgency)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        <Section label="Concern">{summary.concern}</Section>
        <Section label="Duration">{summary.duration}</Section>

        <Section label="Symptoms">
          {summary.symptoms.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {summary.symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">None reported</span>
          )}
        </Section>

        <Section label="Severity (as reported)">
          {summary.severityReported}
        </Section>

        <Section label="Relevant history">
          {summary.relevantHistory.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {summary.relevantHistory.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">None reported</span>
          )}
        </Section>

        <Section label="Follow-up questions">
          {summary.followUpQuestions.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {summary.followUpQuestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </Section>

        <Section label="In your own words">
          <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
            “{summary.patientOwnWords}”
          </blockquote>
        </Section>

        <Section label="Suggested professional type">
          {summary.suggestedProfessionalType}
        </Section>

        {disclaimer && (
          <p
            role="note"
            className="rounded-md border border-yellow-500/50 bg-yellow-50 p-3 text-xs text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-100"
          >
            {disclaimer}
          </p>
        )}

        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden />
          Edit my text and try again
        </Button>
      </CardContent>
    </Card>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}