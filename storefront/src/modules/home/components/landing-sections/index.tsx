const HIGHLIGHTS = [
  {
    title: "Kvalitetsdekk",
    body: "Fra ledende merker som Bridgestone, Nokian og Continental. Alle dekk med EU-merking.",
    icon: (
      <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
        />
      </svg>
    ),
  },
  {
    title: "Montering inkludert",
    body: "Bestill tid hos verksted i Drammen eller Fjellhamar. Montering er alltid inkludert i prisen.",
    icon: (
      <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17l-5.71-3.12a.78.78 0 0 1 0-1.36l5.71-3.12a2.18 2.18 0 0 1 2.16 0l5.71 3.12a.78.78 0 0 1 0 1.36l-5.71 3.12a2.18 2.18 0 0 1-2.16 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.71 12.05l5.71 3.12a2.18 2.18 0 0 0 2.16 0l5.71-3.12" />
      </svg>
    ),
  },
  {
    title: "Rask levering",
    body: "Hjemlevering eller hent hos verksted. De fleste bestillinger klare innen 2-3 virkedager.",
    icon: (
      <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5M3.375 14.25h4.5"
        />
      </svg>
    ),
  },
]

const WORKSHOPS = [
  {
    city: "Drammen",
    address: "Tordenskiolds gate 73, 3044 Drammen",
  },
  {
    city: "Fjellhamar",
    address: "Industriveien 12, 1472 Fjellhamar",
  },
]

export function HomeLandingContent() {
  return (
    <div className="pb-16">
      <p className="px-4 pb-20 pt-4 text-center text-sm text-ui-fg-muted">
        60+ merker · Montering inkludert · Fra 499 kr
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <div key={item.title} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              {item.icon}
            </div>
            <h3 className="mb-1 text-base font-semibold text-ui-fg-base">{item.title}</h3>
            <p className="text-sm text-ui-fg-subtle">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeLandingFooter() {
  return (
    <div>
      <div className="border-t border-ui-border-base py-10">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-ui-fg-muted">
          Merker vi fører
        </p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
          {["Bridgestone", "Nokian", "Continental", "Michelin", "Powertrac", "Hankook"].map((brand) => (
            <span key={brand} className="text-sm font-medium text-ui-fg-subtle">
              {brand}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-ui-border-base px-6 py-12">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          {WORKSHOPS.map((workshop) => (
            <div key={workshop.city} className="rounded-xl border border-ui-border-base p-6">
              <h4 className="mb-1 text-sm font-semibold text-ui-fg-base">{workshop.city}</h4>
              <p className="text-sm text-ui-fg-subtle">{workshop.address}</p>
              <p className="mt-2 text-xs text-ui-fg-muted">Man-Fre 08:00-16:00</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
