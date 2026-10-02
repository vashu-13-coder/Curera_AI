"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function DeleteCaseButton({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function handleDelete() {
    setBusy(true)
    setError(false)
    const supabase = createClient()
    const { error: delError } = await supabase.from("cases").delete().eq("id", caseId)

    setBusy(false)
    if (delError) {
      setError(true)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        Delete case
      </Button>
    )
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-lg border bg-card p-5 space-y-4">
        <h2 id="delete-title" className="font-semibold">Delete this case?</h2>
        <p className="text-sm text-muted-foreground">
          This permanently removes the case, its transcript, and its consents.
          This cannot be undone.
        </p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            Could not delete. Please try again.
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Yes, delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}