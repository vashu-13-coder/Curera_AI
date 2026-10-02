import type { CaseSummary, Urgency } from "@/types"

export interface CaseRow {
  id: string
  patient_id: string
  summary: CaseSummary
  urgency: Urgency
  status: "new" | "reviewed"
  professional_note: string | null
  created_at: string
}

export interface ConsentRow {
  id: string
  case_id: string
  share_summary: boolean
  share_transcript: boolean
  granted_at: string
  revoked_at: string | null
}

export interface CaseWithConsent extends CaseRow {
  consent: ConsentRow | null
}

export interface NavUser {
  email: string | null
  fullName: string | null
  role: "patient" | "professional" | null
}