import { UI, type Lang } from "@lib/i18n"

export function buildDekkPath(width: string, profile: string, rim: string, season: string, qty: number) {
  return `/dekk/${width}-${profile}R${rim}/${season}/${qty}`
}

export function parseDekkPath(pathname: string) {
  const match = pathname.match(/^\/dekk\/(\d+)-(\d+)R(\d+)\/([^/]+?)(?:\/(\d+))?$/)

  if (!match) {
    return null
  }

  return {
    width: match[1],
    profile: match[2],
    rim: match[3],
    season: match[4],
    qty: match[5] || "4",
  }
}

export function getSeasonLabel(season: string, lang: Lang) {
  const strings = UI[lang]

  switch (season) {
    case "sommer":
      return strings.summerTires
    case "vinter-piggfritt":
      return strings.winterStudless
    case "vinter-piggdekk":
      return strings.winterStudded
    default:
      return season.charAt(0).toUpperCase() + season.slice(1)
  }
}

export function getSeasonChipLabel(season: string, lang: Lang) {
  switch (season) {
    case "sommer":
      return lang === "en" ? "Summer" : "Sommer"
    case "vinter-piggfritt":
      return lang === "en" ? "Studless" : "Piggfri"
    case "vinter-piggdekk":
      return lang === "en" ? "Studded" : "Pigg"
    default:
      return getSeasonLabel(season, lang)
  }
}

export function getSkeletonCount(knownCount: number) {
  return Math.min(knownCount || 4, 8)
}
