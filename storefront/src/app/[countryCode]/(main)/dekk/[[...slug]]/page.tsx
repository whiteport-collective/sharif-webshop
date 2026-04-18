import { Metadata } from "next"
import FlowShell from "@modules/home/components/flow-shell"
import { HomeLandingContent, HomeLandingFooter } from "@modules/home/components/landing-sections"
import { getStorefrontShellData } from "@modules/home/lib/storefront-shell-data"

function parseSlug(slug: string[] | undefined) {
  if (!slug?.length) {
    return null
  }

  const dimensionMatch = slug[0].match(/^(\d+)-(\d+)R(\d+)$/i)

  if (!dimensionMatch) {
    return null
  }

  return {
    profile: dimensionMatch[2],
    qty: Number(slug[2]) || 4,
    rim: dimensionMatch[3],
    season: slug[1] || "sommer",
    width: dimensionMatch[1],
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlug(slug)

  if (!parsed) {
    return { title: "Sharif | Dekk" }
  }

  const seasonNames: Record<string, string> = {
    sommer: "Sommerdekk",
    "vinter-piggfritt": "Vinterdekk piggfritt",
    "vinter-piggdekk": "Vinterdekk piggdekk",
  }
  const seasonLabel = seasonNames[parsed.season] || parsed.season
  const dimension = `${parsed.width}/${parsed.profile}R${parsed.rim}`

  return {
    title: `${dimension} ${seasonLabel} | Sharif`,
    description: `Finn ${seasonLabel.toLowerCase()} i ${dimension}. ${parsed.qty} stk. Montering inkludert.`,
  }
}

export default async function DekkPage({
  params,
}: {
  params: Promise<{ countryCode: string; slug?: string[] }>
}) {
  const { countryCode, slug } = await params
  const parsed = parseSlug(slug)
  const shellData = await getStorefrontShellData(countryCode)

  if (!shellData?.region) {
    return null
  }

  return (
    <FlowShell
      availableDimensions={shellData.availableDimensions}
      dimensionCounts={shellData.dimensionCounts}
      countryCode={countryCode}
      region={shellData.region}
      cartBadge={shellData.cartBadge}
      landingContent={<HomeLandingContent />}
      landingFooter={<HomeLandingFooter />}
      initialSearch={
        parsed
          ? {
              width: parsed.width,
              profile: parsed.profile,
              rim: parsed.rim,
              season: parsed.season,
              qty: parsed.qty,
            }
          : undefined
      }
    />
  )
}
