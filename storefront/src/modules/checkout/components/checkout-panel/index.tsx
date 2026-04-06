"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const STEP_BACK: Record<string, string | null> = {
  delivery: null,       // null = browser back (→ product results)
  address: "delivery",
  payment: "address",
  booking: "payment",
}

/**
 * Full-screen panel that slides up from the bottom — same animation as the
 * results / qty-shop panels in FlowShell. Swipe-up or scroll-up at the top
 * of the page navigates back through checkout steps (or back to the store).
 */
export default function CheckoutPanel({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get("step") ?? "delivery"
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  // Trigger slide-in animation after first paint
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const goBack = () => {
    const prev = STEP_BACK[step]
    if (prev === null || prev === undefined) {
      router.back()
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set("step", prev)
      router.push("?" + params.toString(), { scroll: false })
    }
  }

  // Scroll-up at top of page → go back
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const atTop = () => el.scrollTop <= 0

    const onWheel = (e: WheelEvent) => {
      if (atTop() && e.deltaY < -20) goBack()
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!atTop()) return
      const dy = e.touches[0].clientY - touchStartY.current
      if (dy > 60) goBack()
    }

    el.addEventListener("wheel", onWheel, { passive: true })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [step]) // re-attach when step changes so goBack closure is fresh

  return (
    <div
      ref={containerRef}
      className={[
        "fixed inset-0 z-30 overflow-y-auto bg-white",
        "transition-transform duration-500 ease-in-out",
        mounted ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      {children}
    </div>
  )
}
