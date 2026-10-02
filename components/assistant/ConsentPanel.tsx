"use client"

import { useState } from "react"
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
import {
  toSharedFields,
  type ShareSelection,
} from "@/lib/assistant/shared-fields"

export default function ConsentPanel() {
  const [selection, setSelection] = useState<ShareSelection>({
    summary: true,
    transcript: false,
  })
  const [banner, setBanner] = useState(false)

  function toggle(field: keyof ShareSelection, checked: boolean) {
    setSelection((prev) => ({ ...prev, [field]: checked }))
  }

  function handleShare() {
    // Step 4 only: keep selection in component state and show a banner.
    // No persistence, no logging of user text anywhere.
    const fields = toSharedFields(selection)
    if (fields.length === 0) return
    setBanner(true)
  }

  const canShare = selection.summary || selection.transcript

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share with a professional</CardTitle>
        <CardDescription>
          Choose exactly what will be shared. You can revoke access later.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={selection.summary}
              onCheckedChange={(v) => toggle("summary", v === true)}
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
              checked={selection.transcript}
              onCheckedChange={(v) => toggle("transcript", v === true)}
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
          professional. Only what you tick above will be shared. You can
          revoke access later.
        </p>

        <Button onClick={handleShare} disabled={!canShare}>
          Share with a professional
        </Button>

        {banner && (
          <Alert>
            <AlertTitle>Selection saved (this step only)</AlertTitle>
            <AlertDescription>
              Saving and sharing arrive in the next step. Nothing was sent
              anywhere.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}