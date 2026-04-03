<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { FlowDimensions } from "../../lib/flow";

  export let locale: "no" | "en" = "no";
  export let dimensions: FlowDimensions;
  export let width = "";
  export let profile = "";
  export let rim = "";
  export let valid = false;
  export let feedback = "";
  const dispatch = createEventDispatcher<{
    update: { width: string; profile: string; rim: string };
    submit: void;
    help: void;
  }>();

  let pasteInput = "";
  let season = "summer";
  let quantity = "4";

  $: availableWidths = dimensions?.widths ?? [];
  $: availableProfiles = width ? (dimensions?.profilesByWidth?.[width] ?? []) : [];
  $: availableRims = width && profile ? (dimensions?.rimsByWidthProfile?.[`${width}/${profile}`] ?? []) : [];

  function setWidth(value: string) {
    width = value;
    profile = "";
    rim = "";
    dispatch("update", { width, profile, rim });
  }

  function setProfile(value: string) {
    profile = value;
    rim = "";
    dispatch("update", { width, profile, rim });
  }

  function setRim(value: string) {
    rim = value;
    dispatch("update", { width, profile, rim });
  }

  function parseDimension(input: string) {
    const cleaned = input.replace(/[^\d\/rR\s]/g, "").trim();
    const match = cleaned.match(/(\d{2,3})\s*[\/\s]\s*(\d{2})\s*[\/\s]?\s*[rR]?\s*(\d{2})/);
    if (match) {
      const [, w, p, r] = match;
      if (availableWidths.includes(w)) {
        width = w;
        const profiles = dimensions?.profilesByWidth?.[w] ?? [];
        if (profiles.includes(p)) {
          profile = p;
          const rims = dimensions?.rimsByWidthProfile?.[`${w}/${p}`] ?? [];
          if (rims.includes(r)) {
            rim = r;
          }
        }
      }
      dispatch("update", { width, profile, rim });
    }
  }

  function handlePasteInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    pasteInput = value;
    if (value.length >= 5) parseDimension(value);
  }

  function handlePaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (pasted.length >= 5) setTimeout(() => parseDimension(pasted), 0);
  }

  function handleSubmit() {
    if (valid) dispatch("submit");
  }
</script>

