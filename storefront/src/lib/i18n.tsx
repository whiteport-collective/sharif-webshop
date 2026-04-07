"use client"

import { createContext, useContext } from "react"

export type Lang = "no" | "en"

export type Strings = {
  // FlowShell
  homeTitle: string
  homeSubtitle: string
  noResults: (dim: string) => string
  noResultsHint: string
  changeSize: string
  showMore: (n: number) => string
  callUs: string
  selectQty: string
  stepResults: string
  proceedToCheckout: string
  // TireSearch
  tireSizeLabel: string
  findTires: string
  noTiresFound: string
  tiresFound: (n: number) => string
  summer: string
  winter: string
  typeLabel: string
  summerTires: string
  winterStudless: string
  winterStudded: string
  // TireCard
  fuel: string
  grip: string
  noise: string
  perTire: string
  priceUnavailable: string
  addToCart: string
  remove: string
  viewDetails: string
  inCart: string
  // StockBadge
  inStock: string
  lowStock: string
  outOfStock: string
  // QuantityAndShop
  selectShop: string
  homeDelivery: string
  manySlots: string
  slotsAvailable: string
  yourOrder: string
  total: string
  loadingOrder: string
  shipping: string
  mountingIncl: string
  shippingInCheckout: string
  calcShipping: string
  payNow: (total: string) => string
  waiting: string
  postalCode: string
  productDetails: string
  close: string
  productPage: string
  fromPrice: string
  orPayNow: string
  // CheckoutPanelContent
  thankYou: string
  orderNumber: string
  confirmationEmail: string
  mountingTime: string
  finalizeOrder: string
  // Order Confirmation
  deliveryMethod: string
  customerDetails: string
  payment: string
  mountingTimeStep: string
  howWasExperience: string
  talkToAI: string
  chatPlaceholder: string
  backToHome: string
  paymentSuccessful: string
}

