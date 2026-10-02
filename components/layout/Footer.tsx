import Link from "next/link"

const footerLinks = [
  { href: "/assistant", label: "Start" },
  { href: "/about", label: "About" },
  { href: "/professionals", label: "For Professionals" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CURERA AI. All rights reserved.
        </p>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}