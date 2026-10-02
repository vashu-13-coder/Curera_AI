"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  WebSpeechErrorEvent,
  WebSpeechRecognition,
  WebSpeechRecognitionConstructor,
  WebSpeechResultEvent,
} from "@/types/speech"

interface VoiceInputProps {
  disabled?: boolean
  onFinal: (text: string) => void
  onInterim: (text: string) => void
}

type Status =
  | "idle"
  | "listening"
  | "unsupported"
  | "denied"
  | "no_speech"
  | "network"
  | "error"

export default function VoiceInput({
  disabled = false,
  onFinal,
  onInterim,
}: VoiceInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [listening, setListening] = useState(false)
  const [, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string>("")
  const [lang, setLang] = useState<"en-IN" | "hi-IN">("en-IN")

  const recognitionRef = useRef<WebSpeechRecognition | null>(null)

  // Feature detection
  useEffect(() => {
    if (typeof window === "undefined") return
    const Ctor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
    setSupported(Boolean(Ctor))
    if (!Ctor) {
      setStatus("unsupported")
      setMessage(
        "Voice input is not supported in this browser. Please type your concern below. For voice, use Chrome or Edge."
      )
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const r = recognitionRef.current
      if (r) {
        try {
          r.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }
    }
  }, [])

  // Stop cleanly when language changes mid-session
  useEffect(() => {
    if (!listening) return
    const r = recognitionRef.current
    if (!r) return
    try {
      r.stop()
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  function stop() {
    const r = recognitionRef.current
    if (!r) return
    try {
      r.stop()
    } catch {
      // ignore
    }
  }

  function start() {
    if (typeof window === "undefined") return
    const Ctor: WebSpeechRecognitionConstructor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setStatus("unsupported")
      setMessage("Voice input is not supported in this browser. Please type below.")
      return
    }

    // Tear down any previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }

    const r = new Ctor()
    r.continuous = true
    r.interimResults = true
    r.lang = lang
    r.maxAlternatives = 1

    r.onstart = () => {
      setListening(true)
      setStatus("listening")
      setMessage("Listening…")
    }

    r.onresult = (ev: WebSpeechResultEvent) => {
      let interim = ""
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i]
        const alt = result[0]
        if (!alt) continue
        if (result.isFinal) {
          const text = alt.transcript.trim()
          if (text) onFinal(text)
        } else {
          interim += alt.transcript
        }
      }
      onInterim(interim.trim())
    }

    r.onerror = (ev: WebSpeechErrorEvent) => {
      const err = ev.error || "unknown"
      if (err === "not-allowed" || err === "service-not-allowed") {
        setStatus("denied")
        setMessage(
          "Microphone permission was denied. You can still type your concern below."
        )
      } else if (err === "no-speech") {
        setStatus("no_speech")
        setMessage("No speech was detected. Try again, or type below.")
      } else if (err === "network") {
        setStatus("network")
        setMessage(
          "The speech service is unreachable. Check your connection, or type below."
        )
      } else if (err === "aborted") {
        // user stopped; keep quiet
      } else {
        setStatus("error")
        setMessage(`Voice input error: ${err}. You can type below.`)
      }
      setListening(false)
      onInterim("")
    }

    r.onend = () => {
      setListening(false)
      onInterim("")
      setStatus((s) => (s === "listening" ? "idle" : s))
      setMessage((m) => (m === "Listening…" ? "" : m))
    }

    recognitionRef.current = r
    try {
      r.start()
    } catch {
      setStatus("error")
      setMessage("Could not start voice input. Please type below.")
    }
  }

  function toggleMic() {
    if (listening) stop()
    else start()
  }

  return (
    <section
      aria-label="Voice input"
      className="rounded-lg border bg-card p-4 space-y-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="voice-lang" className="text-sm font-medium">
          Language
        </label>
        <select
          id="voice-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as "en-IN" | "hi-IN")}
          disabled={disabled}
          className="rounded-md border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">हिन्दी (Hindi)</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant={listening ? "destructive" : "default"}
          size="lg"
          onClick={toggleMic}
          disabled={disabled || supported === false}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          className="rounded-full h-16 w-16 p-0"
        >
          {listening ? (
            <MicOff className="h-6 w-6" aria-hidden />
          ) : (
            <Mic className="h-6 w-6" aria-hidden />
          )}
        </Button>

        <div
          className="relative h-12 flex-1 overflow-hidden rounded-md bg-muted"
          aria-hidden="true"
        >
          {listening ? (
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              <span className="block h-2 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="block h-4 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:120ms]" />
              <span className="block h-6 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:240ms]" />
              <span className="block h-4 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:360ms]" />
              <span className="block h-2 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:480ms]" />
            </div>
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Tap the mic to speak
            </p>
          )}
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground min-h-[1.25rem]"
      >
        {message}
      </p>
    </section>
  )
}