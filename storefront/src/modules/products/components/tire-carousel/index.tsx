"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"

export default function TireCarousel({
  children,
  count,
}: {
  children: React.ReactNode
  count: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16 // gap-4 = 16px
      : el.scrollWidth / count
    const index = Math.round(el.scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, count - 1))
  }, [count])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [onScroll])

  function scrollTo(index: number) {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : el.scrollWidth / count
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" })
  }

  return (
    <div>
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {children}
        <div className="w-4 flex-none" aria-hidden="true" />
      </div>

      {/* Dot indicator */}
      {count > 1 && (
        <div className="mt-5 flex justify-center gap-2 pb-5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Gå til kort ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "w-5 bg-ui-fg-base"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
