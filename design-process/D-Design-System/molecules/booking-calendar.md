# Booking Calendar

**COMPONENT ID:** `mol-booking-calendar`
**Atomic Level:** Molecule (date picker + time slot list + confirmation view)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `btn` + `join` + Tailwind utilities

---

## Purpose

Post-payment time slot booking for tire mounting. The customer picks a date and time that works for them, or skips to book later via email reminder. Two views: selection and confirmation. Data sourced from Google Calendar API (POC phase).

---

## Anatomy

### View 1: Booking Selection

```
┌─────────────────────────────────────┐
│         Velg tid for montering      │  Heading
├─────────────────────────────────────┤
│                                     │
│  ◀  Uke 14 — Mars 2026  ▶          │  Week navigation
│                                     │
│  Man  Tir  Ons  Tor  Fre  Lør      │  Day headers
│  [31] [01] [02] [03] [04] [05]     │  Tappable date cells
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Ledige tider for 02. april:        │  Time slot heading
│                                     │
│  [10:00] [11:00] [12:00] [13:00]   │  Time slot pills
│  [14:00] [15:00]                    │
│                                     │
├─────────────────────────────────────┤
│  [ Bekreft tid ]                    │  Confirm CTA
│                                     │
│  Velg tid senere →                  │  Skip link
└─────────────────────────────────────┘
```

### View 2: Confirmation

```
┌─────────────────────────────────────┐
│            ✓ Booket!                │  Success icon + heading
├─────────────────────────────────────┤
│                                     │
│  Dato:    Onsdag 02. april 2026     │
│  Tid:     12:00                     │
│  Adresse: Sharif Dekk AS            │
│           Gatenavn 123, 0000 Oslo   │
│                                     │
│  Vi sees!                           │  Friendly sign-off
│                                     │
└─────────────────────────────────────┘
```

---

## States

### Empty (no date selected)

- Week calendar shows current week
- No time slots visible
- Confirm button disabled

### Date Selected

- Selected date cell highlighted: `btn-primary`
- Time slots for that date fetched from Google Calendar API and rendered as pills
- Unavailable dates are dimmed / non-tappable

### Time Slot Selected

- Selected slot highlighted in red: `bg-error text-error-content`
- Confirm button enabled: `btn-primary`

### Loading

- While fetching availability from Google Calendar API
- Skeleton placeholders on time slot area
- daisyUI: `skeleton` on time slot pills

### Confirmation

- View switches to confirmation layout
- Shows booked date, time, and address
- No further interaction needed

### Skipped

- User taps "Choose time later"
- Triggers email reminder flow
- Shows brief confirmation: "We'll send you an email to book your time."

---

## Sub-Components

### Week Navigation

**OBJECT ID:** `mol-booking-week-nav`

| Property | Value |
|----------|-------|
| Element | `<div>` with prev/next buttons and week label |
| Prev/Next | `<button>` with `btn btn-ghost btn-sm btn-circle` |
| Label | "Uke {n} — {month} {year}" (NO) / "Week {n} — {month} {year}" (EN) |
| Behavior | Navigate forward/backward by week. Cannot go before current week. |

### Date Grid

**OBJECT ID:** `mol-booking-date-grid`

| Property | Value |
|----------|-------|
| Element | Grid of `<button>` elements, one per weekday (Mon–Sat) |
| daisyUI (default) | `btn btn-ghost btn-sm` |
| daisyUI (selected) | `btn btn-primary btn-sm` |
| daisyUI (unavailable) | `btn btn-ghost btn-sm btn-disabled opacity-30` |
| Day headers | `text-xs text-base-content/50 font-medium` |
| Behavior | Tap date → fetch time slots, highlight date |

### Time Slot List

**OBJECT ID:** `mol-booking-time-slots`

| Property | Value |
|----------|-------|
| Element | `<div>` wrapping `<button>` pills |
| Container | `flex flex-wrap gap-2` |
| daisyUI (default) | `join-item btn btn-sm btn-outline` |
| daisyUI (selected) | `join-item btn btn-sm bg-error text-error-content` |
| Content | Time strings: "10:00", "11:00", "12:00", etc. |
| Behavior | Tap slot → select, highlight red, enable confirm button |
| Data source | Google Calendar API — free slots for selected date |

