import { HttpTypes } from "@medusajs/types"
import type { Lang } from "@lib/i18n"
import type { SelectedTire } from "@modules/home/components/quantity-shop"
import type { SortKey } from "@modules/products/lib/tire-sorting"

export type SearchMeta = {
  dimension: string
  qty: number
  season: string
}

export type FlowView = "home" | "results" | "checkout"

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
  cartItems: { productId: string; qty: number }[]
  dimension: string | null
  step: string | null
  view: FlowView
  visibleProductIds: string[]
}

export type HeaderProps = {
  activeSection: FlowView
  activeSort: SortKey
  cartBadge: React.ReactNode
  chatOpen: boolean
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

export type ResultsSectionProps = {
  hasMoreResults: boolean
  isLoading: boolean
  onLoadMore: () => void
  onOpenCheckout: () => void
  onProductDetail: (product: HttpTypes.StoreProduct) => void
  onRemoveTire: () => void
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