export const UI: Record<Lang, Strings> = {
  no: {
    // FlowShell
    homeTitle: "Hva er størrelsen på dekkene dine?",
    homeSubtitle: "Se på siden av dekket — tallene ser slik ut: 205/55R16",
    noResults: (dim: string) => `Vi har ikke ${dim || "den størrelsen"} akkurat nå.`,
    noResultsHint: "Prøv en annen størrelse, eller ring oss på",
    changeSize: "Endre størrelse",
    showMore: (n: number) => `Vis fler (${n} gjenstår)`,
    callUs: "Ring oss",
    selectQty: "Velg antall",
    stepResults: "2/3 Velg dekk",
    proceedToCheckout: "Gå til kassen",
    // TireSearch
    tireSizeLabel: "Dekkstørrelse",
    findTires: "Finn dekk",
    noTiresFound: "Ingen dekk funnet i denne størrelsen",
    tiresFound: (n: number) => `${n} dekk funnet`,
    summer: "Sommer",
    winter: "Vinter",
    typeLabel: "Type",
    summerTires: "Sommerdekk",
    winterStudless: "Vinterdekk (piggfritt)",
    winterStudded: "Vinterdekk (piggdekk)",
    // TireCard
    fuel: "Drivstoff",
    grip: "Veigrep",
    noise: "Støy",
    perTire: "per dekk",
    priceUnavailable: "Pris ikke tilgjengelig",
    addToCart: "Legg i kassen",
    remove: "Fjern",
    viewDetails: "Se detaljer",
    inCart: "I kassen",
    // StockBadge
    inStock: "På lager",
    lowStock: "Få igjen",
    outOfStock: "Utsolgt",
    // QuantityAndShop
    selectShop: "Velg monteringssted",
    homeDelivery: "Hjemlevering",
    manySlots: "Mange ledige tider denne uken",
    slotsAvailable: "Ledige tider",
    yourOrder: "Din bestilling",
    total: "Totalt",
    loadingOrder: "Laster bestilling…",
    shipping: "Frakt",
    mountingIncl: "Montering inkl.",
    shippingInCheckout: "Frakt beregnes i kassen",
    calcShipping: "Trykk «Beregn pris» for å se fraktkostnad",
    payNow: (total: string) => `Betal nå — ${total}`,
    waiting: "Venter…",
    postalCode: "Postnummer",
    productDetails: "Produktdetaljer",
    close: "Lukk",
    productPage: "Produktside",
    fromPrice: "Fra 699 kr",
    orPayNow: "Eller betal nå — frakt beregnes i kassen",
    // CheckoutPanelContent
    thankYou: "Takk for bestillingen!",
    orderNumber: "Ordrenr.",
    confirmationEmail: "Bekreftelse sendt på e-post",
    mountingTime: "Monteringstidspunkt",
    finalizeOrder: "Fullfør bestilling",
    // Order Confirmation
    deliveryMethod: "Leveringsmåte",
    customerDetails: "Kundeopplysninger",
    payment: "Betaling",
    mountingTimeStep: "Monteringstid",
    howWasExperience: "Hvordan var opplevelsen?",
    talkToAI: "Snakk med vår AI",
    chatPlaceholder: "Har du tankar och frågor om din bestilling...",
    backToHome: "Tilbake til forsiden",
    paymentSuccessful: "Betaling gjennomført",
  },
  en: {
    // FlowShell
    homeTitle: "What size are your tires?",
    homeSubtitle: "Check the sidewall — the numbers look like this: 205/55R16",
    noResults: (dim: string) => `We don't have ${dim || "that size"} right now.`,
    noResultsHint: "Try another size, or call us at",
    changeSize: "Change size",
    showMore: (n: number) => `Show more (${n} remaining)`,
    callUs: "Call us",
    selectQty: "Select quantity",
    stepResults: "2/3 Choose tires",
    proceedToCheckout: "Proceed to checkout",
    // TireSearch
    tireSizeLabel: "Tire size",
    findTires: "Find tires",
    noTiresFound: "No tires found in this size",
    tiresFound: (n: number) => `${n} tires found`,
    summer: "Summer",
    winter: "Winter",
    typeLabel: "Type",
    summerTires: "Summer tires",
    winterStudless: "Winter tires (studless)",
    winterStudded: "Winter tires (studded)",
    // TireCard
    fuel: "Fuel",
    grip: "Wet grip",
    noise: "Noise",
    perTire: "per tire",
    priceUnavailable: "Price unavailable",
    addToCart: "Add to cart",
    remove: "Remove",
    viewDetails: "View details",
    inCart: "In cart",
    // StockBadge
    inStock: "In stock",
    lowStock: "Low stock",
    outOfStock: "Out of stock",
    // QuantityAndShop
    selectShop: "Select fitting location",
    homeDelivery: "Home delivery",
    manySlots: "Many available slots this week",
    slotsAvailable: "Available slots",
    yourOrder: "Your order",
    total: "Total",
    loadingOrder: "Loading order…",
    shipping: "Shipping",
    mountingIncl: "Fitting incl.",
    shippingInCheckout: "Shipping calculated at checkout",
    calcShipping: "Click «Calculate price» to see shipping cost",
    payNow: (total: string) => `Pay now — ${total}`,
    waiting: "Please wait…",
    postalCode: "Postal code",
    productDetails: "Product details",
    close: "Close",
    productPage: "Product page",
    fromPrice: "From 699 kr",
    orPayNow: "Or pay now — shipping calculated at checkout",
    // CheckoutPanelContent
    thankYou: "Thanks for your order!",
    orderNumber: "Order",
    confirmationEmail: "Confirmation sent by email",
    mountingTime: "Fitting appointment",
    finalizeOrder: "Finalize order",
    // Order Confirmation
    deliveryMethod: "Delivery method",
    customerDetails: "Customer details",
    payment: "Payment",
    mountingTimeStep: "Fitting time",
    howWasExperience: "How was your experience?",
    talkToAI: "Talk to our AI",
    chatPlaceholder: "Questions about your order...",
    backToHome: "Back to home",
    paymentSuccessful: "Payment successful",
  },
}

export const LanguageContext = createContext<{
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
}>({
  lang: "no",
  setLang: () => {},
  t: UI.no,
})

export function useLanguage() {
  return useContext(LanguageContext)
}
