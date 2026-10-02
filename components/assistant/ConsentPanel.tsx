"use client"

import { useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { buildCaseSavePayload } from "@/lib/cases/payload"
import type { CaseSummary } from "@/types"

interface ConsentPanelProps {
  summary: CaseSummary
  transcript: string
  isLoggedIn: boolean
}

type ShareState = "idle" | "saving" | "saved" | "error"

export default function ConsentPanel({
  summary,
  transcript,
  isLoggedIn,
}: ConsentPanelProps) {
  const [shareSummary, setShareSummary] = useState(true)
  const [shareTranscript, setShareTranscript] = useState(false)
  const [state, setState] = useState<ShareState>("idle")
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null)

  const canShare = shareSummary || shareTranscript

  async function handleShare() {
    if (!canShare || state === "saving") return
    setState("saving")

    const payload = buildCaseSavePayload({
      summary,
      urgency: summary.urgency,
      transcript,
      shareTranscript,
    })

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.status === 201) {
        const data = (await res.json()) as { caseId: string }
        setSavedCaseId(data.caseId)
        setState("saved")
        return
      }
      setState("error")
    } catch {
      setState("error")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share with a professional</CardTitle>
        <CardDescription>
          Choose exactly what will be shared. You can revoke access later from
          your dashboard.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state === "saved" ? (
          <Alert role="status" aria-live="polite">
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Only a reviewing professional can see what you ticked. You can
                revoke this any time in your dashboard.
              </p>
              {savedCaseId && (
                <Link href={`/dashboard/${savedCaseId}`} className="underline text-sm">
                  Open this case in your dashboard
                </Link>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={shareSummary}
                  onCheckedChange={(v) => setShareSummary(v === true)}
                  aria-label="Share summary"
                />
                <div>
                  <div className="font-medium text-sm">Summary</div>
                  <div className="text-xs text-muted-foreground">
                    The structured case summary CURERA prepared from your words.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={shareTranscript}
                  onCheckedChange={(v) => setShareTranscript(v === true)}
                  aria-label="Share full transcript"
                />
                <div>
                  <div className="font-medium text-sm">Full transcript</div>
                  <div className="text-xs text-muted-foreground">
                    Everything you said or typed, in your own words.
                  </div>
                </div>
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Your information is shared only with the reviewing healthcare
              professional. Only what you tick above will be shared.
            </p>

            {state === "error" && (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>Something went wrong. Please try again.</AlertDescription>
              </Alert>
            )}

            {isLoggedIn ? (
              <Button onClick={handleShare} disabled={!canShare || state === "saving"}>
                {state === "saving" ? "Saving…" : "Share with a professional"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full sm:w-auto">
                  Share with a professional
                </Button>
                <p className="text-sm">
                  <Link
                    href="/login?next=/assistant"
                    className="underline hover:text-foreground"
                  >
                    Log in to save and share
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}