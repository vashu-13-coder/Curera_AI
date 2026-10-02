export type UserRole = "patient" | "professional"

export type Urgency = "routine" | "soon" | "urgent"

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