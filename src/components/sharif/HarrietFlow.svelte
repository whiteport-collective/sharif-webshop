<script lang="ts">
  import { onMount } from "svelte";
  import type { FlowBootstrap, FlowProduct } from "../../lib/flow";
  import GlobalHeader from "./GlobalHeader.svelte";
  import DimensionInputView from "./DimensionInputView.svelte";
  import ProductCard from "./ProductCard.svelte";
  import ProductDetailSheet from "./ProductDetailSheet.svelte";
  import QuantityShopView from "./QuantityShopView.svelte";

  export let bootstrap: FlowBootstrap;

  let locale: "no" | "en" = "no";
  let width = "";
  let profile = "";
  let rim = "";
  let feedback = "";
  let selectedProduct: FlowProduct | null = null;
  let detailProduct: FlowProduct | null = null;
  let quantity = 4;
  let shopId = "fjellhamar";
  let filterOpen = false;
  let helpOpen = false;
  let supportOpen = false;
  let cartOpen = false;
  let menuOpen = false;
  let resultsVisible = false;
  let loadingCheckout = false;
  let modelFilters: string[] = [];
  let availableOnly = false;

  onMount(() => {
    const storedLocale = window.localStorage.getItem("sharif-locale");
    if (storedLocale === "en" || storedLocale === "no") {
      locale = storedLocale;
    }
  });

  $: currentDimension = { width, profile, rim };
  $: dimensionLabel = [width, profile, rim].every(Boolean) ? `${width}/${profile}R${rim}` : "";
  $: allMatches = bootstrap.products
    .filter((product) => product.width === width)
    .filter((product) => product.profile === profile)
    .filter((product) => product.rim === rim)
    .sort((a, b) => a.price - b.price);
  $: filteredMatches = allMatches
    .filter((product) => (modelFilters.length ? modelFilters.includes(product.model) : true))
    .filter((product) => (availableOnly ? product.stockStatus !== "out-of-stock" : true));
  $: validDimension = allMatches.length > 0;
  $: feedback = dimensionLabel
    ? validDimension
      ? ""
      : locale === "no"
        ? "Vi fant ingen dekk på den kombinasjonen. Prøv en annen størrelse."
        : "We could not find tires for that combination. Try another size."
    : locale === "no"
      ? "Tips: lim inn 205/55R16 rett i feltet over."
      : "Tip: paste 205/55R16 directly into the fields above.";
  $: cartCount = selectedProduct ? 1 : 0;
  $: activeShop = bootstrap.shops.find((shop) => shop.id === shopId) ?? bootstrap.shops[0];
  $: total = selectedProduct ? selectedProduct.price * quantity : 0;
  $: uniqueModels = Array.from(new Set(allMatches.map((product) => product.model))).sort((a, b) => a.localeCompare(b));

  function setLocale(nextLocale: "no" | "en") {
    locale = nextLocale;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sharif-locale", nextLocale);
    }
  }

  function updateDimension(event: CustomEvent<{ width: string; profile: string; rim: string }>) {
    width = event.detail.width;
    profile = event.detail.profile;
    rim = event.detail.rim;
    resultsVisible = false;
    selectedProduct = null;
  }

  function showResults() {
    if (!validDimension) {
      return;
    }
    resultsVisible = true;
    setTimeout(() => document.getElementById("results-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  }

  function openProduct(product: FlowProduct) {
    detailProduct = product;
  }

  function selectProduct(event: CustomEvent<FlowProduct>) {
    selectedProduct = event.detail;
    detailProduct = null;
    quantity = 4;
    shopId = "fjellhamar";
    setTimeout(() => document.getElementById("selection-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  }

  function saveOrderLocally(orderId: string) {
    if (!selectedProduct || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "sharif-current-order",
      JSON.stringify({
        id: orderId,
        locale,
        quantity,
        shopId,
        total,
        product: selectedProduct,
        source: bootstrap.source,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  async function handleCheckout() {
    if (!selectedProduct || loadingCheckout) {
      return;
    }

    loadingCheckout = true;
    const orderId = `SH-${Date.now()}`;
    saveOrderLocally(orderId);

    const storeDomain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
    const token = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

    if (bootstrap.shopify.enabled && storeDomain && token && selectedProduct.variantId) {
      try {
        const response = await fetch(`https://${storeDomain}/api/2025-10/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": token,
          },
          body: JSON.stringify({
            query: `
              mutation CreateSharifCart($input: CartInput!) {
                cartCreate(input: $input) {
                  cart { id checkoutUrl }
                  userErrors { field message }
                }
              }
            `,
            variables: {
              input: {
                lines: [{ merchandiseId: selectedProduct.variantId, quantity }],
                attributes: [
                  { key: "shop_id", value: shopId },
                  { key: "shop_name", value: locale === "no" ? activeShop.nameNo : activeShop.nameEn },
                  { key: "mounting_location", value: activeShop.address },
                  { key: "return_url", value: `${window.location.origin}/booking?order=${orderId}` },
                ],
              },
            },
          }),
        });

        const payload = await response.json();
        const checkoutUrl = payload?.data?.cartCreate?.cart?.checkoutUrl;
        const errors = payload?.data?.cartCreate?.userErrors ?? [];

        if (checkoutUrl && errors.length === 0) {
          window.location.href = checkoutUrl;
          return;
        }
      } catch {
        // Fall back to local simulation below.
      }
    }

    window.location.href = `/checkout?order=${encodeURIComponent(orderId)}`;
  }

  function cartSummary() {
    if (!selectedProduct) {
      return locale === "no"
        ? "Ingen valgt vare ennå. Begynn med dimensjonen øverst."
        : "No product selected yet. Start with the tire size above.";
    }

    return locale === "no"
      ? `${selectedProduct.brand} ${selectedProduct.model}, ${quantity} stk, ${activeShop.nameNo}, totalt ${new Intl.NumberFormat("nb-NO").format(total)} kr.`
      : `${selectedProduct.brand} ${selectedProduct.model}, ${quantity} tires, ${activeShop.nameEn}, total ${new Intl.NumberFormat("en-US").format(total)} NOK.`;
  }
</script>

<div class="pb-10">
  <GlobalHeader
    {locale}
    cartCount={cartCount}
    on:locale={(event) => setLocale(event.detail)}
    on:support={() => (supportOpen = true)}
    on:cart={() => (cartOpen = true)}
    on:menu={() => (menuOpen = true)}
  />

  <main class="space-y-8 py-10">
    <div class="page-shell">
      <DimensionInputView
        {locale}
        dimensions={bootstrap.dimensions}
        {width}
        {profile}
        {rim}
        valid={validDimension}
        {feedback}
        source={bootstrap.source}
        on:update={updateDimension}
        on:submit={showResults}
        on:help={() => (helpOpen = true)}
      />
    </div>

    <div id="results-anchor"></div>
    {#if resultsVisible}
      <section class="page-shell space-y-5">
        <article class="surface-panel card bg-base-100">
          <div class="card-body gap-4">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="space-y-2">
                <p class="eyebrow">{locale === "no" ? "01.2 Produktkort" : "01.2 Product cards"}</p>
                <div class="flex flex-wrap items-center gap-3">
                  <strong class="text-lg">{dimensionLabel} {locale === "no" ? "sommer" : "summer"}</strong>
                  <button type="button" class="link link-primary font-bold no-underline hover:underline" on:click={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    {locale === "no" ? "Endre" : "Edit"}
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-sm font-bold text-base-content/65">
                  {locale === "no"
                    ? `${filteredMatches.length} dekk funnet`
                    : `${filteredMatches.length} tires found`}
                </p>
                <button type="button" class="btn btn-outline btn-sm rounded-full" on:click={() => (filterOpen = true)}>
                  {locale === "no" ? "Filter" : "Filter"}
                </button>
              </div>
            </div>
          </div>
        </article>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="carousel carousel-center gap-4 overflow-x-auto rounded-box">
            {#each filteredMatches as product (product.id)}
              <div class="carousel-item w-[78%] min-w-[260px] max-w-[320px] md:w-[46%] lg:w-[36%]">
                <ProductCard {locale} {product} on:select={(event) => openProduct(event.detail)} />
              </div>
            {/each}
          </div>

          <aside class="surface-panel card bg-base-100">
            <div class="card-body gap-4">
              <p class="eyebrow">{locale === "no" ? "Harriet først" : "Harriet first"}</p>
              <h2 class="font-display text-4xl leading-none">
                {locale === "no" ? "Billigste først. Alt annet er sekundært." : "Cheapest first. Everything else is secondary."}
              </h2>
              <p class="compact-note">
                {locale === "no"
                  ? "Kortene bruker daisyUI card, badge og progress direkte. Shopify-produkter går inn her når Storefront-token finnes, ellers faller vi tilbake til Powertrac-arket."
                  : "The cards use daisyUI card, badge, and progress directly. Shopify products drop in here when a Storefront token is present, otherwise we fall back to the Powertrac sheet."}
              </p>
            </div>
          </aside>
        </div>
      </section>
    {/if}

    <div id="selection-anchor"></div>
    {#if selectedProduct}
      <section class="page-shell space-y-5">
        <QuantityShopView
          {locale}
          product={selectedProduct}
          {quantity}
          selectedShopId={shopId}
          shops={bootstrap.shops}
          on:quantity={(event) => (quantity = event.detail)}
          on:shop={(event) => (shopId = event.detail)}
          on:checkout={handleCheckout}
        />
      </section>
    {/if}

    <footer class="page-shell pt-4 text-sm text-base-content/55">
      <p>
        {locale === "no"
          ? "Bygget som en Astro-side med én Svelte-island for kjøpsflyten. Dokumentene ligger fortsatt på"
          : "Built as an Astro page with one Svelte island for the purchase flow. The documents still live at"}
        <a class="link link-primary font-bold" href="/design-process"> /design-process</a>.
      </p>
    </footer>
  </main>

  <ProductDetailSheet
    open={Boolean(detailProduct)}
    product={detailProduct}
    {locale}
    on:close={() => (detailProduct = null)}
    on:confirm={selectProduct}
  />

  {#if filterOpen}
    <div class="modal modal-open">
      <div class="modal-box max-w-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow">{locale === "no" ? "Filter" : "Filter"}</p>
            <h3 class="font-display text-4xl leading-none">{locale === "no" ? "Spiss listen" : "Trim the list"}</h3>
          </div>
          <button class="btn btn-circle btn-ghost" type="button" on:click={() => (filterOpen = false)}>✕</button>
        </div>

        <div class="mt-5 space-y-5">
          <fieldset class="fieldset rounded-box border border-base-300 p-4">
            <legend class="fieldset-legend font-bold">{locale === "no" ? "Modell" : "Model"}</legend>
            {#each uniqueModels as model}
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  checked={modelFilters.includes(model)}
                  on:change={(event) => {
                    const checked = (event.currentTarget as HTMLInputElement).checked;
                    modelFilters = checked
                      ? [...modelFilters, model]
                      : modelFilters.filter((entry) => entry !== model);
                  }}
                />
                <span>{model}</span>
              </label>
            {/each}
          </fieldset>

          <label class="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 p-4">
            <input
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
              bind:checked={availableOnly}
            />
            <span class="font-bold">{locale === "no" ? "Vis bare kjøpbare dekk" : "Only show available tires"}</span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary" type="button" on:click={() => (filterOpen = false)}>
            {locale === "no" ? "Bruk filter" : "Apply filter"}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if helpOpen}
    <div class="modal modal-open">
      <div class="modal-box max-w-3xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow">{locale === "no" ? "Hjelp" : "Help"}</p>
            <h3 class="font-display text-4xl leading-none">{locale === "no" ? "Se etter tall som dette" : "Look for numbers like this"}</h3>
          </div>
          <button class="btn btn-circle btn-ghost" type="button" on:click={() => (helpOpen = false)}>✕</button>
        </div>
        <img src="/illustration-tire-size.svg" alt="Tire sidewall guide" class="mt-5 rounded-box border border-base-300" />
      </div>
    </div>
  {/if}

  {#if supportOpen}
    <div class="modal modal-open">
      <div class="modal-box max-w-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow">Support</p>
            <h3 class="font-display text-4xl leading-none">{locale === "no" ? "Snakk med oss" : "Talk to us"}</h3>
          </div>
          <button class="btn btn-circle btn-ghost" type="button" on:click={() => (supportOpen = false)}>✕</button>
        </div>
        <div class="mt-5 grid gap-3">
          <a class="btn btn-outline justify-start" href="tel:+4793485790">+47 934 85 790</a>
          <a class="btn btn-outline justify-start" href="https://wa.me/4793485790">WhatsApp Moohsen</a>
        </div>
      </div>
    </div>
  {/if}

  {#if cartOpen}
    <div class="modal modal-open">
      <div class="modal-box max-w-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow">{locale === "no" ? "Handlekurv" : "Cart"}</p>
            <h3 class="font-display text-4xl leading-none">{locale === "no" ? "Status akkurat nå" : "Current status"}</h3>
          </div>
          <button class="btn btn-circle btn-ghost" type="button" on:click={() => (cartOpen = false)}>✕</button>
        </div>
        <p class="mt-5 text-sm leading-7 text-base-content/75">{cartSummary()}</p>
      </div>
    </div>
  {/if}

  {#if menuOpen}
    <div class="modal modal-open">
      <div class="modal-box max-w-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow">Menu</p>
            <h3 class="font-display text-4xl leading-none">Sharif</h3>
          </div>
          <button class="btn btn-circle btn-ghost" type="button" on:click={() => (menuOpen = false)}>✕</button>
        </div>
        <nav class="mt-5 grid gap-3">
          <a class="btn btn-outline justify-start" href="/design-process/A-Product-Brief/01-product-brief">
            {locale === "no" ? "Produktbrief" : "Product brief"}
          </a>
          <a class="btn btn-outline justify-start" href="/design-process/C-UX-Scenarios/01-harriets-tire-purchase/01-harriets-tire-purchase">
            {locale === "no" ? "Scenario 01" : "Scenario 01"}
          </a>
          <a class="btn btn-outline justify-start" href="/design-process/D-Design-System/00-design-system">
            {locale === "no" ? "Design system" : "Design system"}
          </a>
        </nav>
      </div>
    </div>
  {/if}
</div>
