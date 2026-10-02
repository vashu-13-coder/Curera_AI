"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

export default function ReviewForm({
  caseId,
  initialNote,
  initialReviewed,
}: {
  caseId: string
  initialNote: string
  initialReviewed: boolean
}) {
  const router = useRouter()
  const [note, setNote] = useState(initialNote)
  const [reviewed, setReviewed] = useState(initialReviewed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(markReviewed: boolean) {
    setBusy(true)
    setError(false)
    setSaved(false)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("cases")
      .update({
        professional_note: note.trim() || null,
        status: markReviewed ? "reviewed" : "new",
      })
      .eq("id", caseId)

    setBusy(false)
    if (updateError) {
      setError(true)
      return
    }
    setReviewed(markReviewed)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold">Your review</h2>

      <div className="space-y-2">
        <Label htmlFor="note">Short note (optional)</Label>
        <Textarea
          id="note" value={note} onChange={(e) => setNote(e.target.value)}
          rows={4} maxLength={2000}
          placeholder="A short internal note about this case."
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          Could not save. Please try again.
        </p>
      )}
      {saved && (
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          Saved.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={busy}>
          {busy ? "Saving…" : "Save note"}
        </Button>
        {!reviewed && (
          <Button onClick={() => handleSave(true)} disabled={busy}>
            {busy ? "Saving…" : "Mark as reviewed"}
          </Button>
        )}
      </div>
    </div>
  )
}