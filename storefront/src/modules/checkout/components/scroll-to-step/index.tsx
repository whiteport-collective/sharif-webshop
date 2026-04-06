"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * Scrolls the checkout page to the currently active step whenever the
 * ?step= query param changes. Each step section must have id="step-<name>".
 */
export default function ScrollToStep() {
  const searchParams = useSearchParams()
  const step = searchParams.get("step")

  useEffect(() => {
    if (!step) return
    const el = document.getElementById(`step-${step}`)
    if (!el) return
    // Small delay to let React finish rendering the open state
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
    return () => clearTimeout(t)
  }, [step])

  return null
}
