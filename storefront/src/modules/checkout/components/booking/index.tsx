"use client"

import { saveBookingToCart } from "@lib/data/cart"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import { useLanguage } from "@lib/i18n"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

export type BookingSnapshot = {
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}

export type BookingAgentSetter = (slotId: string) => { ok: boolean; reason?: string }

const WORKSHOPS: Record<string, { name: string; address: string }> = {
  "pickup-fjellhamar": {
    name: "Fjellhamar",
    address: "Kloppaveien 16, 1472 Fjellhamar",
  },
  "pickup-drammen": {
    name: "Drammen",
    address: "Tordenskiolds gate 73, 3044 Drammen",
  },
}

const DAYS_INITIAL = 5
const DAYS_PER_LOAD = 5
const DAYS_MAX = 30

function getAvailableSlots(count: number) {
  const slots: { date: string; label: string; times: string[] }[] = []
  const day = new Date()
  day.setDate(day.getDate() + 1)

  while (slots.length < count) {
    const dow = day.getDay()
    if (dow !== 0 && dow !== 6) {
      const label = day.toLocaleDateString("nb-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      slots.push({
        date: day.toISOString().split("T")[0],
        label: label.charAt(0).toUpperCase() + label.slice(1),
        times: ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"],
      })
    }
    day.setDate(day.getDate() + 1)
  }
  return slots
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={clx("transition-transform duration-200 flex-none text-ui-fg-muted", {
        "rotate-180": open,
      })}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const Booking = ({
  cart,
  step: stepProp,
  onStepChange,
  isWorkshop: isWorkshopProp,
  shippingMethodName: shippingMethodNameProp,
  onSnapshotChange,
  onRegisterAgentSetter,
}: {
  cart: HttpTypes.StoreCart
  step?: string
  onStepChange?: (step: string) => void
  isWorkshop?: boolean
  shippingMethodName?: string | null
  onSnapshotChange?: (snapshot: BookingSnapshot) => void
  onRegisterAgentSetter?: (setter: BookingAgentSetter) => void
}) => {
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const isOpen = stepProp ? stepProp === "booking" : searchParams.get("step") === "booking"

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    // Open first available day by default so user sees times immediately
    const first = getAvailableSlots(1)[0]
    return new Set(first ? [first.date] : [])
  })
  const [visibleDays, setVisibleDays] = useState(DAYS_INITIAL)
  const [agentPulseSlotId, setAgentPulseSlotId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const ctaRef = useRef<HTMLDivElement>(null)

  const scrollToCta = () => {
    ctaRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }

  const handleEdit = () => {
    onStepChange?.("booking")
  }

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const handleSelectTime = (date: string, time: string, workshopName: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    startTransition(() => saveBookingToCart(date, time, workshopName))
  }

  // Workshop name derived from in-memory selected option (parent passes it) with cart fallback.
  // Reading cart.shipping_methods alone is stale before Payment step refreshes the cart.
  const shippingMethodName = shippingMethodNameProp ?? cart.shipping_methods?.[0]?.name ?? ""
  const workshopFromName = Object.entries(WORKSHOPS).find(([, w]) =>
    shippingMethodName.toLowerCase().includes(w.name.toLowerCase())
  )?.[1] ?? null
  // If isWorkshopProp is explicitly false → no booking. Otherwise use resolved workshop.
  const workshop = isWorkshopProp === false ? null : workshopFromName

  const slots = useMemo(() => getAvailableSlots(visibleDays), [visibleDays])
  const bookingReady = !!selectedDate && !!selectedTime
  const bookingSnapshot = useMemo<BookingSnapshot>(() => ({
    bookingSlots: workshop
      ? slots
          .filter((slot) => expandedDays.has(slot.date))
          .flatMap((slot) =>
            slot.times.map((time) => ({
              id: `${slot.date}|${time}`,
              label: `${slot.label} · ${time}`,
            }))
          )
      : [],
    selectedBookingSlotId: selectedDate && selectedTime ? `${selectedDate}|${selectedTime}` : null,
  }), [workshop, slots, expandedDays, selectedDate, selectedTime])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToCta()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    onSnapshotChange?.(bookingSnapshot)
  }, [bookingSnapshot, onSnapshotChange])

  // Agent setter — selects a booking slot by "YYYY-MM-DD|HH:MM" ID.
  // Auto-expands the day if it's collapsed and auto-grows visibleDays if the
  // requested date falls beyond the currently loaded range.
  const workshopRef = useRef(workshop)
  workshopRef.current = workshop

  useEffect(() => {
    if (!onRegisterAgentSetter) return
    onRegisterAgentSetter((slotId) => {
      const w = workshopRef.current
      if (!w) return { ok: false, reason: "Booking not active for home delivery" }

      const [date, time] = slotId.split("|")
      if (!date || !time) {
        return { ok: false, reason: `Invalid slot ID: ${slotId}` }
      }
      const allSlots = getAvailableSlots(DAYS_MAX)
      const targetSlot = allSlots.find((s) => s.date === date)
      if (!targetSlot) {
        return { ok: false, reason: `Date not available: ${date}` }
      }
      if (!targetSlot.times.includes(time)) {
        return { ok: false, reason: `Time not available on ${date}: ${time}` }
      }

      const idx = allSlots.findIndex((s) => s.date === date)
      setVisibleDays((prev) => Math.min(DAYS_MAX, Math.max(prev, idx + 1)))
      setExpandedDays((prev) => (prev.has(date) ? prev : new Set(prev).add(date)))
      setSelectedDate(date)
      setSelectedTime(time)
      startTransition(() => saveBookingToCart(date, time, w.name))

      setAgentPulseSlotId(slotId)
      setTimeout(() => {
        setAgentPulseSlotId((prev) => (prev === slotId ? null : prev))
      }, 1200)
      return { ok: true }
    })
  }, [onRegisterAgentSetter])

  // For home-delivery carts — no booking needed, render nothing
  if (!workshop) return null

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen && !bookingReady,
            }
          )}
        >
          Booking
          {!isOpen && bookingReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && bookingReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      <div className={isOpen ? "block" : "hidden"}>
        {/* Workshop info */}
        <div className="mb-6">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">{workshop.name}</Text>
          <Text className="txt-medium text-ui-fg-subtle">{workshop.address}</Text>
        </div>

        {/* Day accordions */}
        <div className="flex flex-col divide-y divide-ui-border-base border border-ui-border-base rounded-lg overflow-hidden mb-3">
          {slots.map((slot) => {
            const isExpanded = expandedDays.has(slot.date)
            const isSelected = selectedDate === slot.date

            return (
              <div key={slot.date}>
                {/* Day header */}
                <button
                  type="button"
                  onClick={() => {
                    toggleDay(slot.date)
                    window.requestAnimationFrame(() => scrollToCta())
                  }}
                  className={clx(
                    "w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-left transition-colors",
                    {
                      "bg-ui-bg-subtle": isExpanded,
                      "bg-ui-bg-base hover:bg-ui-bg-subtle": !isExpanded,
                    }
                  )}
                >
                  <span className="flex items-center gap-2">
                    {slot.label}
                    {isSelected && selectedTime && (
                      <span className="text-xs font-normal text-ui-fg-muted">
                        · {selectedTime}
                      </span>
                    )}
                  </span>
                  <ChevronIcon open={isExpanded} />
                </button>

                {/* Time slots — shown inline when expanded */}
                {isExpanded && (
                  <div className="px-4 py-4 bg-white">
                    <div className="grid grid-cols-3 gap-2">
                      {slot.times.map((time) => {
                        const isTimeSelected = isSelected && selectedTime === time
                        const slotId = `${slot.date}|${time}`
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleSelectTime(slot.date, time, workshop.name)}
                            className={clx(
                              "py-2.5 rounded-lg border text-sm font-medium transition-colors transition-shadow",
                              {
                                "bg-green-500 border-green-500 text-white": isTimeSelected,
                                "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600": !isTimeSelected,
                                "ring-2 ring-amber-400": agentPulseSlotId === slotId,
                              }
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Load more days */}
        {visibleDays < DAYS_MAX && (
          <button
            type="button"
            onClick={() => {
              setVisibleDays((n) => Math.min(n + DAYS_PER_LOAD, DAYS_MAX))
              window.requestAnimationFrame(() => scrollToCta())
            }}
            className="w-full py-2.5 text-sm font-medium text-ui-fg-subtle hover:text-ui-fg-base border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle transition-colors mb-6"
          >
            Vis fler dager
          </button>
        )}

        <div ref={ctaRef} className="mt-8 pb-8">
          <Button
            size="large"
            disabled={!bookingReady}
            onClick={() => onStepChange?.("confirmation")}
            data-testid="booking-continue-button"
          >
            {t.completeOrder}
          </Button>
        </div>
      </div>

      {/* Collapsed summary */}
      <div className={isOpen ? "hidden" : "block"}>
        {bookingReady && (
          <div className="flex flex-col w-1/3">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">Tidspunkt</Text>
            <Text className="txt-medium text-ui-fg-subtle">
              {slots.find((s) => s.date === selectedDate)?.label}, {selectedTime}
            </Text>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default Booking
