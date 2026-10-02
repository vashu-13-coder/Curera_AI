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

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/professionals", label: "For Professionals" },
  { href: "/contact", label: "Contact" },
]

export default function Navbar() {
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

        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}