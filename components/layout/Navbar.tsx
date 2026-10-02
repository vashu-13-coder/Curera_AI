"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ThemeToggle from "./ThemeToggle"
import SignOutButton from "@/components/auth/SignOutButton"
import type { NavUser } from "@/types/app"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/professionals", label: "For Professionals" },
  { href: "/contact", label: "Contact" },
]

export default function Navbar({ user }: { user: NavUser | null }) {
  const dashboardHref =
    user?.role === "professional" ? "/professional" : "/dashboard"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center font-bold text-xl rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-primary">CURERA</span>
          <span className="ml-1 text-foreground">AI</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-4 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-md px-2 py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {user.fullName ?? user.email ?? "Dashboard"}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/assistant"
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Start
              </Link>
              <Link
                href="/login"
                className="rounded-md px-2 py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Log in
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                  {link.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link href="/assistant" />}>Start</DropdownMenuItem>
              {user ? (
                <>
                  <DropdownMenuItem render={<Link href={dashboardHref} />}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SignOutButton />
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem render={<Link href="/login" />}>Log in</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}