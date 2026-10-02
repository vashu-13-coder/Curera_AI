"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function RevokeConsentButton({
  caseId,
  consentId,
}: {
  caseId: string
  consentId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function handleRevoke() {
    setBusy(true)
    setError(false)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("consents")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", consentId)
      .eq("case_id", caseId)

    setBusy(false)
    if (updateError) {
      setError(true)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={handleRevoke} disabled={busy}>
        {busy ? "Revoking…" : "Revoke sharing"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          Could not revoke. Please try again.
        </p>
      )}
    </div>
  )
}