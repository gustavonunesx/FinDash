"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileNavLinkProps {
  href: string
  label: string
  children: React.ReactNode
}

export function MobileNavLink({ href, label, children }: MobileNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-150",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full" />
      )}
      <span className={cn(
        "transition-transform duration-150",
        isActive && "scale-110"
      )}>
        {children}
      </span>
      <span className={cn(
        "text-[10px] transition-all duration-150",
        isActive && "font-medium"
      )}>
        {label}
      </span>
    </Link>
  )
}
