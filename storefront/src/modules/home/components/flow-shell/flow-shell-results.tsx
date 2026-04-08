"use client"

import TireCard from "@modules/products/components/tire-card"
import type { ResultsSectionProps } from "./types"

function TireCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-full rounded bg-gray-100" />
        </div>
        <div className="mt-2 h-6 w-1/3 rounded bg-gray-200" />
        <div className="h-5 w-1/4 rounded-full bg-gray-100" />
      </div>
      <div className="mx-4 mb-4 mt-auto h-11 rounded-lg bg-gray-200" />
    </div>
  )
}

function ResultsGrid({
  isLoading,
  onProductDetail,
  onRemoveTire,
  onSelectTire,
  qty,
  region,
  selectedTire,
  skeletonCount,
  sortedProducts,
  visibleLimit,
}: {
  isLoading: boolean
  onProductDetail: (product: ResultsSectionProps["sortedProducts"][number]) => void
  onRemoveTire: () => void
  onSelectTire: (product: ResultsSectionProps["sortedProducts"][number], qty: number) => void
  qty: number
  region: ResultsSectionProps["region"]
  selectedTire: ResultsSectionProps["selectedTire"]
  skeletonCount: number
  sortedProducts: ResultsSectionProps["sortedProducts"]
  visibleLimit: number
}) {
  if (isLoading) {
    return Array.from({ length: skeletonCount }).map((_, index) => <TireCardSkeleton key={index} />)
  }

  return sortedProducts.slice(0, visibleLimit).map((product) => (
    <TireCard
      key={product.id}
      product={product}
      region={region}
      qty={qty}
      isInCart={selectedTire?.product.id === product.id}
      onSelectTire={onSelectTire}
      onRemoveTire={onRemoveTire}
      onProductDetail={onProductDetail}
    />
  ))
}

export function FlowShellResults({
  hasMoreResults,
  isLoading,
  onLoadMore,
  onOpenCheckout,
  onProductDetail,
  onRemoveTire,
  onSearchChange,
  onSelectTire,
  qty,
  region,
  searchDimension,
  selectedTire,
  showCheckoutAction,
  skeletonCount,
  sortedProducts,
  t,
  visibleLimit,
}: ResultsSectionProps) {
  if (!isLoading && sortedProducts.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg text-ui-fg-base">{t.noResults(searchDimension)}</p>
        <p className="mt-2 text-sm text-ui-fg-subtle">
          {t.noResultsHint}{" "}
          <a href="tel:+4793485790" className="font-medium underline">
            +47 934 85 790
          </a>
          .
        </p>
        <button
          type="button"
          onClick={onSearchChange}
          className="mt-6 inline-block rounded-lg bg-ui-button-neutral px-5 py-2.5 text-sm font-medium text-ui-button-neutral-fg hover:bg-ui-button-neutral-hover"
        >
          {t.changeSize}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 pb-8 pt-20 md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <ResultsGrid
            isLoading={isLoading}
            onProductDetail={onProductDetail}
            onRemoveTire={onRemoveTire}
            onSelectTire={onSelectTire}
            qty={qty}
            region={region}
            selectedTire={selectedTire}
            skeletonCount={skeletonCount}
            sortedProducts={sortedProducts}
            visibleLimit={visibleLimit}
          />
        </div>
      </div>

      <div className="hidden px-4 pb-8 pt-20 md:block">
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
          <ResultsGrid
            isLoading={isLoading}
            onProductDetail={onProductDetail}
            onRemoveTire={onRemoveTire}
            onSelectTire={onSelectTire}
            qty={qty}
            region={region}
            selectedTire={selectedTire}
            skeletonCount={skeletonCount}
            sortedProducts={sortedProducts}
            visibleLimit={visibleLimit}
          />
        </div>
      </div>

      {(hasMoreResults || showCheckoutAction) && (
        <div className="px-3 pb-12 md:px-4">
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
            {hasMoreResults && (
              <button
                type="button"
                onClick={onLoadMore}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-base px-6 py-2.5 text-sm font-medium text-ui-fg-base transition-colors hover:bg-ui-bg-subtle"
              >
                {t.showMore(sortedProducts.length - visibleLimit)}
              </button>
            )}

            {showCheckoutAction && (
              <button
                type="button"
                onClick={onOpenCheckout}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                {t.proceedToCheckout}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
