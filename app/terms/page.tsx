import Disclaimer from "@/components/shared/Disclaimer"

export const metadata = { title: "Terms — CURERA AI" }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Terms</h1>
      <p className="text-muted-foreground">
        CURERA AI is a communication tool. It does not provide medical advice,
        diagnosis, or prescriptions. Do not use it for emergencies; seek
        appropriate local emergency care.
      </p>
      <Disclaimer />
    </div>
  )
}