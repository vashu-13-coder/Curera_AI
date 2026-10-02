import SignupForm from "@/components/auth/SignupForm"

export const metadata = { title: "Create account — CURERA AI" }

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="text-sm text-muted-foreground">
        Accounts are created as patients. Professionals are added by an admin.
      </p>
      <SignupForm />
    </div>
  )
}