### Confirm Button

**OBJECT ID:** `mol-booking-confirm-btn`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| daisyUI (enabled) | `btn btn-primary btn-block` |
| daisyUI (disabled) | `btn btn-primary btn-block btn-disabled` |
| Label (NO) | "Bekreft tid" |
| Label (EN) | "Confirm time" |
| Behavior | on:click → book slot via API, switch to confirmation view |

### Skip Link

**OBJECT ID:** `mol-booking-skip`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| daisyUI | `btn btn-ghost btn-sm` |
| Label (NO) | "Velg tid senere" |
| Label (EN) | "Choose time later" |
| Behavior | on:click → trigger email reminder, show skip confirmation |

### Confirmation View

**OBJECT ID:** `mol-booking-confirmation`

| Property | Value |
|----------|-------|
| Element | `<div>` |
| Layout | Centered, stacked text |
| Heading daisyUI | `text-2xl font-bold text-center` |
| Details | Key-value pairs: date, time, address |
| Sign-off (NO) | "Vi sees!" |
| Sign-off (EN) | "See you!" |

---

## Translations

| Key | NO | EN |
|-----|----|----|
| `booking.heading` | "Velg tid for montering" | "Choose mounting time" |
| `booking.week-label` | "Uke {n} — {month} {year}" | "Week {n} — {month} {year}" |
| `booking.slots-heading` | "Ledige tider for {date}:" | "Available times for {date}:" |
| `booking.confirm` | "Bekreft tid" | "Confirm time" |
| `booking.skip` | "Velg tid senere" | "Choose time later" |
| `booking.skip-confirmation` | "Vi sender deg en e-post for å booke tid." | "We'll send you an email to book your time." |
| `booking.confirmed-heading` | "Booket!" | "Booked!" |
| `booking.date-label` | "Dato" | "Date" |
| `booking.time-label` | "Tid" | "Time" |
| `booking.address-label` | "Adresse" | "Address" |
| `booking.sign-off` | "Vi sees!" | "See you!" |
| `booking.day.mon` | "Man" | "Mon" |
| `booking.day.tue` | "Tir" | "Tue" |
| `booking.day.wed` | "Ons" | "Wed" |
| `booking.day.thu` | "Tor" | "Thu" |
| `booking.day.fri` | "Fre" | "Fri" |
| `booking.day.sat` | "Lør" | "Sat" |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full width. Date grid and time slots stack vertically. Single column layout. |
| **Tablet (768px-1024px)** | Centered card, max-width 480px. Same stacked layout. |
| **Desktop (>= 1024px)** | Centered card, max-width 480px. Could sit in a side panel or modal. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Container label | `aria-label="Booking calendar"` on root |
| Date grid | `role="grid"`, date cells have `role="gridcell"` |
| Selected date | `aria-selected="true"` on selected date |
| Time slots | `role="radiogroup"` on time slot container |
| Selected slot | `aria-checked="true"` on selected time slot |
| Keyboard nav | Arrow keys navigate dates, Tab to time slots, Enter/Space to select |
| Screen reader | Announces: "Wednesday April 2, selected. 3 available time slots." |
| Skip link | Accessible as standard button, announced as "Choose time later" |
| Confirmation | `role="status"`, `aria-live="polite"` on confirmation view |

---

## Technical Notes

- Data source: Google Calendar API (POC) — fetches free/busy for the workshop calendar
- On date select: `GET /api/availability?date={YYYY-MM-DD}` → returns array of available time strings
- On confirm: `POST /api/booking` with `{ date, time, orderId }` → creates calendar event
- Skip flow: `POST /api/booking/remind` with `{ email, orderId }` → queues email reminder
- Loading state shows skeleton placeholders while API responds
- Calendar starts on current week, cannot navigate to past weeks
- Saturday included (workshop may have Saturday hours), Sunday excluded
- Selected time slot uses `bg-error` (red) per brand requirement — stands out from primary blue
- View transition between selection and confirmation is a simple conditional render, no animation needed

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Booking Calendar](../../../D-Design-System/molecules/booking-calendar.md) |
```

Used in:
- Post-payment confirmation page — primary usage
- Email link landing page — for customers who skipped initial booking

---

_Created using Whiteport Design Studio (WDS) methodology_
