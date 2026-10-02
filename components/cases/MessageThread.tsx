"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import type { CaseMessage } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function MessageThread({
  caseId,
  currentUserId,
}: {
  caseId: string
  currentUserId: string
}) {
  const [messages, setMessages] = useState<CaseMessage[]>([])
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadMessages() {
      try {
        const response = await fetch(`/api/cases/${caseId}/messages`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Could not load messages.")
        }
        const result = (await response.json()) as { messages: CaseMessage[] }
        if (active) setMessages(result.messages)
      } catch {
        if (active) setError("Messages could not be loaded. Refresh and try again.")
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadMessages()
    return () => {
      active = false
    }
  }, [caseId])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const messageBody = body.trim()
    if (!messageBody || busy) return

    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/cases/${caseId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: messageBody }),
      })
      if (!response.ok) {
        throw new Error("Could not send this message.")
      }
      const result = (await response.json()) as { message: CaseMessage }
      setMessages((current) => [...current, result.message])
      setBody("")
    } catch {
      setError("Your message could not be sent. Refresh and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 space-y-4" aria-labelledby="messages-title">
      <div>
        <h2 id="messages-title" className="font-semibold">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Only the patient and a professional with active consent can view these messages.
        </p>
      </div>

      <ol className="space-y-3" aria-live="polite">
        {messages.map((message) => (
          <li key={message.id} className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>{message.sender_id === currentUserId ? "You" : "Other participant"}</span>
              <time dateTime={message.created_at}>
                {new Date(message.created_at).toLocaleString()}
              </time>
            </div>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </li>
        ))}
      </ol>

      {loading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
      {!loading && messages.length === 0 && (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <form className="space-y-2" onSubmit={sendMessage}>
        <label htmlFor={`message-${caseId}`} className="text-sm font-medium">
          Send a message
        </label>
        <Textarea
          id={`message-${caseId}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={4000}
          required
          disabled={busy}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || body.trim().length === 0}>
            {busy ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </section>
  )
}
