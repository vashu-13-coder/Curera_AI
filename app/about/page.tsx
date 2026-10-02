import Disclaimer from "@/components/shared/Disclaimer"

export const metadata = { title: "About — CURERA AI" }

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">About CURERA AI</h1>
      <p className="text-muted-foreground">
        CURERA AI is a voice-first communication layer that helps patients
        explain their concerns and helps healthcare professionals review
        consented summaries, exchange follow-up messages, and coordinate
        appointments.
      </p>
      <Disclaimer />
    </div>
  )
}