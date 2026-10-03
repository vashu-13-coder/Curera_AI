import "server-only"

import { z } from "zod"

// =============================================================================
// CURERA AI — LLM Provider (Gemini via fetch)
// Never import this file from a client component.
// The API key is sent in a header, never in the URL. Errors never contain
// the key or the transcript.
// =============================================================================

const DEFAULT_MODEL = "gemini-3.5-flash"
const FALLBACK_MODEL = "gemini-3.5-flash-lite" // used only if the main model keeps failing
const DEFAULT_TIMEOUT_MS = 25_000
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
const RETRYABLE = new Set([429, 500, 502, 503, 504])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface GenerateJsonOptions {
  model?: string
  timeoutMs?: number
  temperature?: number
}

async function callGemini(
  model: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function generateJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  options: GenerateJsonOptions = {}
): Promise<T> {
  const apiKey = process.env.LLM_API_KEY?.trim()
  if (!apiKey) throw new Error("LLM_API_KEY is not set.")

  // `||` so an empty LLM_MODEL falls back to the default.
  const model = options.model || process.env.LLM_MODEL?.trim() || DEFAULT_MODEL
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const temperature = options.temperature ?? 0.2

  const body = {
    contents: [{ role: "user", parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
  }

  // Main model twice, then the fallback model once.
  const attempts =
    model === FALLBACK_MODEL ? [model, model] : [model, model, FALLBACK_MODEL]

  let response: Response | null = null
  for (let i = 0; i < attempts.length; i++) {
    const isLast = i === attempts.length - 1
    try {
      response = await callGemini(attempts[i], apiKey, body, timeoutMs)
    } catch {
      response = null
      console.error("[llm] network or timeout", attempts[i]) // TEMP
      if (isLast) throw new Error("LLM request failed.")
      await sleep(1000 * (i + 1))
      continue
    }
    if (response.ok) break
    console.error("[llm] http", response.status, attempts[i]) // TEMP
    if (!RETRYABLE.has(response.status) || isLast) break
    await sleep(1000 * (i + 1))
  }

  if (!response) throw new Error("LLM request failed.")

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    const safe = text.replaceAll(apiKey, "[REDACTED]").slice(0, 300)
    throw new Error(`LLM API error ${response.status}: ${safe}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      finishReason?: string
      content?: { parts?: Array<{ text?: string; thought?: boolean }> }
    }>
    promptFeedback?: { blockReason?: string }
  }

  const cand = data.candidates?.[0]
  const rawText = (cand?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")

  if (!rawText) {
    console.error("[llm] empty", cand?.finishReason, data.promptFeedback?.blockReason) // TEMP
    throw new Error("LLM returned an empty response.")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    console.error("[llm] bad json", cand?.finishReason, rawText.length) // TEMP
    throw new Error("LLM returned invalid JSON.")
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    console.error("[llm] schema", result.error.issues.map((i) => i.path.join(".")).join(",")) // TEMP
    throw new Error("LLM JSON failed schema validation.")
  }

  return result.data
}