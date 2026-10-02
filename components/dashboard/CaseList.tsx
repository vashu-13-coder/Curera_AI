import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { CaseWithConsent } from "@/types/app"
import type { Urgency } from "@/types"

function urgencyLabel(u: Urgency): string {
  return u === "urgent" ? "Urgent" : u === "soon" ? "Soon" : "Routine"
}

function urgencyVariant(
  u: Urgency
): "default" | "secondary" | "destructive" | "outline" {
  return u === "urgent" ? "destructive" : u === "soon" ? "default" : "secondary"
}

export default function CaseList({ cases }: { cases: CaseWithConsent[] }) {
  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <p className="font-medium">No saved cases yet</p>
          <p className="text-sm text-muted-foreground">
            Start a new one in the{" "}
            <Link href="/assistant" className="underline">assistant</Link>.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className="space-y-3">
      {cases.map((c) => (
        <li key={c.id}>
          <Link
            href={`/dashboard/${c.id}`}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.summary.concern}</span>
                  <Badge variant={urgencyVariant(c.urgency)}>{urgencyLabel(c.urgency)}</Badge>
                  <Badge variant="outline">
                    {c.status === "reviewed" ? "Reviewed" : "New"}
                  </Badge>
                  <Badge variant="outline">
                    {c.consent ? "Shared" : "Not shared"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}