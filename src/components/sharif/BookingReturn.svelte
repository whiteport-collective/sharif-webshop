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

  const slotsByShop = {
    fjellhamar: ["10:00", "11:00", "12:00", "13:00", "14:00"],
    drammen: ["09:30", "10:30", "11:30", "13:30"],
  };

  let order: LocalOrder = null;
  let selectedDate: Date | null = null;
  let selectedTime = "";
  let confirmed = false;
  let skipped = false;

  onMount(() => {
    try {
      order = JSON.parse(window.localStorage.getItem("sharif-current-order") || "null");
    } catch {
      order = null;
    }

    const start = nextSaturday(new Date());
    selectedDate = start;
  });

  $: slots = order ? slotsByShop[order.shopId as keyof typeof slotsByShop] ?? slotsByShop.fjellhamar : [];

  function nextSaturday(date: Date) {
    const next = new Date(date);
    const delta = (6 - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + delta);
    return next;
  }

  function dateOptions() {
    if (!selectedDate) {
      return [];
    }
    return Array.from({ length: 6 }, (_, index) => {
      const next = new Date(selectedDate);
      next.setDate(selectedDate.getDate() + index);
      return next;
    }).filter((date) => date.getDay() !== 0);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(order?.locale === "en" ? "en-US" : "nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  }

  function shopAddress() {
    return order?.shopId === "drammen"
      ? "Tordenskiolds gate 73, 3044 Drammen"
      : "Kloppaveien 16, 1472 Fjellhamar";
  }
</script>

<main class="min-h-screen pb-10">
  <header class="sticky top-0 z-20 border-b border-base-300 bg-base-100/85 backdrop-blur">
    <div class="page-shell flex min-h-[76px] items-center justify-between gap-4">
      <a href="/" class="grid gap-0.5 no-underline">
        <span class="font-display text-4xl leading-none text-primary">Sharif</span>
        <span class="text-sm font-bold text-base-content/65">Back after payment</span>
      </a>
      <div class="flex gap-3">
        <a class="btn btn-ghost btn-sm" href="/">New search</a>
        <a class="btn btn-ghost btn-sm" href="/design-process/C-UX-Scenarios/01-harriets-tire-purchase/01.6-book-mounting/01.6-book-mounting">Spec</a>
      </div>
    </div>
  </header>

  <section class="page-shell grid gap-5 pt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)]">
    <article class="surface-panel card bg-base-100">
      <div class="card-body gap-4">
        {#if order}
          <p class="eyebrow">01.6 Book mounting</p>
          <h1 class="section-heading">{order.locale === "en" ? "Thanks for your order!" : "Takk for bestillingen!"}</h1>
          <p class="compact-note">{order.quantity} × {order.product.brand} {order.product.model}</p>
          <p class="compact-note">
            {order.product.dimensionLabel} · {order.locale === "en"
              ? `${new Intl.NumberFormat("en-US").format(order.total)} NOK`
              : `${new Intl.NumberFormat("nb-NO").format(order.total)} kr`}
          </p>
          <p class="compact-note">{order.shopId === "drammen" ? "Drammen" : "Fjellhamar"}</p>
        {:else}
          <p class="eyebrow">Order missing</p>
          <h1 class="section-heading">Start the flow first</h1>
          <p class="compact-note">No local order context was found for the booking return.</p>
        {/if}
      </div>
    </article>

    <article class="surface-panel card bg-base-100">
      <div class="card-body gap-5">
        {#if !order}
          <p class="compact-note">Go back to the homepage and complete the checkout handoff first.</p>
        {:else if confirmed}
          <p class="eyebrow">Booked</p>
          <h2 class="section-heading">
            {formatDate(selectedDate!)} {order.locale === "en" ? "at" : "kl."} {selectedTime}
          </h2>
          <p class="compact-note">{shopAddress()}</p>
          <p class="compact-note">{order.locale === "en" ? "Screenshot-friendly confirmation complete." : "Bekreftelsen er klar for skjermbilde."}</p>
          <a class="btn btn-primary" href="/">Back to start</a>
        {:else if skipped}
          <p class="eyebrow">Reminder queued</p>
          <h2 class="section-heading">
            {order.locale === "en"
              ? "We will email you a booking link."
              : "Vi sender deg en bookinglenke på e-post."}
          </h2>
          <p class="compact-note">{shopAddress()}</p>
          <a class="btn btn-primary" href="/">Back to start</a>
        {:else}
          <p class="eyebrow">Find your time</p>
          <h2 class="section-heading">{order.locale === "en" ? "Choose a slot" : "Velg en slot"}</h2>
          <p class="compact-note">
            {order.locale === "en"
              ? "Mock booking slots for the POC. This is where Google Calendar will plug in later."
              : "Mockede bookingtider for POC-en. Her kobles Google Calendar inn senere."}
          </p>

          <div class="grid grid-cols-3 gap-3 md:grid-cols-6">
            {#each dateOptions() as date}
              <button
                type="button"
                class={`btn h-auto min-h-16 flex-col rounded-2xl px-3 py-3 ${selectedDate?.toDateString() === date.toDateString() ? "btn-primary" : "btn-outline"}`}
                on:click={() => {
                  selectedDate = date;
                  selectedTime = "";
                }}
              >
                <span class="text-[0.72rem] uppercase tracking-[0.12em] opacity-80">
                  {new Intl.DateTimeFormat(order.locale === "en" ? "en-US" : "nb-NO", { weekday: "short" }).format(date)}
                </span>
                <strong>{date.getDate()}</strong>
              </button>
            {/each}
          </div>

          <div class="flex flex-wrap gap-3">
            {#each slots as slot}
              <button
                type="button"
                class={`btn rounded-full ${selectedTime === slot ? "btn-primary" : "btn-outline"}`}
                on:click={() => (selectedTime = slot)}
              >
                {slot}
              </button>
            {/each}
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="btn btn-primary btn-lg" type="button" disabled={!selectedTime} on:click={() => (confirmed = true)}>
              {order.locale === "en" ? "Confirm time" : "Bekreft tid"}
            </button>
            <button class="btn btn-ghost" type="button" on:click={() => (skipped = true)}>
              {order.locale === "en" ? "Choose time later" : "Velg tid senere"}
            </button>
          </div>
        {/if}
      </div>
    </article>
  </section>
</main>
