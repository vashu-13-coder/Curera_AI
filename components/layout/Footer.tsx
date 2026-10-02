import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CURERA AI. All rights reserved.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}