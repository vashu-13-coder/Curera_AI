export type UserRole = "patient" | "professional"

export type Urgency = "routine" | "soon" | "urgent"

export type CaseStatus =
  | "submitted"
  | "under_review"
  | "info_requested"
  | "scheduled"
  | "closed"

export type ProfessionalSettableStatus =
  | "under_review"
  | "info_requested"
  | "closed"

export interface CaseSummary {
  concern: string
  duration: string
  symptoms: string[]
  severityReported: string
  relevantHistory: string[]
  followUpQuestions: string[]
  patientOwnWords: string
  urgency: Urgency
  suggestedProfessionalType: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  specialty: string | null
  created_at: string
}

export interface Case {
  id: string
  patient_id: string
  transcript: string | null
  summary: CaseSummary | null
  urgency: Urgency
  status: CaseStatus
  created_at: string
}

// Returned by the get_consented_cases() RPC.
// transcript / summary are null when not listed in the consent's shared_fields.
export interface ConsentedCase {
  id: string
  patient_id: string
  transcript: string | null
  summary: CaseSummary | null
  urgency: Urgency
  status: CaseStatus
  created_at: string
  shared_fields: string[]
}

export interface CaseMessage {
  id: string
  case_id: string
  sender_id: string
  body: string
  created_at: string
}

export interface Consent {
  id: string
  case_id: string
  professional_id: string | null
  shared_fields: string[]
  granted_at: string
  revoked_at: string | null
}

export interface Appointment {
  id: string
  case_id: string
  professional_id: string
  scheduled_at: string
  notes: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  actor_id: string
  action: string
  case_id: string | null
  created_at: string
}
export type EmergencyCategory =
  | "cardiac"
  | "breathing"
  | "bleeding"
  | "stroke"
  | "unconscious_seizure"
  | "poisoning"
  | "self_harm"

export interface EmergencyDetection {
  isEmergency: boolean
  category: EmergencyCategory | null
  matchedPhrase: string | null
}

export interface EmergencyResponse {
  title: string
  message: string
  actions: string[]
}