import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { CaseSummary, CaseStatus, Urgency } from "@/types"

interface CaseItem {
  id: string
  summary: CaseSummary
  urgency: Urgency
  status: CaseStatus
  created_at: string
}

const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  info_requested: "Info requested",
  scheduled: "Scheduled",
  closed: "Closed",
}

export default function CaseQueue({ cases }: { cases: CaseItem[] }) {
  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No cases are currently shared with you.
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className="space-y-3">
      {cases.map((c) => (
        <li key={c.id}>
          <Link
            href={`/professional/${c.id}`}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.summary.concern}</span>
                  <Badge
                    variant={
                      c.urgency === "urgent"
                        ? "destructive"
                        : c.urgency === "soon"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {c.urgency === "urgent"
                      ? "Urgent"
                      : c.urgency === "soon"
                        ? "Soon"
                        : "Routine"}
                  </Badge>
                  <Badge variant="outline">{STATUS_LABEL[c.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Shared {new Date(c.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}