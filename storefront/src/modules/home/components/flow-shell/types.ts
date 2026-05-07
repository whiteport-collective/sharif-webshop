import { HttpTypes } from "@medusajs/types"
import type { Lang } from "@lib/i18n"
import type { SelectedTire } from "@modules/home/components/quantity-shop"
import type { SortKey } from "@modules/products/lib/tire-sorting"
import type { FlowShellScene } from "./state"

export type SearchMeta = {
  dimension: string
  qty: number
  season: string
}

export type FlowView = "home" | "results" | "checkout"

export type SearchFormSnapshot = {
  width: string | null
  profile: string | null
  rim: string | null
  qty: number | null
  season: string | null
  submitted: boolean
}

export type CartSnapshot = {
  productId: string
  productTitle: string
  brand: string
  price: number
  qty: number
  total: number
}

export type CheckoutStepKey =
  | "delivery"
  | "address"
  | "payment"
  | "booking"
  | "confirmation"

export type AddressSnapshot = {
  filledFields: string[]
  requiredMissingFields: string[]
  isComplete: boolean
}

export type ShippingMethodSnapshot = {
  id: string
  name: string
  price: number
}

export type BookingSlotSnapshot = {
  id: string
  label: string
}

export type InitialSearch = {
  width: string
  profile: string
  rim: string
  season: string
  qty: number
}

export type FlowShellProps = {
  availableDimensions: string[]
  cartBadge: React.ReactNode
  countryCode: string
  dimensionCounts: Record<string, number>
  initialSearch?: InitialSearch
  landingContent?: React.ReactNode
  landingFooter?: React.ReactNode
  region: HttpTypes.StoreRegion
}

export type SessionContext = {
  countryCode: string
  dimension: string | null
  searchForm: SearchFormSnapshot
  scene?: FlowShellScene
  selectedProductId: string | null
  activeSort: string | null
  cart: CartSnapshot | null
  checkoutStep: CheckoutStepKey | null
  deliveryType: "workshop" | "home" | null
  address: AddressSnapshot | null
  shippingMethods: ShippingMethodSnapshot[]
  selectedShippingMethodId: string | null
  bookingSlots: BookingSlotSnapshot[]
  selectedBookingSlotId: string | null
  view: FlowView
  visibleProductIds: string[]
  visibleProducts: Array<{
    id: string
    title: string
    price: number | null
    noiseDb: number | null
    wetGrip: string | null
    fuelEfficiency: string | null
  }>
}

export type HeaderProps = {
  activeSection: FlowView
  activeSort: SortKey
  cart: HttpTypes.StoreCart | null
  cartBadge: React.ReactNode
  cartQty: number | null
  chatOpen: boolean
  checkoutLocked: boolean
  checkoutStepTitle: string
  chipDimension: string
  chipSeasonLabel: string
  displayCount: number
  handleHeaderBack: () => void
  hasSearch: boolean
  headerSortOpen: boolean
  hideBack: boolean
  lang: Lang
  langMenuOpen: boolean
  langMenuRef: React.RefObject<HTMLDivElement | null>
  menuOpen: boolean
  onClearSearch: () => void
  onRemoveLine: (lineItemId: string) => void
  onScrollHome: () => void
  onSelectLanguage: (lang: Lang) => void
  onSortChange: (key: SortKey) => void
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  setHeaderSortOpen: React.Dispatch<React.SetStateAction<boolean>>
  setLangMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  sortMenuRef: React.RefObject<HTMLDivElement | null>
  qty: number
}

export type TierRecommendation = {
  best: string
  better: string
  good: string
}

export const TIER_CONFIG = {
  best:   { rank: 1, label: "Bäst" },
  better: { rank: 2, label: "Bättre" },
  good:   { rank: 3, label: "Bra" },
} as const

export type TierKey = keyof typeof TIER_CONFIG

export type ResultsSectionProps = {
  cart: HttpTypes.StoreCart | null
  hasMoreResults: boolean
  highlightedProductIds: Set<string>
  pinRecommendations: boolean
  recommendations: TierRecommendation | null
  isLoading: boolean
  onLoadMore: () => void
  onOpenCheckout: () => void
  onProductDetail: (product: HttpTypes.StoreProduct) => void
  onRemoveTire: (product: HttpTypes.StoreProduct) => void
  onSearchChange: () => void
  onSelectTire: (product: HttpTypes.StoreProduct, qty: number) => void
  qty: number
  region: HttpTypes.StoreRegion
  searchDimension: string
  selectedTire: SelectedTire | null
  showCheckoutAction: boolean
  skeletonCount: number
  sortedProducts: HttpTypes.StoreProduct[]
  t: {
    changeSize: string
    noResults: (dim: string) => string
    noResultsHint: string
    proceedToCheckout: string
    showMore: (n: number) => string
  }
  visibleLimit: number
}
