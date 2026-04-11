<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { FlowProduct } from "../../lib/flow";

  export let product: FlowProduct;
  export let locale: "no" | "en" = "no";

  const dispatch = createEventDispatcher<{ select: FlowProduct }>();

  $: fuelLabel = locale === "no" ? "Drivstoff" : "Fuel";
  $: gripLabel = locale === "no" ? "Veigrep" : "Grip";
  $: noiseLabel = locale === "no" ? "Støy" : "Noise";

  function gradeToPercent(grade: string) {
    return { A: 100, B: 82, C: 64, D: 46, E: 28, F: 18, G: 10 }[grade] ?? 0;
  }

  function noiseToPercent(noiseDb: number) {
    return Math.max(18, Math.min(100, 100 - (noiseDb - 66) * 11));
  }

  function formatPrice(value: number) {
    return locale === "no"
      ? `${new Intl.NumberFormat("nb-NO").format(value)} kr`
      : `${new Intl.NumberFormat("en-US").format(value)} NOK`;
  }

  function stockCopy() {
    if (product.stockStatus === "in-stock") return locale === "no" ? "På lager" : "In stock";
    if (product.stockStatus === "low-stock") return locale === "no" ? "Få igjen" : "Low stock";
    return locale === "no" ? "Ikke på lager" : "Out of stock";
  }
</script>

<button
  type="button"
  class="card card-compact w-full snap-start border border-base-300 bg-base-100 text-left shadow-xl transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-2xl"
  on:click={() => dispatch("select", product)}
>
  <figure class="aspect-square bg-base-200 p-5">
    <img src={product.imageUrl} alt={product.imageAlt} class="h-full w-full object-contain" />
  </figure>
  <div class="card-body gap-4">
    <div class="space-y-1">
      <h3 class="card-title font-display text-2xl leading-none">{product.brand} {product.model}</h3>
      <p class="text-sm text-base-content/65">{product.dimensionLabel}</p>
    </div>

    <div class="space-y-2">
      <div class="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-sm text-success">
        <span>{fuelLabel}</span>
        <progress class="progress progress-success h-2 w-full" value={gradeToPercent(product.fuelRating)} max="100"></progress>
        <strong>{product.fuelRating}</strong>
      </div>
      <div class="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-sm text-warning">
        <span>{gripLabel}</span>
        <progress class="progress progress-warning h-2 w-full" value={gradeToPercent(product.gripRating)} max="100"></progress>
        <strong>{product.gripRating}</strong>
      </div>
      <div class="grid grid-cols-[72px_1fr_auto] items-center gap-2 text-sm text-info">
        <span>{noiseLabel}</span>
        <progress class="progress progress-info h-2 w-full" value={noiseToPercent(product.noiseDb)} max="100"></progress>
        <strong>{product.noiseDb} dB</strong>
      </div>
    </div>

    <div class="space-y-1">
      <p class="font-display text-4xl leading-none">{formatPrice(product.price)}</p>
      <p class="text-sm text-base-content/60">{locale === "no" ? "per dekk" : "per tire"}</p>
    </div>

    <div>
      <span
        class={`badge rounded-full px-3 py-3 text-xs font-extrabold uppercase ${
          product.stockStatus === "in-stock"
            ? "badge-success"
            : product.stockStatus === "low-stock"
              ? "badge-warning"
              : "badge-ghost"
        }`}
      >
        {stockCopy()}
      </span>
    </div>
  </div>
</button>
