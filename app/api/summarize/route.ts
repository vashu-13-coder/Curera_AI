import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  summarizeRequestSchema,
  caseSummarySchema,
} from "@/lib/schemas/case-summary"
import { detectEmergency } from "@/lib/emergency"
import { getEmergencyResponse } from "@/lib/emergency-response"
import { generateJson } from "@/lib/llm"

export const dynamic = "force-dynamic"

// -----------------------------------------------------------------------------
// Simple in-memory rate limit: 10 requests / minute / IP.
// Resets on server restart. Replace with a durable store later.
// -----------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent)
    return true
  }
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return false
}

// -----------------------------------------------------------------------------
// System prompt — strict. No diagnosis, no invented facts.
// -----------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a medical communication assistant. Your ONLY job is to organize what the patient said into a structured case summary. You are NOT a doctor and you must NOT diagnose, prescribe, or add any medical facts that the patient did not say.

Rules:
1. Summarize ONLY information explicitly present in the patient's own words.
2. Never add symptoms, history, or facts the patient did not mention.
3. If something is missing, put it into followUpQuestions instead of guessing.
4. Set urgency conservatively. Use "urgent" only if the patient clearly describes a severe situation. Prefer "routine" when unsure.
5. suggestedProfessionalType must be a general type like "General physician", "Cardiologist", "Pediatrician", "Dermatologist". Never a specific doctor's name.
6. patientOwnWords must be a short, direct quote taken verbatim from the transcript.
7. Return ONLY valid JSON matching the required keys. No markdown, no commentary.
8. "symptoms" must list only symptoms the patient HAS. Things the patient says they do NOT have (e.g. "no fever") go in relevantHistory written as "Denies fever".`
// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ---- Rate limit ----------------------------------------------------------
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  // ---- Parse & validate body ------------------------------------------------
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const parsed = summarizeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { transcript } = parsed.data

  // ---- Emergency detection BEFORE any LLM call ------------------------------
  const emergency = detectEmergency(transcript)

  if (emergency.isEmergency && emergency.category) {
    return NextResponse.json({
      emergency: true,
      category: emergency.category,
      matchedPhrase: emergency.matchedPhrase,
      response: getEmergencyResponse(emergency.category),
    })
  }

  // ---- LLM call with retry --------------------------------------------------
  // The transcript is embedded in the user prompt only. It is never logged.
  const userPrompt = `Patient transcript:
"""
${transcript}
"""

Return a JSON object with EXACTLY these keys:
- concern (string)
- duration (string)
- symptoms (string[])
- severityReported (string)
- relevantHistory (string[])
- followUpQuestions (string[])
- patientOwnWords (string)
- urgency ("routine" | "soon" | "urgent")
- suggestedProfessionalType (string)

Return only the JSON object. No markdown, no commentary.`

  let summary: z.infer<typeof caseSummarySchema> | null = null
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      summary = await generateJson(
        SYSTEM_PROMPT,
        userPrompt,
        caseSummarySchema
      )
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown LLM error")
      console.error(
        `[api/summarize] LLM attempt ${attempt + 1} failed: ${lastError.message}`
      )
    }
  }

  if (!summary) {
    return NextResponse.json(
      {
        error:
          "We could not organize the transcript right now. Please try again.",
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    emergency: false,
    summary,
    disclaimer:
      "AI-organized from the patient's own words. Not a diagnosis.",
  })
}