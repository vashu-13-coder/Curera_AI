"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import VoiceInput from "@/components/assistant/VoiceInput"
import EmergencyCard from "@/components/assistant/EmergencyCard"
import SummaryReview from "@/components/assistant/SummaryReview"
import ConsentPanel from "@/components/assistant/ConsentPanel"
import type { CaseSummary, EmergencyCategory, EmergencyResponse } from "@/types"

const MIN_LEN = 5
const MAX_LEN = 4000

type Stage = "form" | "loading" | "emergency" | "summary"
type ErrorKind = "invalid" | "rate_limit" | "ai_failed" | "network"

interface EmergencyState {
  category: EmergencyCategory
  response: EmergencyResponse
}

export default function AssistantClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [stage, setStage] = useState<Stage>("form")
  const [error, setError] = useState<ErrorKind | null>(null)
  const [emergency, setEmergency] = useState<EmergencyState | null>(null)
  const [summary, setSummary] = useState<CaseSummary | null>(null)
  const [disclaimer, setDisclaimer] = useState("")

  const trimmedLen = transcript.trim().length
  const canSend =
    trimmedLen >= MIN_LEN && transcript.length <= MAX_LEN && stage !== "loading"

  async function handleSend() {
    if (!canSend) return
    setError(null)
    setStage("loading")

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      if (res.status === 400) { setError("invalid"); setStage("form"); return }
      if (res.status === 429) { setError("rate_limit"); setStage("form"); return }
      if (res.status === 502) { setError("ai_failed"); setStage("form"); return }
      if (!res.ok) { setError("ai_failed"); setStage("form"); return }

      const data = (await res.json()) as
        | { emergency: true; category: EmergencyCategory; matchedPhrase: string | null; response: EmergencyResponse }
        | { emergency: false; summary: CaseSummary; disclaimer: string }

      if (data.emergency === true) {
        setEmergency({ category: data.category, response: data.response })
        setStage("emergency")
        return
      }
      setSummary(data.summary)
      setDisclaimer(data.disclaimer ?? "")
      setStage("summary")
    } catch {
      setError("network")
      setStage("form")
    }
  }

  function handleBack() {
    setEmergency(null)
    setSummary(null)
    setDisclaimer("")
    setError(null)
    setStage("form")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Talk to CURERA AI</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Speak or type your concern in your own words. CURERA organizes it
          into a structured case for a healthcare professional to review.
          CURERA is not a doctor and does not diagnose.
        </p>
      </header>

      {stage === "emergency" && emergency ? (
        <EmergencyCard
          category={emergency.category}
          response={emergency.response}
          onBack={handleBack}
        />
      ) : stage === "summary" && summary ? (
        <>
          <SummaryReview summary={summary} disclaimer={disclaimer} onBack={handleBack} />
          <ConsentPanel
            summary={summary}
            transcript={transcript}
            isLoggedIn={isLoggedIn}
          />
        </>
      ) : (
        <>
          {error && <ErrorAlert kind={error} onRetry={handleSend} />}

          <VoiceInput
            disabled={stage === "loading"}
            onFinal={(text) => {
              setTranscript((prev) => {
                const sep = prev && !prev.endsWith(" ") ? " " : ""
                const next = prev + sep + text
                return next.slice(0, MAX_LEN)
              })
            }}
            onInterim={setInterim}
          />

          <div className="space-y-2">
            <label htmlFor="transcript" className="text-sm font-medium">
              Your words (editable)
            </label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => {
                setInterim("")
                setTranscript(e.target.value.slice(0, MAX_LEN))
              }}
              rows={6}
              maxLength={MAX_LEN}
              placeholder="Speak using the mic above, or type your concern here…"
              aria-describedby="transcript-counter"
              disabled={stage === "loading"}
            />
            <div
              id="transcript-counter"
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>Minimum {MIN_LEN} characters</span>
              <span>{transcript.length} / {MAX_LEN}</span>
            </div>
            {interim && (
              <p aria-live="polite" className="text-sm italic text-muted-foreground">
                Hearing: {interim}
              </p>
            )}
          </div>

          <Button onClick={handleSend} disabled={!canSend} className="w-full sm:w-auto">
            {stage === "loading" ? "Sending…" : "Send"}
          </Button>
        </>
      )}
    </div>
  )
}

function ErrorAlert({ kind, onRetry }: { kind: ErrorKind; onRetry: () => void }) {
  const messages: Record<ErrorKind, string> = {
    invalid:
      "Your text must be at least 5 characters and at most 4000 characters.",
    rate_limit: "Please wait a minute before trying again.",
    ai_failed:
      "We couldn't organize your text right now. Please try again in a moment.",
    network:
      "We couldn't reach the server. Check your connection and try again.",
  }

  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" aria-hidden />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{messages[kind]}</p>
        {(kind === "ai_failed" || kind === "network") && (
          <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
        )}
      </AlertDescription>
    </Alert>
  )
}