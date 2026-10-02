import { NextResponse, type NextRequest } from "next/server"
import { caseIdSchema, caseStatusUpdateSchema } from "@/lib/schemas/followup"
import { createClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const parsed = caseStatusUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status or note." }, { status: 400 })
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
    return NextResponse.json({ error: "Only professionals can update a case." }, { status: 403 })
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

  const { status, professionalNote } = parsed.data
  const { error } = status !== undefined
    ? await supabase.rpc("update_case_status", {
        p_case_id: id,
        p_status: status,
      })
    : await supabase.rpc("set_professional_note", {
        p_case_id: id,
        p_note: professionalNote ?? null,
      })

  if (error) {
    return NextResponse.json(
      { error: "Could not update this case. Refresh and try again." },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true })
}
