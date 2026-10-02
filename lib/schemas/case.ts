import { z } from "zod"
import { caseSummarySchema } from "@/lib/schemas/case-summary"

export const caseCreateSchema = z.object({
  summary: caseSummarySchema,
  urgency: z.enum(["routine", "soon", "urgent"]),
  transcript: z.string().max(4000).optional(),
  shareTranscript: z.boolean(),
  // Belt-and-braces: emergencies never reach this endpoint.
  emergency: z.literal(false).optional(),
})

export type CaseCreateInput = z.infer<typeof caseCreateSchema>