<!-- 01.1 Dimension Input — hero image + glass card -->
<section class="relative min-h-[100vh] w-full flex flex-col justify-center px-5 md:px-12 lg:px-24 overflow-hidden">

  <!-- Background image + overlay -->
  <div class="absolute inset-0 z-0">
    <img
      alt="Tire close-up"
      class="w-full h-full object-cover"
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPCnslL9kHvC2XfACPv2BR3Pi6yWxAlLzqA05GyJceBQb6fXDjjG6tul4NRCjuCdk6-ooWHTZ_wYqpVAE8No37BzBnJgdSiigPRfofGeEcyb20M2-WV4G8Q8YjbJd1sY31gSXDXuaYcdwhIadcsc4tnGrXntzlKSPkxnYN5-7E2aNsJL4hL0P0qohEx5Ecmk1xe5ChF8h6gEEDs0Kl-OjwFmEMwhnDm56wXMWf0BsTMMPHKjXE2G9vacUFI96lodmm7qRL_FCiwKA_"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-[#291714]/70 via-[#291714]/50 to-[#291714]/80"></div>
  </div>

  <!-- Content over hero -->
  <div class="relative z-10 w-full max-w-xl mx-auto lg:mx-0 pt-24 pb-8">

    <!-- Headline -->
    <div class="mb-6">
      <h1 class="font-display text-4xl md:text-5xl font-bold leading-tight text-white" style="letter-spacing: -0.02em;">
        {locale === "no" ? "Hva er størrelsen på dekkene dine?" : "What size are your tires?"}
      </h1>
      <p class="mt-3 text-sm text-white/70">
        {locale === "no"
          ? "Se på siden av dekket — tallene ser slik ut:"
          : "Look at the side of your tire — the numbers look like this:"}
      </p>
    </div>

    <!-- Smart paste input -->
    <div class="mb-4">
      <input
        type="text"
        class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-lg text-white placeholder-white/40 font-medium focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
        placeholder={locale === "no" ? "Skriv eller lim inn: 205/55R16" : "Type or paste: 205/55R16"}
        value={pasteInput}
        on:input={handlePasteInput}
        on:paste={handlePaste}
      />
    </div>

    <!-- Floating glass card -->
    <div class="glass-card rounded-xl p-6" style="border: 1px solid rgba(255,255,255,0.15);">

      <!-- Row 1: Quantity + Season -->
      <div class="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.15em] text-base-content/50 mb-1.5">
            {locale === "no" ? "Antall" : "Quantity"}
          </label>
          <select
            bind:value={quantity}
            class="w-full bg-base-200/60 border-0 border-b border-base-content/10 focus:border-primary focus:ring-0 text-base-content font-medium py-3 rounded-t-lg transition-all text-sm"
          >
            <option value="4">4 st</option>
            <option value="2">2 st</option>
            <option value="1">1 st</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.15em] text-base-content/50 mb-1.5">
            {locale === "no" ? "Type" : "Type"}
          </label>
          <select
            bind:value={season}
            class="w-full bg-base-200/60 border-0 border-b border-base-content/10 focus:border-primary focus:ring-0 text-base-content font-medium py-3 rounded-t-lg transition-all text-sm"
          >
            <option value="summer">{locale === "no" ? "Sommerdekk" : "Summer tires"}</option>
            <option value="winter-studless">{locale === "no" ? "Vinterdekk (piggfritt)" : "Winter (studless)"}</option>
            <option value="winter-studded">{locale === "no" ? "Vinterdekk (piggdekk)" : "Winter (studded)"}</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Width / Profile / Rim dropdowns -->
      <div class="grid grid-cols-3 gap-4 mb-5">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.15em] text-base-content/50 mb-1.5">
            {locale === "no" ? "Bredde" : "Width"}
          </label>
          <select
            value={width}
            on:change={(e) => setWidth(e.currentTarget.value)}
            class="w-full bg-base-200/60 border-0 border-b border-base-content/10 focus:border-primary focus:ring-0 text-base-content font-display font-bold py-3 rounded-t-lg transition-all text-2xl"
          >
            <option value="" disabled selected>—</option>
            {#each availableWidths as w}
              <option value={w}>{w}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.15em] text-base-content/50 mb-1.5">
            {locale === "no" ? "Profil" : "Profile"}
          </label>
          <select
            value={profile}
            on:change={(e) => setProfile(e.currentTarget.value)}
            class="w-full bg-base-200/60 border-0 border-b border-base-content/10 focus:border-primary focus:ring-0 text-base-content font-display font-bold py-3 rounded-t-lg transition-all text-2xl"
            disabled={!width}
          >
            <option value="" disabled selected>—</option>
            {#each availableProfiles as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.15em] text-base-content/50 mb-1.5">
            {locale === "no" ? "Felg" : "Rim"}
          </label>
          <select
            value={rim}
            on:change={(e) => setRim(e.currentTarget.value)}
            class="w-full bg-base-200/60 border-0 border-b border-base-content/10 focus:border-primary focus:ring-0 text-base-content font-display font-bold py-3 rounded-t-lg transition-all text-2xl"
            disabled={!profile}
          >
            <option value="" disabled selected>—</option>
            {#each availableRims as r}
              <option value={r}>R{r}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Help link -->
      <div class="mb-5 text-center">
        <button
          type="button"
          class="text-sm font-medium text-primary hover:underline"
          on:click={() => dispatch("help")}
        >
          {locale === "no" ? "Hvor finner jeg dette?" : "Where do I find this?"}
        </button>
      </div>

      <!-- Feedback -->
      {#if feedback}
        <p class="mb-4 text-sm text-center text-base-content/60">{feedback}</p>
      {/if}

      <!-- CTA Button -->
      <button
        type="button"
        class="w-full py-4 rounded-lg font-bold text-lg tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-150 {valid ? 'btn-ignition' : 'bg-base-300 text-base-content/40 cursor-not-allowed'}"
        disabled={!valid}
        on:click={handleSubmit}
      >
        <span>{locale === "no" ? "Finn dine nye dekk" : "Find your new tires"}</span>
        <span>→</span>
      </button>
    </div>

    <!-- Trust bar -->
    <div class="mt-6 text-center">
      <p class="text-xs text-white/50">
        {locale === "no"
          ? "60+ år med dekk · Montering inkludert · Fra 499 kr"
          : "60+ years of tires · Mounting included · From 499 kr"}
      </p>
    </div>
  </div>
</section>
