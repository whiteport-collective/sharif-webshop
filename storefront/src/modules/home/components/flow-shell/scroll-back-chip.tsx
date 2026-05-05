"use client"

type ScrollBackChipProps = {
  visible: boolean
  onBack: () => void
}

export function ScrollBackChip({ visible, onBack }: ScrollBackChipProps) {
  return (
    <button
      type="button"
      aria-label="Tilbake"
      onClick={onBack}
      className={[
        "fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20",
        "transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100 duration-200"
          : "pointer-events-none -translate-y-12 opacity-0",
      ].join(" ")}
    >
      &larr; Tilbake
    </button>
  )
}
