"use client"

import { usePathname } from "next/navigation"

export default function NavController({
  nav,
  children,
}: {
  nav: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Hide the Medusa nav where FlowShell provides its own header.
  // Handles both clean URLs (/, /dekk/...) and legacy /no/ prefixed URLs.
  const segments = pathname.split("/").filter(Boolean)
  const isHomePage = segments.length === 0 || segments.length === 1
  const hasSegment = (name: string) => segments[0] === name || segments[1] === name
  const hideNav = isHomePage || hasSegment("search") || hasSegment("dekk")

  return (
    <>
      {!hideNav && nav}
      {children}
    </>
  )
}
