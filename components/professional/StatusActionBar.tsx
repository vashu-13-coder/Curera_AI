"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { CaseStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ProfessionalStatus = "reviewed" | "info_requested" | "closed"

const statusActions: Array<{ status: ProfessionalStatus; label: string }> = [
  { status: "reviewed", label: "Accept case" },
  { status: "info_requested", label: "Request more information" },
  { status: "closed", label: "Close case" },
]

function statusText(status: string): string {
  switch (status) {
    case "new":
      return "Waiting for review"
    case "reviewed":
      return "Accepted"
    case "info_requested":
      return "More information requested"
    case "scheduled":
      return "Appointment scheduled"
    case "closed":
      return "Closed"
    default:
      return status
  }
}

async function patchStatus(caseId: string, status: string): Promise<boolean> {
  const response = await fetch(`/api/cases/${caseId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return response.ok
}

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
  const [status, setStatus] = useState<string>(initialStatus)
  const [note, setNote] = useState(initialNote)
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentNote, setAppointmentNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function updateStatus(nextStatus: ProfessionalStatus) {
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const ok = await patchStatus(caseId, nextStatus)
      if (!ok) {
        setError("Could not update this case. Refresh and try again.")
        return
      }
      setStatus(nextStatus)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
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
      if (!response.ok) {
        setError("Could not save this note. Refresh and try again.")
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
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
          note: appointmentNote.trim() || undefined,
        }),
      })
      if (!response.ok) {
        setError(
          "Could not schedule this appointment. Choose a future time and try again."
        )
        return
      }

      const statusOk = await patchStatus(caseId, "scheduled")
      if (!statusOk) {
        setError("Appointment saved, but the status could not be updated.")
        router.refresh()
        return
      }

      setStatus("scheduled")
      setAppointmentTime("")
      setAppointmentNote("")
      setSaved(true)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="rounded-lg border bg-card p-4 space-y-5"
      aria-labelledby="status-actions-title"
    >
      <div>
        <h2 id="status-actions-title" className="font-semibold">
          Case status and follow-up
        </h2>
        <p className="text-sm text-muted-foreground">
          Current status: {statusText(status)}
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
            {action.label}
          </Button>
        ))}
      </div>

      <form className="space-y-2" onSubmit={saveNote}>
        <Label htmlFor={`professional-note-${caseId}`}>
          Professional note (optional)
        </Label>
        <Textarea
          id={`professional-note-${caseId}`}
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 1000))}
          rows={3}
          maxLength={1000}
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
          <Label htmlFor={`appointment-note-${caseId}`}>
            Note (optional, max 300 characters)
          </Label>
          <Textarea
            id={`appointment-note-${caseId}`}
            value={appointmentNote}
            onChange={(event) =>
              setAppointmentNote(event.target.value.slice(0, 300))
            }
            rows={2}
            maxLength={300}
            disabled={busy}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={busy || !appointmentTime}
        >
          {busy ? "Saving…" : "Schedule"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          Saved.
        </p>
      )}
    </section>
  )
}