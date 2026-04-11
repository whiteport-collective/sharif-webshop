<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { FlowProduct } from "../../lib/flow";

  export let open = false;
  export let product: FlowProduct | null = null;
  export let locale: "no" | "en" = "no";

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: FlowProduct;
  }>();

  function gradeToPercent(grade: string) {
    return { A: 100, B: 82, C: 64, D: 46, E: 28, F: 18, G: 10 }[grade] ?? 0;
  }

  function noiseToPercent(noiseDb: number) {
    return Math.max(18, Math.min(100, 100 - (noiseDb - 66) * 11));
  }

  function stockCopy() {
    if (!product) return "";
    if (product.stockStatus === "in-stock") return locale === "no" ? "På lager" : "In stock";
    if (product.stockStatus === "low-stock") return locale === "no" ? "Få igjen" : "Low stock";
    return locale === "no" ? "Ikke på lager" : "Out of stock";
  }

  function priceCopy() {
    if (!product) return "";
    return locale === "no"
      ? `${new Intl.NumberFormat("nb-NO").format(product.price)} kr/stk`
      : `${new Intl.NumberFormat("en-US").format(product.price)} NOK/ea`;
  }
</script>

{#if open && product}
  <div class="fixed inset-0 z-40 bg-neutral/55 backdrop-blur-sm" on:click={() => dispatch("close")}></div>
  <section class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[2rem] border border-base-300 bg-base-100 shadow-2xl">
    <div class="mx-auto mt-3 h-1.5 w-12 rounded-full bg-base-300"></div>
    <div class="flex max-h-[88vh] flex-col overflow-hidden">
      <div class="flex items-start justify-between gap-4 px-5 pb-4 pt-3">
        <div>
          <p class="eyebrow mb-2">{locale === "no" ? "01.3 Produktdetalj" : "01.3 Product detail"}</p>
          <h2 class="font-display text-4xl leading-none">{product.brand} {product.model}</h2>
          <p class="mt-2 text-sm text-base-content/65">{product.dimensionLabel}</p>
        </div>
        <button type="button" class="btn btn-circle btn-ghost" on:click={() => dispatch("close")}>✕</button>
      </div>

      <div class="overflow-y-auto px-5 pb-5">
        <div class="space-y-5">
          <div class="rounded-box border border-base-300 bg-base-200 p-6">
            <img src={product.imageUrl} alt={product.imageAlt} class="mx-auto max-h-56 w-full object-contain" />
          </div>

          <div class="flex items-center justify-between gap-4">
            <strong class="font-display text-4xl leading-none">{priceCopy()}</strong>
            <span
              class={`badge rounded-full px-4 py-3 text-xs font-extrabold uppercase ${
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

          <div class="rounded-box bg-base-200 p-5">
            <p class="eyebrow mb-2">{locale === "no" ? "Kort fortalt" : "In short"}</p>
            <p class="text-sm leading-7 text-base-content/80">
              {locale === "no" ? product.storyNo : product.storyEn}
            </p>
          </div>

          <div class="space-y-3">
            <div class="collapse-arrow collapse border border-base-300 bg-base-100">
              <input type="checkbox" />
              <div class="collapse-title flex items-center gap-3 pr-10 text-sm font-bold">
                <span class="w-20">{locale === "no" ? "Drivstoff" : "Fuel"}</span>
                <progress class="progress progress-success h-2 flex-1" value={gradeToPercent(product.fuelRating)} max="100"></progress>
                <strong>{product.fuelRating}</strong>
              </div>
              <div class="collapse-content text-sm leading-7 text-base-content/70">
                {locale === "no"
                  ? "Dette er Sharifs oversettelse av rå EU-data: lavt stress, helt vanlig hverdag, og ingen forklaring som høres ut som et testlaboratorium."
                  : "This is Sharif's translation of raw EU data: low stress, normal everyday driving, and no explanation that sounds like a test lab."}
              </div>
            </div>

            <div class="collapse-arrow collapse border border-base-300 bg-base-100">
              <input type="checkbox" />
              <div class="collapse-title flex items-center gap-3 pr-10 text-sm font-bold">
                <span class="w-20">{locale === "no" ? "Veigrep" : "Grip"}</span>
                <progress class="progress progress-warning h-2 flex-1" value={gradeToPercent(product.gripRating)} max="100"></progress>
                <strong>{product.gripRating}</strong>
              </div>
              <div class="collapse-content text-sm leading-7 text-base-content/70">
                {locale === "no"
                  ? "Godt grep betyr at Harriet slipper å tolke bokstaver. Vi sier bare hva de betyr på veien."
                  : "Good grip means Harriet never has to interpret letters. We just tell her what they mean on the road."}
              </div>
            </div>

            <div class="collapse-arrow collapse border border-base-300 bg-base-100">
              <input type="checkbox" />
              <div class="collapse-title flex items-center gap-3 pr-10 text-sm font-bold">
                <span class="w-20">{locale === "no" ? "Støy" : "Noise"}</span>
                <progress class="progress progress-info h-2 flex-1" value={noiseToPercent(product.noiseDb)} max="100"></progress>
                <strong>{product.noiseDb} dB</strong>
              </div>
              <div class="collapse-content text-sm leading-7 text-base-content/70">
                {locale === "no"
                  ? "Roligere dekk gjør at bilen føles mindre travel. Helt enkelt."
                  : "Quieter tires make the car feel less busy. Simple as that."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-base-300 bg-base-100 px-5 py-4 safe-bottom">
        <button
          type="button"
          class="btn btn-primary btn-block btn-lg"
          disabled={product.stockStatus === "out-of-stock"}
          on:click={() => dispatch("confirm", product)}
        >
          {locale === "no" ? "Jeg tar disse" : "I'll take these"}
        </button>
      </div>
    </div>
  </section>
{/if}
