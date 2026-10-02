import { describe, it, expect } from "vitest"
import { caseCreateSchema } from "@/lib/schemas/case"

const summary = {
  concern: "Headache",
  duration: "3 days",
  symptoms: ["headache"],
  severityReported: "mild",
  relevantHistory: [],
  followUpQuestions: ["Any vision changes?"],
  patientOwnWords: "Mild headache for three days.",
  urgency: "routine" as const,
  suggestedProfessionalType: "General physician",
}

describe("caseCreateSchema", () => {
  it("accepts a minimal valid payload", () => {
    const r = caseCreateSchema.safeParse({
      summary, urgency: "routine", shareTranscript: false,
    })
    expect(r.success).toBe(true)
  })

  it("accepts a transcript when shareTranscript is true", () => {
    const r = caseCreateSchema.safeParse({
      summary, urgency: "routine", shareTranscript: true,
      transcript: "Mild headache for three days.",
    })
    expect(r.success).toBe(true)
  })

  it("rejects a missing summary", () => {
    const r = caseCreateSchema.safeParse({
      urgency: "routine", shareTranscript: false,
    })
    expect(r.success).toBe(false)
  })

  it("rejects an invalid urgency", () => {
    const r = caseCreateSchema.safeParse({
      summary, urgency: "urgent_now", shareTranscript: false,
    })
    expect(r.success).toBe(false)
  })

  it("rejects a transcript longer than 4000 characters", () => {
    const r = caseCreateSchema.safeParse({
      summary, urgency: "routine", shareTranscript: true,
      transcript: "a".repeat(4001),
    })
    expect(r.success).toBe(false)
  })

  it("rejects emergency: true explicitly", () => {
    const r = caseCreateSchema.safeParse({
      summary, urgency: "routine", shareTranscript: false,
      emergency: true,
    })
    expect(r.success).toBe(false)
  })
})