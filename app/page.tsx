import Disclaimer from "@/components/shared/Disclaimer"

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="pt-8 text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Healthcare That Listens Before It Routes
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          From a patient&apos;s voice to the right healthcare professional.
        </p>
      </section>
      <Disclaimer />
      <p className="text-center text-sm text-muted-foreground">
        Features are being built. Check back soon.
      </p>
    </div>
  )
}