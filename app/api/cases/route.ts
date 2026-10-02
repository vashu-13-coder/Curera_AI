import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { caseCreateSchema } from "@/lib/schemas/case"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to save a case." },
      { status: 401 }
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  // Belt-and-braces: emergencies never reach this endpoint.
  if (
    typeof raw === "object" &&
    raw !== null &&
    "emergency" in raw &&
    (raw as { emergency?: unknown }).emergency === true
  ) {
    return NextResponse.json(
      { error: "Emergency responses are not saved." },
      { status: 400 }
    )
  }

  const parsed = caseCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { summary, urgency, transcript, shareTranscript } = parsed.data

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .insert({ patient_id: user.id, summary, urgency })
    .select("id")
    .single()

  if (caseErr || !caseRow) {
    return NextResponse.json({ error: "Could not save your case." }, { status: 500 })
  }

  const caseId = caseRow.id as string

  const { error: consentErr } = await supabase.from("consents").insert({
    case_id: caseId,
    share_summary: true,
    share_transcript: shareTranscript,
  })

  if (consentErr) {
    await supabase.from("cases").delete().eq("id", caseId)
    return NextResponse.json({ error: "Could not record consent." }, { status: 500 })
  }

  if (shareTranscript && transcript && transcript.trim().length > 0) {
    const { error: transcriptErr } = await supabase
      .from("case_transcripts")
      .insert({ case_id: caseId, transcript })

    if (transcriptErr) {
      await supabase.from("cases").delete().eq("id", caseId)
      return NextResponse.json({ error: "Could not save the transcript." }, { status: 500 })
    }
  }

  return NextResponse.json({ caseId }, { status: 201 })
}