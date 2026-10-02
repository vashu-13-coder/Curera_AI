import { AlertTriangle, ArrowLeft, HeartHandshake, Phone } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { EmergencyCategory, EmergencyResponse } from "@/types"

interface EmergencyCardProps {
  category: EmergencyCategory
  response: EmergencyResponse
  onBack: () => void
}

export default function EmergencyCard({
  category,
  response,
  onBack,
}: EmergencyCardProps) {
  const isSelfHarm = category === "self_harm"

  const calls = isSelfHarm
    ? [
        { label: "Call Tele-MANAS 14416", href: "tel:14416", primary: true },
        { label: "Call 112 (immediate danger)", href: "tel:112", primary: false },
      ]
    : [
        { label: "Call 112 (national emergency)", href: "tel:112", primary: true },
        { label: "Call 108 (ambulance)", href: "tel:108", primary: false },
      ]

  return (
    <Card
      className={cn(
        isSelfHarm
          ? "border-sky-500/60 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-50"
          : "border-red-700 bg-red-700 text-white"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          {isSelfHarm ? (
            <HeartHandshake className="h-6 w-6" aria-hidden />
          ) : (
            <AlertTriangle className="h-6 w-6" aria-hidden />
          )}
          {response.title}
        </CardTitle>
        <CardDescription
          className={cn(
            isSelfHarm
              ? "text-sky-900 dark:text-sky-100"
              : "text-white/95"
          )}
        >
          {response.message}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <ul
          className={cn(
            "space-y-2 text-sm",
            isSelfHarm ? "" : "text-white"
          )}
        >
          {response.actions.map((action, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-2">
          {calls.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className={cn(
                buttonVariants({
                  variant: isSelfHarm
                    ? c.primary
                      ? "default"
                      : "outline"
                    : c.primary
                      ? "secondary"
                      : "outline",
                }),
                "w-full sm:w-auto"
              )}
            >
              <Phone className="h-4 w-4 mr-2" aria-hidden />
              {c.label}
            </a>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className={cn(
            isSelfHarm ? "" : "text-white hover:bg-white/10"
          )}
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden />
          Go back
        </Button>
      </CardContent>
    </Card>
  )
}