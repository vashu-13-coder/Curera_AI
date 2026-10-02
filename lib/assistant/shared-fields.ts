export type ShareField = "summary" | "transcript"

export interface ShareSelection {
  summary: boolean
  transcript: boolean
}

export function toSharedFields(selection: ShareSelection): ShareField[] {
  const out: ShareField[] = []
  if (selection.summary) out.push("summary")
  if (selection.transcript) out.push("transcript")
  return out
}