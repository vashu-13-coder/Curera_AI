import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const isProd = process.env.NODE_ENV === "production"

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })

    if (error) {
      console.error("[api/health] Supabase error:", error)
      return NextResponse.json(
        {
          status: "error",
          message: isProd ? "Health check failed." : error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase connection is healthy.",
    })
  } catch (err) {
    console.error("[api/health] Unexpected error:", err)
    const message = isProd
      ? "Health check failed."
      : err instanceof Error
        ? err.message
        : "Unknown error"
    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}