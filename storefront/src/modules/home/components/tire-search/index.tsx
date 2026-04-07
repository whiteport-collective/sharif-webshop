"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo, useRef, useEffect } from "react"
import { useLanguage } from "@lib/i18n"

export type TireSearchParams = {
  width: string
  profile: string
  rim: string
  qty: string
  season: string
}

type Props = {
  availableDimensions: string[]
  dimensionCounts?: Record<string, number>
  onSearch?: (params: TireSearchParams) => void
  onDimensionChange?: (dimension: string | null) => void
  onFormChange?: (params: TireSearchParams | null) => void
  previewCount?: number
  onMount?: (setDimension: (width: string, profile: string, rim: string) => void) => void
}

type Segment = "width" | "profile" | "rim"

function SegmentInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  disabled,
  inputRef,
  onKeyDown,
  onPaste,
  displayTransform,
  popularValue,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (v: string) => void
  suggestions: string[]
  placeholder: string
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void
  displayTransform?: (s: string) => string
  popularValue?: string
}) {
  const [open, setOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false) // true = show all, false = filter by typed
  const [highlighted, setHighlighted] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const norm = value.replace(/^[a-zA-Z]+/, "")

  // In select mode show all suggestions; in type mode filter by what's typed
  const filtered = useMemo(() => {
    if (selectMode || !norm) return suggestions
    return suggestions.filter((s) => s.startsWith(norm))
  }, [suggestions, norm, selectMode])

  const showList = open && filtered.length > 0

  // Scroll highlighted item to top of list when list opens (selectMode),
  // use nearest during keyboard navigation
  useEffect(() => {
    if (!showList || !listRef.current) return
    const el = listRef.current.children[highlighted] as HTMLElement | undefined
    if (!el) return
    if (selectMode) {
      // Center the highlighted item in the visible area so items above are also visible
      const listHeight = listRef.current.clientHeight
      listRef.current.scrollTop = el.offsetTop - listHeight / 2 + el.offsetHeight / 2
    } else {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [highlighted, showList, selectMode])

  function handleSelect(v: string) {
    onSelect(v)
    setOpen(false)
    setSelectMode(false)
    setHighlighted(0)
  }

  function handleFocus() {
    setOpen(true)
    if (norm) {
      // Re-opening a filled field: show all options, highlight current
      setSelectMode(true)
      const idx = suggestions.indexOf(norm)
      setHighlighted(idx >= 0 ? idx : 0)
    } else if (popularValue) {
      // Empty field: scroll to most popular option
      setSelectMode(true)
      const idx = suggestions.indexOf(popularValue)
      setHighlighted(idx >= 0 ? idx : 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showList) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (filtered[highlighted]) {
          e.preventDefault()
          handleSelect(filtered[highlighted])
          return
        }
      }
    }
    onKeyDown?.(e)
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value
          setSelectMode(false) // typing exits select mode → filter mode
          onChange(val)
          setOpen(true)
          setHighlighted(0)
          // Auto-advance when typed value exactly matches one suggestion
          const normVal = val.replace(/^[a-zA-Z]+/, "")
          const matches = suggestions.filter((s) => s.startsWith(normVal))
          if (matches.length === 1 && matches[0] === normVal) {
            setTimeout(() => onSelect(matches[0]), 0)
          }
        }}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => { setOpen(false); setSelectMode(false) }, 150)}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        className="w-full py-2.5 text-lg font-semibold bg-transparent focus:outline-none text-center disabled:text-ui-fg-muted placeholder:text-ui-fg-muted placeholder:font-normal"
        autoComplete="off"
      />
      {showList && (
        <ul
          ref={listRef}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-1 bg-white border border-ui-border-base rounded-lg shadow-lg overflow-y-auto max-h-48 min-w-[80px]"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => handleSelect(s)}
              className={`px-4 py-2 text-center cursor-pointer text-sm ${
                s === norm
                  ? "bg-ui-fg-base text-ui-bg-base font-semibold"
                  : i === highlighted
                  ? "bg-ui-bg-subtle font-semibold"
                  : "hover:bg-ui-bg-subtle"
              }`}
            >
              {displayTransform ? displayTransform(s) : s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function TireSearch({ availableDimensions, dimensionCounts, onSearch, onDimensionChange, onFormChange, previewCount, onMount }: Props) {
  const { t } = useLanguage()
  const [width, setWidth] = useState("")
  const [profile, setProfile] = useState("")
  const [rim, setRim] = useState("")
  const [rimLetterSeen, setRimLetterSeen] = useState(false)
  const [quantity, setQuantity] = useState("4")
  const [season, setSeason] = useState("sommer")
  const [agentPulse, setAgentPulse] = useState(false)
  const router = useRouter()

  // Expose setDimension to parent (used by agent fillDimensionField tool)
  useEffect(() => {
    if (!onMount) return
    onMount((w: string, p: string, r: string) => {
      setWidth(w)
      setProfile(p)
      setRim(r)
      setRimLetterSeen(false)
      setAgentPulse(true)
      setTimeout(() => setAgentPulse(false), 1200)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const profileRef = useRef<HTMLInputElement>(null)
  const rimRef = useRef<HTMLInputElement>(null)

  const widths = useMemo(() => {
    const all = availableDimensions.map((d) => d.split("/")[0])
    return Array.from(new Set(all)).sort((a, b) => Number(a) - Number(b))
  }, [availableDimensions])

  const profiles = useMemo(() => {
    if (!width) return []
    const all = availableDimensions
      .filter((d) => d.startsWith(width + "/"))
      .map((d) => d.split("/")[1].replace(/R\d+$/, ""))
    return Array.from(new Set(all)).filter((p) => Number(p) > 0).sort((a, b) => Number(a) - Number(b))
  }, [availableDimensions, width])

  const rims = useMemo(() => {
    if (!width || !profile) return []
    const prefix = `${width}/${profile}R`
    const all = availableDimensions
      .filter((d) => d.startsWith(prefix))
      .map((d) => d.split("R")[1])
    return Array.from(new Set(all)).sort((a, b) => Number(a) - Number(b))
  }, [availableDimensions, width, profile])

  // Most popular value per segment, derived from dimensionCounts
  const popularWidth = useMemo(() => {
    if (!dimensionCounts) return undefined
    const counts: Record<string, number> = {}
    for (const [dim, n] of Object.entries(dimensionCounts)) {
      const w = dim.split("/")[0]
      counts[w] = (counts[w] ?? 0) + n
    }
    return widths.reduce((best, w) => (counts[w] ?? 0) > (counts[best] ?? 0) ? w : best, widths[0])
  }, [dimensionCounts, widths])

  const popularProfile = useMemo(() => {
    if (!dimensionCounts || !width) return undefined
    const counts: Record<string, number> = {}
    for (const [dim, n] of Object.entries(dimensionCounts)) {
      if (!dim.startsWith(width + "/")) continue
      const p = dim.split("/")[1].replace(/R\d+$/, "")
      counts[p] = (counts[p] ?? 0) + n
    }
    return profiles.reduce((best, p) => (counts[p] ?? 0) > (counts[best] ?? 0) ? p : best, profiles[0])
  }, [dimensionCounts, width, profiles])

  const popularRim = useMemo(() => {
    if (!dimensionCounts || !width || !profile) return undefined
    const prefix = `${width}/${profile}R`
    const counts: Record<string, number> = {}
    for (const [dim, n] of Object.entries(dimensionCounts)) {
      if (!dim.startsWith(prefix)) continue
      const r = dim.split("R")[1]
      counts[r] = (counts[r] ?? 0) + n
    }
    return rims.reduce((best, r) => (counts[r] ?? 0) > (counts[best] ?? 0) ? r : best, rims[0])
  }, [dimensionCounts, width, profile, rims])

  function handleWidthSelect(val: string) {
    setWidth(val)
    setProfile("")
    setRim("")
    setRimLetterSeen(false)
    profileRef.current?.focus()
  }

  function handleProfileSelect(val: string) {
    setProfile(val)
    setRim("")
    setRimLetterSeen(false)
    rimRef.current?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").trim()
    // Matches: 205/55R16, 205/55 R16, 205 55 16, 205/55R16 91V, etc.
    const match = text.match(/^(\d{3})[\s\/\-]?(\d{2,3})[\s\/\-]*[A-Za-z]*[\s\/\-]*(\d{2})/)
    if (!match) return
    const [, w, p, r] = match
    if (availableDimensions.includes(`${w}/${p}R${r}`)) {
      e.preventDefault()
      setWidth(w)
      setProfile(p)
      setRim(r)
      setRimLetterSeen(/[A-Za-z]/.test(text))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!width || !profile || !rim) return
    if (onSearch) {
      onSearch({ width, profile, rim: rimNorm, qty: quantity, season })
    } else {
      router.push(
        `/search?w=${width}&p=${profile}&r=${rimNorm}&qty=${quantity}&season=${season}`
      )
    }
  }

  const rimNorm = rim.replace(/^[a-zA-Z]+/, "")
  const isComplete =
    widths.includes(width) &&
    profiles.includes(profile) &&
    rims.includes(rimNorm)

  useEffect(() => {
    if (onDimensionChange) {
      onDimensionChange(isComplete ? `${width}/${profile}R${rimNorm}` : null)
    }
    if (onFormChange) {
      onFormChange(isComplete ? { width, profile, rim: rimNorm, qty: quantity, season } : null)
    }
  }, [isComplete, width, profile, rimNorm, quantity, season])

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Quantity + Season */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1.5">
            Antall
          </label>
          <select
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-ui-border-base rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ui-fg-base transition-colors bg-white"
          >
            <option value="4">4 stk</option>
            <option value="2">2 stk</option>
            <option value="1">1 stk</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1.5">
            {t.typeLabel}
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full border border-ui-border-base rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ui-fg-base transition-colors bg-white"
          >
            <option value="sommer">{t.summerTires}</option>
            <option value="vinter-piggfritt">{t.winterStudless}</option>
            <option value="vinter-piggdekk">{t.winterStudded}</option>
          </select>
        </div>
      </div>

      {/* Dimension selector — three text inputs in one visual field */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1.5">
          {t.tireSizeLabel}
        </label>
        <div className={`flex items-center border rounded-lg px-3 transition-all bg-white focus-within:border-ui-fg-base ${agentPulse ? "border-amber-400 ring-2 ring-amber-200 animate-pulse" : "border-ui-border-base"}`}>
          <SegmentInput
            value={width}
            onChange={(v) => { setWidth(v); setProfile(""); setRim("") }}
            onSelect={handleWidthSelect}
            suggestions={widths}
            placeholder="205"
            onPaste={handlePaste}
            popularValue={popularWidth}
          />
          <span className={`text-lg font-medium select-none ${width ? "text-ui-fg-base" : "text-ui-fg-muted"}`}>/</span>
          <SegmentInput
            value={profile}
            onChange={(v) => { setProfile(v); setRim("") }}
            onSelect={handleProfileSelect}
            suggestions={profiles}
            placeholder="55"
            disabled={!width}
            inputRef={profileRef}
            onPaste={handlePaste}
            popularValue={popularProfile}
          />
          {(rimLetterSeen || rim) && <span className="text-lg font-medium select-none text-ui-fg-base">R</span>}
          <SegmentInput
            value={rim}
            onChange={(v) => {
              if (/^[a-zA-Z]/.test(v)) setRimLetterSeen(true)
              setRim(v.replace(/^[a-zA-Z]+/, ""))
            }}
            onSelect={(v) => setRim(v)}
            suggestions={rims}
            placeholder="16"
            disabled={!profile}
            inputRef={rimRef}
            onPaste={handlePaste}
            popularValue={popularRim}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && rim === "") {
                setRimLetterSeen(false)
                profileRef.current?.focus()
              }
            }}
          />
        </div>
        {isComplete && (
          <p className="mt-2 text-center text-sm font-medium text-ui-fg-subtle transition-opacity duration-200">
            {previewCount !== undefined
              ? previewCount === 0
                ? t.noTiresFound
                : t.tiresFound(previewCount)
              : `${width}/${profile}R${rimNorm}`}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isComplete}
        className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t.findTires}
      </button>
    </form>
  )
}
