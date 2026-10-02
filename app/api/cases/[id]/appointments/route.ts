import { NextResponse, type NextRequest } from "next/server"
import { caseAppointmentSchema, caseIdSchema } from "@/lib/schemas/followup"
import { createClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!caseIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid case ID." }, { status: 400 })
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = caseAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a future appointment time and keep notes under 2000 characters." },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: "Could not verify your account." }, { status: 500 })
  }
  if (profile.role !== "professional") {
    return NextResponse.json({ error: "Only professionals can schedule appointments." }, { status: 403 })
  }

  const { data: visibleCase, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (caseError) {
    return NextResponse.json({ error: "Could not verify case access." }, { status: 500 })
  }
  if (!visibleCase) {
    return NextResponse.json({ error: "Case not found or access was withdrawn." }, { status: 404 })
  }

  const { data: appointmentId, error } = await supabase.rpc(
    "schedule_case_appointment",
    {
      p_case_id: id,
      p_scheduled_at: parsed.data.scheduledAt,
      p_notes: parsed.data.notes ?? null,
    }
  )

  if (error || !appointmentId) {
    return NextResponse.json(
      { error: "Could not schedule this appointment. Refresh and try again." },
      { status: 409 }
    )
  }

  return NextResponse.json({ appointmentId }, { status: 201 })
}
