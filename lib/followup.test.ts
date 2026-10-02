import { describe, expect, it } from "vitest"
import {
  caseAppointmentSchema,
  caseMessageSchema,
  caseStatusUpdateSchema,
} from "@/lib/schemas/followup"
import { getCaseStatusLabel, isAppointmentInFuture } from "@/lib/followup"

describe("follow-up validation and helpers", () => {
  it("accepts a valid message", () => {
    expect(caseMessageSchema.safeParse({ body: "Please call me tomorrow." }).success).toBe(true)
  })

  it("trims a valid message", () => {
    expect(caseMessageSchema.parse({ body: "  Hello  " }).body).toBe("Hello")
  })

  it("rejects an empty message", () => {
    expect(caseMessageSchema.safeParse({ body: "  " }).success).toBe(false)
  })

  it("rejects an oversized message", () => {
    expect(caseMessageSchema.safeParse({ body: "a".repeat(4001) }).success).toBe(false)
  })

  it("accepts a future appointment", () => {
    expect(
      caseAppointmentSchema.safeParse({
        scheduledAt: "2099-01-01T10:00:00.000Z",
        notes: "Bring the test results.",
      }).success
    ).toBe(true)
  })

  it("rejects an invalid appointment date", () => {
    expect(
      caseAppointmentSchema.safeParse({ scheduledAt: "not-a-date" }).success
    ).toBe(false)
  })

  it("rejects an appointment in the past", () => {
    expect(
      caseAppointmentSchema.safeParse({
        scheduledAt: "2000-01-01T10:00:00.000Z",
      }).success
    ).toBe(false)
  })

  it("rejects oversized appointment notes", () => {
    expect(
      caseAppointmentSchema.safeParse({
        scheduledAt: "2099-01-01T10:00:00.000Z",
        notes: "a".repeat(2001),
      }).success
    ).toBe(false)
  })

  it("accepts a professional-settable status", () => {
    expect(caseStatusUpdateSchema.safeParse({ status: "info_requested" }).success).toBe(true)
  })

  it("rejects a patient-only submitted status", () => {
    expect(caseStatusUpdateSchema.safeParse({ status: "submitted" }).success).toBe(false)
  })

  it("rejects a status update with no action", () => {
    expect(caseStatusUpdateSchema.safeParse({}).success).toBe(false)
  })

  it("formats case statuses", () => {
    expect(getCaseStatusLabel("under_review")).toBe("Under review")
  })

  it("accepts only timestamps later than the supplied time", () => {
    expect(isAppointmentInFuture("2025-01-02T10:00:00.000Z", Date.parse("2025-01-01"))).toBe(true)
    expect(isAppointmentInFuture("invalid-date", Date.parse("2025-01-01"))).toBe(false)
  })
})
