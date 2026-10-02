import type { CaseSummary, Urgency } from "@/types"

export interface CaseSaveInput {
  summary: CaseSummary
  urgency: Urgency
  transcript: string
  shareTranscript: boolean
}

export interface CaseSavePayload {
  summary: CaseSummary
  urgency: Urgency
  shareTranscript: boolean
  transcript?: string
}

/**
 * Builds the /api/cases payload.
 * The transcript is included ONLY when the patient ticked "Full transcript"
 * AND the transcript is non-empty after trimming.
 */
export function buildCaseSavePayload(input: CaseSaveInput): CaseSavePayload {
  const payload: CaseSavePayload = {
    summary: input.summary,
    urgency: input.urgency,
    shareTranscript: input.shareTranscript,
  }
  if (input.shareTranscript && input.transcript.trim().length > 0) {
    payload.transcript = input.transcript
  }
  return payload
}