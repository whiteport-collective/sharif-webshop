"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useRouter } from "next/navigation"
import { useState } from "react"

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

// Generate mock time slots for the next 5 weekdays
function getAvailableSlots() {
  const slots: { date: string; label: string; times: string[] }[] = []
  const now = new Date()
  let day = new Date(now)
  day.setDate(day.getDate() + 1)

  while (slots.length < 5) {
    const dow = day.getDay()
    if (dow !== 0 && dow !== 6) {
      const label = day.toLocaleDateString("nb-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      const dateStr = day.toISOString().split("T")[0]
      slots.push({
        date: dateStr,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        times: ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"],
      })
    }
    day = new Date(day)
    day.setDate(day.getDate() + 1)
  }
  return slots
}

type BookingTemplateProps = {
  order: HttpTypes.StoreOrder
  typeCode: string
  countryCode: string
}

export default function BookingTemplate({
  order,
  typeCode,
  countryCode,
}: BookingTemplateProps) {
  const router = useRouter()
  const workshop = WORKSHOPS[typeCode]
  const slots = getAvailableSlots()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const selectedSlot = slots.find((s) => s.date === selectedDate)

  const handleConfirm = () => {
    setConfirming(true)
    router.push(`/${countryCode}/order/${order.id}/confirmed`)
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container max-w-2xl mx-auto flex flex-col gap-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-ui-fg-base mb-1">
            Book ditt monteringstidspunkt
          </h1>
          <p className="text-ui-fg-subtle">
            {workshop?.name} — {workshop?.address}
          </p>
        </div>

        {/* Date picker */}
        <div>
          <p className="text-sm font-medium text-ui-fg-base mb-3">Velg dag</p>
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <button
                key={slot.date}
                type="button"
                onClick={() => {
                  setSelectedDate(slot.date)
                  setSelectedTime(null)
                }}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  selectedDate === slot.date
                    ? "border-ui-border-interactive bg-ui-bg-interactive text-ui-fg-on-color"
                    : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        {selectedSlot && (
          <div>
            <p className="text-sm font-medium text-ui-fg-base mb-3">
              Velg tidspunkt
            </p>
            <div className="grid grid-cols-3 gap-2">
              {selectedSlot.times.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? "border-ui-border-interactive bg-ui-bg-interactive text-ui-fg-on-color"
                      : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={!selectedDate || !selectedTime || confirming}
            onClick={handleConfirm}
            className="w-full py-3 rounded-lg bg-ui-button-inverted text-ui-fg-on-color text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {confirming ? "Bekrefter..." : "Bekreft tidspunkt"}
          </button>
          <LocalizedClientLink
            href={`/order/${order.id}/confirmed`}
            className="text-center text-sm text-ui-fg-subtle hover:text-ui-fg-base"
          >
            Hopp over — jeg vil booke senere
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
