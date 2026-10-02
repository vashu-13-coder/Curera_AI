import { z } from "zod"

export const caseIdSchema = z.string().uuid()

export const caseMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export const caseAppointmentSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).refine(
    (scheduledAt) => Date.parse(scheduledAt) > Date.now(),
    "Appointment time must be in the future."
  ),
  notes: z.string().trim().max(2000).optional(),
})

export const caseStatusUpdateSchema = z
  .object({
    status: z.enum(["under_review", "info_requested", "closed"]).optional(),
    professionalNote: z.string().max(2000).nullable().optional(),
  })
  .refine(
    ({ status, professionalNote }) =>
      (status === undefined) !== (professionalNote === undefined),
    "Provide either a status or a professional note."
  )

export type CaseMessageInput = z.infer<typeof caseMessageSchema>
export type CaseAppointmentInput = z.infer<typeof caseAppointmentSchema>
