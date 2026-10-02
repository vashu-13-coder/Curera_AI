import { z } from "zod"

export const caseSummarySchema = z.object({
  concern: z.string().min(1),
  duration: z.string(),
  symptoms: z.array(z.string()),
  severityReported: z.string(),
  relevantHistory: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  patientOwnWords: z.string().min(1),
  urgency: z.enum(["routine", "soon", "urgent"]),
  suggestedProfessionalType: z.string().min(1),
})

export type CaseSummaryInput = z.infer<typeof caseSummarySchema>

export const summarizeRequestSchema = z.object({
  transcript: z
    .string()
    .min(5, "Transcript must be at least 5 characters.")
    .max(4000, "Transcript must be at most 4000 characters."),
})

export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>