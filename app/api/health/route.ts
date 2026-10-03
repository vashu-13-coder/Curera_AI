import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Checks that the Supabase URL and anon key are valid and the project answers.
// It reads no table, so it works for logged-out visitors and exposes no data.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      { status: "error", message: "Supabase is not configured." },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.error("[api/health] Supabase auth health returned", res.status)
      return NextResponse.json(
        { status: "error", message: "Health check failed." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase connection is healthy.",
    })
  } catch {
    console.error("[api/health] Supabase unreachable")
    return NextResponse.json(
      { status: "error", message: "Health check failed." },
      { status: 500 }
    )
  }
}