"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const schema = z.object({
  fullName: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
})

export default function SignupForm() {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = schema.safeParse({ fullName, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    setSubmitting(false)

    if (signUpError) {
      setError("We couldn't create your account. Try a different email.")
      return
    }
    if (data.session) {
      router.push("/dashboard")
      router.refresh()
      return
    }
    setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <Alert>
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          We sent you a confirmation link. Open it to finish signing up.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName" value={fullName} autoComplete="name"
          onChange={(e) => setFullName(e.target.value)} required
        />
      </div>

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
            autoComplete="new-password"
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
          <AlertTitle>Could not sign up</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-foreground">Log in</Link>
      </p>
    </form>
  )
}