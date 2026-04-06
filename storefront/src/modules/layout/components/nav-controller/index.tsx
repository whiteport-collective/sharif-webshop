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

  // Hide the Medusa nav on the home page and /search — FlowShell provides its own header there
  const segments = pathname.split("/").filter(Boolean)
  const isHomePage = segments.length === 1
  const isSearchPage = segments.length === 2 && segments[1] === "search"
  const hideNav = isHomePage || isSearchPage

  return (
    <>
      {!hideNav && nav}
      {children}
    </>
  )
}
