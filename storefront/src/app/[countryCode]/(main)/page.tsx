import { Metadata } from "next"
import FlowShell from "@modules/home/components/flow-shell"
import { HomeLandingContent, HomeLandingFooter } from "@modules/home/components/landing-sections"
import { getStorefrontShellData } from "@modules/home/lib/storefront-shell-data"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Sharif | Kvalitetsdekk for nordiske forhold",
  description: "Finn dekk til din bil. Skriv inn dekkstørrelsen og finn de beste prisene.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
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
    />
  )
}
