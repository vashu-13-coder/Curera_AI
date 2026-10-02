import { NextResponse, type NextRequest } from "next/server"
import { caseIdSchema, caseMessageSchema } from "@/lib/schemas/followup"
import { createClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: RouteContext) {
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

  const { data: visibleCase, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (caseError) {
    return NextResponse.json({ error: "Could not load this case." }, { status: 500 })
  }
  if (!visibleCase) {
    return NextResponse.json({ error: "Case not found or access was withdrawn." }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("case_messages")
    .select("id, case_id, sender_id, body, created_at")
    .eq("case_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 })
  }

  return NextResponse.json({ messages: data ?? [] })
}

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

  const parsed = caseMessageSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a message of at most 4000 characters." }, { status: 400 })
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

  const { data, error } = await supabase
    .from("case_messages")
    .insert({ case_id: id, sender_id: user.id, body: parsed.data.body })
    .select("id, case_id, sender_id, body, created_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Could not send this message." }, { status: 500 })
  }

  return NextResponse.json({ message: data }, { status: 201 })
}
