import Disclaimer from "@/components/shared/Disclaimer"

export const metadata = { title: "Contact — CURERA AI" }

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="text-muted-foreground">
        Reach out to the CURERA AI team for questions or collaboration.
      </p>
      <Disclaimer />
    </div>
  )
}