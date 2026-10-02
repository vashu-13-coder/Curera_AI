"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
})

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email, password,
    })
    setSubmitting(false)

    if (signInError) {
      setError("We couldn't sign you in. Check your email and password.")
      return
    }
    router.push(nextPath)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password" type={showPw ? "text" : "password"}
            autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          <button
            type="button" onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPw ? <EyeOff className="h-4 w-4 mx-auto" aria-hidden /> : <Eye className="h-4 w-4 mx-auto" aria-hidden />}
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Signing in…" : "Log in"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        No account?{" "}
        <Link href="/signup" className="underline hover:text-foreground">Create one</Link>
      </p>
    </form>
  )
}