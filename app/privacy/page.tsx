import Disclaimer from "@/components/shared/Disclaimer"

export const metadata = { title: "Privacy — CURERA AI" }

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Privacy</h1>
      <p className="text-muted-foreground">
        Information is shared only with your consent, and only the minimum
        necessary is passed to the reviewing professional. You can revoke
        sharing or delete a case from your dashboard. Revoking consent prevents
        future professional access to that case.
      </p>
      <Disclaimer />
    </div>
  )
}