export type SortKey = "price" | "best" | "grip" | "fuel" | "noise" | "performance"

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Laveste pris først" },
  { key: "best", label: "Best vurdert" },
  { key: "grip", label: "Beste veggrep" },
  { key: "fuel", label: "Mest drivstofføkonomisk" },
  { key: "noise", label: "Stillest" },
]
