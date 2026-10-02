import { describe, it, expect } from "vitest"
import { toSharedFields } from "@/lib/assistant/shared-fields"

describe("toSharedFields", () => {
  it("returns both when both are selected", () => {
    expect(toSharedFields({ summary: true, transcript: true })).toEqual([
      "summary",
      "transcript",
    ])
  })

  it("returns only summary when transcript is off", () => {
    expect(toSharedFields({ summary: true, transcript: false })).toEqual([
      "summary",
    ])
  })

  it("returns only transcript when summary is off", () => {
    expect(toSharedFields({ summary: false, transcript: true })).toEqual([
      "transcript",
    ])
  })

  it("returns an empty array when nothing is selected", () => {
    expect(toSharedFields({ summary: false, transcript: false })).toEqual([])
  })
})