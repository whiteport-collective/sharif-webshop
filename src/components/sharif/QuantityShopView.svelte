<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { FlowProduct, FlowShop } from "../../lib/flow";

  export let locale: "no" | "en" = "no";
  export let product: FlowProduct;
  export let quantity = 4;
  export let selectedShopId = "fjellhamar";
  export let shops: FlowShop[] = [];

  const dispatch = createEventDispatcher<{
    quantity: number;
    shop: string;
    checkout: void;
  }>();

  $: activeShop = shops.find((shop) => shop.id === selectedShopId) ?? shops[0];
  $: total = product.price * quantity;

  function totalCopy(value: number) {
    return locale === "no"
      ? `${new Intl.NumberFormat("nb-NO").format(value)} kr`
      : `${new Intl.NumberFormat("en-US").format(value)} NOK`;
  }
</script>

<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
  <div class="space-y-5">
    <article class="surface-panel card bg-base-100">
      <div class="card-body gap-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="rounded-box bg-base-200 p-3 sm:w-28">
            <img src={product.imageUrl} alt={product.imageAlt} class="mx-auto h-20 w-full object-contain" />
          </div>
          <div>
            <p class="eyebrow">{locale === "no" ? "01.4 Antall og verksted" : "01.4 Quantity and shop"}</p>
            <h2 class="font-display text-4xl leading-none">{product.brand} {product.model}</h2>
            <p class="mt-2 text-sm text-base-content/65">
              {product.dimensionLabel} · {locale === "no"
                ? `${new Intl.NumberFormat("nb-NO").format(product.price)} kr/stk`
                : `${new Intl.NumberFormat("en-US").format(product.price)} NOK/ea`}
            </p>
          </div>
        </div>
      </div>
    </article>

    <article class="surface-panel card bg-base-100">
      <div class="card-body gap-4">
        <div>
          <p class="eyebrow">{locale === "no" ? "Hvor mange?" : "How many?"}</p>
          <p class="compact-note">
            {locale === "no"
              ? "Fire er valgt fra start fordi det vanligste valget skal være raskest."
              : "Four is preselected because the common choice should be the fastest one."}
          </p>
        </div>

        <div class="join join-horizontal w-full">
          <button
            type="button"
            class={`btn join-item flex-1 ${quantity === 2 ? "btn-primary" : "btn-outline"}`}
            on:click={() => dispatch("quantity", 2)}
          >
            2
          </button>
          <button
            type="button"
            class={`btn join-item flex-1 ${quantity === 4 ? "btn-primary" : "btn-outline"}`}
            on:click={() => dispatch("quantity", 4)}
          >
            4
          </button>
        </div>
      </div>
    </article>

    <article class="surface-panel card bg-base-100">
      <div class="card-body gap-4">
        <div>
          <p class="eyebrow">{locale === "no" ? "Hvor vil du montere?" : "Where do you want mounting?"}</p>
          <p class="compact-note">
            {locale === "no"
              ? "To tydelige verksteder. Harriet skal ikke trenge kart eller ekstra valg."
              : "Two clear workshop options. Harriet should not need maps or extra choices."}
          </p>
        </div>

        <div class="grid gap-3">
          {#each shops as shop}
            <button
              type="button"
              class={`card border text-left shadow-sm transition-colors ${
                shop.id === selectedShopId
                  ? "border-primary bg-primary/5"
                  : "border-base-300 bg-base-100"
              }`}
              on:click={() => dispatch("shop", shop.id)}
            >
              <div class="card-body gap-2">
                <h3 class="font-display text-3xl leading-none">{locale === "no" ? shop.nameNo : shop.nameEn}</h3>
                <p class="text-sm text-base-content/65">{shop.address}</p>
                <p class="text-sm font-bold text-success">
                  {locale === "no" ? shop.availabilityNo : shop.availabilityEn}
                </p>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </article>
  </div>

  <aside class="surface-panel card bg-base-100 lg:sticky lg:top-24 lg:h-fit">
    <div class="card-body gap-5">
      <div>
        <p class="eyebrow">{locale === "no" ? "Ordresammendrag" : "Order summary"}</p>
        <h3 class="font-display text-3xl leading-none">{locale === "no" ? "Klar for betaling" : "Ready for payment"}</h3>
      </div>

      <dl class="space-y-3 text-sm">
        <div class="flex items-center justify-between gap-3">
          <dt class="text-base-content/60">{locale === "no" ? "Linje" : "Line"}</dt>
          <dd class="font-bold">{quantity} × {totalCopy(product.price)}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="text-base-content/60">{locale === "no" ? "Montering" : "Mounting"}</dt>
          <dd class="font-bold">{locale === "no" ? activeShop.nameNo : activeShop.nameEn}</dd>
        </div>
        <div class="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
          <dt class="text-base-content/60">{locale === "no" ? "Totalt" : "Total"}</dt>
          <dd class="font-display text-4xl leading-none">{totalCopy(total)}</dd>
        </div>
      </dl>

      <button type="button" class="btn btn-primary btn-lg btn-block" on:click={() => dispatch("checkout")}>
        {locale === "no"
          ? `Betal nå — ${totalCopy(total)}`
          : `Pay now — ${totalCopy(total)}`}
      </button>

      <p class="compact-note">
        {locale === "no"
          ? "Neste steg er et rent provider-handoff. Sharif eier flyten, betalingsleverandøren eier checkouten."
          : "The next step is a pure provider handoff. Sharif owns the flow, the payment provider owns checkout."}
      </p>
    </div>
  </aside>
</section>
