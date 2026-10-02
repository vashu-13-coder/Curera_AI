import LoginForm from "@/components/auth/LoginForm"

export const metadata = { title: "Log in — CURERA AI" }

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <LoginForm />
    </div>
  )
}