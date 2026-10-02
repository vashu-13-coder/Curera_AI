import "server-only"

import { z } from "zod"

// =============================================================================
// CURERA AI — LLM Provider (Gemini via fetch)
//
// Provider-swappable: change the model name via the LLM_MODEL env var.
// Never import this file from a client component.
//
// Security notes:
//   - The API key is sent in the "x-goog-api-key" header, never in the URL.
//   - Error messages are scrubbed so the API key cannot leak.
//   - The transcript is never logged here or by callers of this module.
// =============================================================================

const DEFAULT_MODEL = "gemini-2.5-flash"
const DEFAULT_TIMEOUT_MS = 25_000
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

export interface GenerateJsonOptions {
  model?: string
  timeoutMs?: number
  temperature?: number
}

export async function generateJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  options: GenerateJsonOptions = {}
): Promise<T> {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) throw new Error("LLM_API_KEY is not set.")

  const model = options.model ?? process.env.LLM_MODEL ?? DEFAULT_MODEL
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const temperature = options.temperature ?? 0.2

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent`

  const body = {
    contents: [{ role: "user", parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`LLM request timed out after ${timeoutMs}ms.`)
    }
    throw new Error(
      `LLM network error: ${err instanceof Error ? err.message : "unknown"}`
    )
  }
  clearTimeout(timer)

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    const safe = text.replaceAll(apiKey, "[REDACTED]").slice(0, 300)
    throw new Error(`LLM API error ${response.status}: ${safe}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  if (!rawText) throw new Error("LLM returned an empty response.")

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error("LLM returned invalid JSON.")
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `LLM JSON failed schema validation: ${result.error.message}`
    )
  }

  return result.data
}