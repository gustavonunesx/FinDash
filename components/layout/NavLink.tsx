"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-1.5 text-sm rounded-md transition-all duration-150",
        isActive
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  )
}
