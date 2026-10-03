import type { CaseStatus } from "@/types"

const caseStatusLabels: Record<CaseStatus, string> = {
  new: "Submitted",
  reviewed: "Under review",
  info_requested: "More information requested",
  scheduled: "Appointment scheduled",
  closed: "Closed",
};

export function getCaseStatusLabel(status: CaseStatus): string {
  return caseStatusLabels[status]
}

export function isAppointmentInFuture(
  scheduledAt: string,
  now = Date.now()
): boolean {
  const timestamp = Date.parse(scheduledAt)
  return Number.isFinite(timestamp) && timestamp > now
}
