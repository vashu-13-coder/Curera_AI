import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { createClient } from "@/lib/supabase/server"
import type { NavUser } from "@/types/app"


export const metadata: Metadata = {
  title: "CURERA AI — Healthcare That Listens Before It Routes",
  description:
    "A voice-first communication layer between patients and healthcare professionals.",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let navUser: NavUser | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()

    navUser = {
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      role: (profile?.role as "patient" | "professional" | null) ?? null,
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar user={navUser} />
          <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}