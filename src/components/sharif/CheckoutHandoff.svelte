<script lang="ts">
  import { onMount } from "svelte";

  type LocalOrder = {
    id: string;
    locale: "no" | "en";
    quantity: number;
    shopId: string;
    total: number;
    product: {
      brand: string;
      model: string;
      dimensionLabel: string;
    };
  } | null;

  let order: LocalOrder = null;
  let feedback = "";

  onMount(() => {
    try {
      order = JSON.parse(window.localStorage.getItem("sharif-current-order") || "null");
    } catch {
      order = null;
    }
  });

  function paySuccess() {
    if (!order) {
      feedback = "No local order found. Go back to Sharif and restart the flow.";
      return;
    }

    const paidOrder = { ...order, paymentStatus: "paid", paidAt: new Date().toISOString() };
    window.localStorage.setItem("sharif-current-order", JSON.stringify(paidOrder));
    feedback = order.locale === "en" ? "Payment accepted. Redirecting …" : "Betalingen er godkjent. Sender deg videre …";
    window.setTimeout(() => {
      window.location.href = `/booking?order=${encodeURIComponent(order.id)}&status=paid`;
    }, 700);
  }

  function paymentFailed() {
    feedback = order?.locale === "en"
      ? "The provider returned a failure state. Harriet can retry or change method."
      : "Betalingsleverandøren returnerte feilstatus. Harriet kan prøve igjen eller bytte metode.";
  }
</script>

<main class="grid min-h-screen place-items-center bg-base-200 px-4 py-8">
  <section class="surface-panel card w-full max-w-6xl bg-base-100">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="eyebrow">External provider</p>
          <h1 class="section-heading">Checkout handoff</h1>
          <p class="compact-note max-w-3xl">
            This page intentionally breaks out of Sharif styling. It is the spec-defined provider-owned step that sits between the guided flow and the booking return.
          </p>
        </div>
        <a class="btn btn-ghost" href="/">Back to Sharif</a>
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <article class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body gap-4">
            <p class="eyebrow">Order</p>
            {#if order}
              <h2 class="font-display text-4xl leading-none">{order.product.brand} {order.product.model}</h2>
              <p class="compact-note">{order.product.dimensionLabel}</p>
              <dl class="space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-base-content/60">Quantity</dt>
                  <dd class="font-bold">{order.quantity}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-base-content/60">Shop</dt>
                  <dd class="font-bold">{order.shopId === "drammen" ? "Drammen" : "Fjellhamar"}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-base-content/60">Return URL</dt>
                  <dd class="font-bold">/booking?order={order.id}</dd>
                </div>
                <div class="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
                  <dt class="text-base-content/60">Total</dt>
                  <dd class="font-display text-4xl leading-none">
                    {order.locale === "en"
                      ? `${new Intl.NumberFormat("en-US").format(order.total)} NOK`
                      : `${new Intl.NumberFormat("nb-NO").format(order.total)} kr`}
                  </dd>
                </div>
              </dl>
            {:else}
              <p class="compact-note">Local order data is missing. Restart the storefront flow first.</p>
            {/if}
          </div>
        </article>

        <article class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body gap-4">
            <p class="eyebrow">Payment</p>
            <button class="btn btn-primary btn-lg btn-block" type="button" on:click={paySuccess}>
              Pay with Vipps or card
            </button>
            <button class="btn btn-outline btn-block" type="button" on:click={paymentFailed}>
              Simulate payment failure
            </button>
            <a class="btn btn-ghost btn-block" href="/">Cancel and go back</a>
            <p class="text-sm font-bold text-primary min-h-[1.25rem]">{feedback}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</main>
