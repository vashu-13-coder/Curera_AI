import Disclaimer from "@/components/shared/Disclaimer"

export const metadata = { title: "For Professionals — CURERA AI" }

export default function ProfessionalsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">For Professionals</h1>
      <p className="text-muted-foreground">
        A workspace where healthcare professionals review structured case
        summaries shared with their consent, request more information, exchange
        messages, and schedule appointments. It does not replace professional
        judgement.
      </p>
      <Disclaimer />
    </div>
  )
}