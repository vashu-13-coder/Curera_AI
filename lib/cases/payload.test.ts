import { describe, it, expect } from "vitest"
import { buildCaseSavePayload } from "@/lib/cases/payload"

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

describe("buildCaseSavePayload", () => {
  it("omits the transcript when shareTranscript is false", () => {
    const p = buildCaseSavePayload({
      summary, urgency: "routine", transcript: "some text", shareTranscript: false,
    })
    expect("transcript" in p).toBe(false)
  })

  it("includes the transcript when shareTranscript is true and non-empty", () => {
    const p = buildCaseSavePayload({
      summary, urgency: "routine",
      transcript: "Mild headache for three days.", shareTranscript: true,
    })
    expect(p.transcript).toBe("Mild headache for three days.")
  })

  it("omits the transcript when shareTranscript is true but the text is whitespace only", () => {
    const p = buildCaseSavePayload({
      summary, urgency: "routine", transcript: "   \n\t  ", shareTranscript: true,
    })
    expect("transcript" in p).toBe(false)
  })

  it("always preserves the summary and urgency", () => {
    const p = buildCaseSavePayload({
      summary, urgency: "soon", transcript: "x", shareTranscript: false,
    })
    expect(p.summary).toBe(summary)
    expect(p.urgency).toBe("soon")
  })
})