"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { CaseStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getCaseStatusLabel } from "@/lib/followup"

const statusActions: Array<{
  status: "under_review" | "info_requested" | "closed"
  label: string
}> = [
  { status: "under_review", label: "Mark under review" },
  { status: "info_requested", label: "Request more information" },
  { status: "closed", label: "Close case" },
]

export default function StatusActionBar({
  caseId,
  initialStatus,
  initialNote,
}: {
  caseId: string
  initialStatus: CaseStatus
  initialNote: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [note, setNote] = useState(initialNote)
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentNotes, setAppointmentNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function updateStatus(nextStatus: "under_review" | "info_requested" | "closed") {
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (response.ok) {
        setStatus(nextStatus)
        setBusy(false)
        router.refresh()
        return
      }
      throw new Error("Could not update case status.")
    } catch {
      setError("Could not update this case. Refresh and try again.")
    } finally {
      setBusy(false)
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalNote: note }),
      })
      if (!response.ok) throw new Error("Could not save professional note.")
      setSaved(true)
      router.refresh()
    } catch {
      setError("Could not save this note. Refresh and try again.")
    } finally {
      setBusy(false)
    }
  }

  async function scheduleAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const response = await fetch(`/api/cases/${caseId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(appointmentTime).toISOString(),
          notes: appointmentNotes,
        }),
      })
      if (!response.ok) throw new Error("Could not schedule appointment.")
      setStatus("scheduled")
      setAppointmentTime("")
      setAppointmentNotes("")
      setBusy(false)
      router.refresh()
      return
    } catch {
      setError("Could not schedule this appointment. Choose a future time and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 space-y-5" aria-labelledby="status-actions-title">
      <div>
        <h2 id="status-actions-title" className="font-semibold">Case status and follow-up</h2>
        <p className="text-sm text-muted-foreground">
          Current status: {getCaseStatusLabel(status)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusActions.map((action) => (
          <Button
            key={action.status}
            type="button"
            variant={status === action.status ? "secondary" : "outline"}
            onClick={() => void updateStatus(action.status)}
            disabled={busy || status === action.status}
          >
            {busy ? "Saving…" : action.label}
          </Button>
        ))}
      </div>

      <form className="space-y-2" onSubmit={saveNote}>
        <Label htmlFor={`professional-note-${caseId}`}>Professional note (optional)</Label>
        <Textarea
          id={`professional-note-${caseId}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={2000}
          disabled={busy}
        />
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? "Saving…" : "Save note"}
        </Button>
      </form>

      <form className="space-y-3 border-t pt-4" onSubmit={scheduleAppointment}>
        <h3 className="text-sm font-medium">Schedule an appointment</h3>
        <div className="space-y-2">
          <Label htmlFor={`appointment-time-${caseId}`}>Date and time</Label>
          <Input
            id={`appointment-time-${caseId}`}
            type="datetime-local"
            value={appointmentTime}
            onChange={(event) => setAppointmentTime(event.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`appointment-notes-${caseId}`}>Notes (optional)</Label>
          <Textarea
            id={`appointment-notes-${caseId}`}
            value={appointmentNotes}
            onChange={(event) => setAppointmentNotes(event.target.value)}
            rows={2}
            maxLength={2000}
            disabled={busy}
          />
        </div>
        <Button type="submit" variant="outline" disabled={busy || !appointmentTime}>
          {busy ? "Saving…" : "Schedule"}
        </Button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm text-muted-foreground">Saved.</p>}
    </section>
  )
}
