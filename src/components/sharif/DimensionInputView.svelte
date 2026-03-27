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
  export let source: "shopify" | "spreadsheet" = "spreadsheet";

  const dispatch = createEventDispatcher<{
    update: { width: string; profile: string; rim: string };
    submit: void;
    help: void;
  }>();

  let activeField: "width" | "profile" | "rim" = "width";
  let overlayOpen = false;
  let rimLetter = "R";

  $: profiles = dimensions.profilesByWidth[width] ?? [];
  $: rims = dimensions.rimsByWidthProfile[`${width}/${profile}`] ?? [];

  function openOverlay(field: "width" | "profile" | "rim") {
    activeField = field;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      overlayOpen = true;
    }
  }

  function closeOverlay() {
    overlayOpen = false;
  }

  function selectSuggestion(value: string) {
    if (activeField === "width") {
      dispatch("update", { width: value, profile: "", rim: "" });
      activeField = "profile";
      return;
    }

    if (activeField === "profile") {
      dispatch("update", { width, profile: value, rim: "" });
      activeField = "rim";
      return;
    }

    dispatch("update", { width, profile, rim: value });
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      closeOverlay();
    }
  }

  function handleFieldInput(field: "width" | "profile" | "rim", event: Event) {
    const nextValue = (event.currentTarget as HTMLInputElement).value.replace(/\D/g, "");

    if (field === "width") {
      dispatch("update", { width: nextValue.slice(0, 3), profile: "", rim: "" });
      if (dimensions.widths.includes(nextValue.slice(0, 3))) {
        activeField = "profile";
      }
      return;
    }

    if (field === "profile") {
      dispatch("update", { width, profile: nextValue.slice(0, 2), rim: "" });
      if (profiles.includes(nextValue.slice(0, 2))) {
        activeField = "rim";
      }
      return;
    }

    dispatch("update", { width, profile, rim: nextValue.slice(0, 2) });
    if (rims.includes(nextValue.slice(0, 2)) && valid) {
      closeOverlay();
    }
  }

  function handlePaste(event: ClipboardEvent) {
    const raw = event.clipboardData?.getData("text") ?? "";
    const match = raw.toUpperCase().replace(/\s+/g, "").match(/^(\d{3})[\/]?(\d{2})(?:ZR|R|C)?(\d{2})/);
    if (!match) {
      return;
    }

    event.preventDefault();
    dispatch("update", {
      width: match[1],
      profile: match[2],
      rim: match[3],
    });
    rimLetter = raw.toUpperCase().includes("ZR") ? "ZR" : raw.toUpperCase().includes("C") ? "C" : "R";
    closeOverlay();
  }

  function suggestions() {
    if (activeField === "width") {
      return dimensions.widths.filter((value) => value.startsWith(width)).slice(0, 16);
    }
    if (activeField === "profile") {
      return profiles.filter((value) => value.startsWith(profile)).slice(0, 16);
    }
    return rims.filter((value) => value.startsWith(rim)).slice(0, 16);
  }
</script>

<section class="hero-grid">
  <div class="space-y-5">
    <div class="space-y-4">
      <p class="eyebrow">{locale === "no" ? "Harriets flow" : "Harriet's flow"}</p>
      <h1 class="section-heading text-balance">
        {locale === "no" ? "Hva er størrelsen på dekkene dine?" : "What size are your tires?"}
      </h1>
      <p class="max-w-[56ch] text-base leading-8 text-base-content/70">
        {locale === "no"
          ? "Tre sammenkoblede felt, kontekstuelle forslag og én stor knapp. Ingen klassisk butikklogikk før Harriet har gjort det ene valget hun faktisk må gjøre."
          : "Three connected fields, contextual suggestions, and one big button. No classic store logic until Harriet has made the one decision she actually has to make."}
      </p>
    </div>

    <div class="flex flex-wrap gap-3">
      <span class="metric-pill">1. {locale === "no" ? "Finn størrelse" : "Find size"}</span>
      <span class="metric-pill">2. {locale === "no" ? "Sveip produkter" : "Swipe products"}</span>
      <span class="metric-pill">3. {locale === "no" ? "Betal og book" : "Pay and book"}</span>
    </div>

    <article class="surface-panel card overflow-hidden bg-base-100">
      <div class="card-body gap-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs font-extrabold uppercase tracking-[0.12em] text-base-content/55">
            {locale === "no" ? "Tre felt + smart paste" : "Three fields + smart paste"}
          </p>
          <button type="button" class="link link-primary font-bold no-underline hover:underline" on:click={() => dispatch("help")}>
            {locale === "no" ? "Hvor finner jeg dette?" : "Where do I find this?"}
          </button>
        </div>

        <div class="rounded-box border border-base-300 bg-base-200 p-2" on:paste={handlePaste}>
          <div class="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <label class="form-control">
              <span class="label pb-1"><span class="label-text text-xs font-bold uppercase tracking-[0.1em]">{locale === "no" ? "Bredde" : "Width"}</span></span>
              <input
                class="input input-bordered input-lg w-full bg-base-100 text-xl font-black"
                inputmode="numeric"
                maxlength="3"
                value={width}
                on:focus={() => openOverlay("width")}
                on:input={(event) => handleFieldInput("width", event)}
              />
            </label>
            <div class="hidden items-end justify-center pb-5 text-3xl font-black md:flex">/</div>

            <label class="form-control">
              <span class="label pb-1"><span class="label-text text-xs font-bold uppercase tracking-[0.1em]">{locale === "no" ? "Profil" : "Profile"}</span></span>
              <input
                class="input input-bordered input-lg w-full bg-base-100 text-xl font-black"
                inputmode="numeric"
                maxlength="2"
                value={profile}
                disabled={!width}
                on:focus={() => openOverlay("profile")}
                on:input={(event) => handleFieldInput("profile", event)}
              />
            </label>
            <div class="hidden items-end justify-center gap-2 pb-5 md:flex">
              <span class="text-xl font-black">{rimLetter}</span>
            </div>

            <label class="form-control">
              <span class="label pb-1"><span class="label-text text-xs font-bold uppercase tracking-[0.1em]">{locale === "no" ? "Felg" : "Rim"}</span></span>
              <input
                class="input input-bordered input-lg w-full bg-base-100 text-xl font-black"
                inputmode="numeric"
                maxlength="2"
                value={rim}
                disabled={!profile}
                on:focus={() => openOverlay("rim")}
                on:input={(event) => handleFieldInput("rim", event)}
              />
            </label>
          </div>
        </div>

        <div class="space-y-3">
          <p class={`min-h-[1.25rem] text-sm font-bold ${feedback ? "text-primary" : "text-base-content/55"}`}>
            {feedback || (locale === "no" ? "Tips: lim inn 205/55R16 rett i feltet over." : "Tip: paste 205/55R16 directly into the fields above.")}
          </p>
          <button type="button" class="btn btn-primary btn-lg btn-block" disabled={!valid} on:click={() => dispatch("submit")}>
            {locale === "no" ? "Finn dekk" : "Find tires"}
          </button>
        </div>
      </div>
    </article>

    <div class="flex flex-wrap gap-2">
      <span class="badge badge-outline rounded-full p-4 font-bold">60+ {locale === "no" ? "år med dekk" : "years of tires"}</span>
      <span class="badge badge-outline rounded-full p-4 font-bold">{locale === "no" ? "Montering inkludert" : "Mounting included"}</span>
      <span class="badge badge-outline rounded-full p-4 font-bold">{locale === "no" ? "Fra 499 kr" : "From 499 kr"}</span>
      <span class="badge badge-ghost rounded-full p-4 font-bold uppercase tracking-[0.08em]">
        {source === "shopify" ? "Shopify" : "Fallback data"}
      </span>
    </div>
  </div>

  <aside class="surface-panel card overflow-hidden bg-base-100">
    <figure class="bg-base-200 p-6">
      <img src="/illustration-tire-size.svg" alt="Tire sidewall guide" class="w-full rounded-box" />
    </figure>
    <div class="card-body gap-3">
      <p class="eyebrow">{locale === "no" ? "Visuell guide" : "Visual guide"}</p>
      <h2 class="font-display text-4xl leading-none">
        {locale === "no" ? "Det første og eneste spørsmålet" : "The first and only question"}
      </h2>
      <p class="compact-note">
        {locale === "no"
          ? "Freya beskrev heroen som et fullskjermsgrep på mobil. Når et felt får fokus, tar vi over flaten og lar forslagene gjøre resten."
          : "Freya described the hero as a fullscreen mobile takeover. When a field gets focus, the surface takes over and lets the suggestions do the rest."}
      </p>
    </div>
  </aside>
</section>

{#if overlayOpen}
  <div class="fixed inset-0 z-40 bg-neutral/55 backdrop-blur-sm md:hidden" on:click={closeOverlay}></div>
  <section class="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border border-base-300 bg-base-100 md:hidden">
    <div class="mx-auto mt-3 h-1.5 w-12 rounded-full bg-base-300"></div>
    <div class="flex min-h-[65vh] flex-col gap-4 p-5 safe-bottom">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="eyebrow mb-2">{locale === "no" ? "Velg størrelse" : "Choose size"}</p>
          <h2 class="font-display text-4xl leading-none">
            {activeField === "width"
              ? locale === "no"
                ? "Bredde"
                : "Width"
              : activeField === "profile"
                ? locale === "no"
                  ? "Profil"
                  : "Profile"
                : locale === "no"
                  ? "Felg"
                  : "Rim"}
          </h2>
        </div>
        <button type="button" class="btn btn-circle btn-ghost" on:click={closeOverlay}>✕</button>
      </div>

      <div class="rounded-box border border-base-300 bg-base-200 p-3">
        <div class="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          <input
            class={`input input-bordered input-lg w-full bg-base-100 text-xl font-black ${activeField === "width" ? "input-primary" : ""}`}
            inputmode="numeric"
            maxlength="3"
            value={width}
            on:focus={() => (activeField = "width")}
            on:input={(event) => handleFieldInput("width", event)}
          />
          <span class="text-2xl font-black">/</span>
          <input
            class={`input input-bordered input-lg w-full bg-base-100 text-xl font-black ${activeField === "profile" ? "input-primary" : ""}`}
            inputmode="numeric"
            maxlength="2"
            value={profile}
            disabled={!width}
            on:focus={() => (activeField = "profile")}
            on:input={(event) => handleFieldInput("profile", event)}
          />
          <span class="text-xl font-black">{rimLetter}</span>
          <input
            class={`input input-bordered input-lg w-full bg-base-100 text-xl font-black ${activeField === "rim" ? "input-primary" : ""}`}
            inputmode="numeric"
            maxlength="2"
            value={rim}
            disabled={!profile}
            on:focus={() => (activeField = "rim")}
            on:input={(event) => handleFieldInput("rim", event)}
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto rounded-box border border-base-300 bg-base-100">
        <ul class="menu w-full gap-1 p-3">
          {#each suggestions() as suggestion}
            <li>
              <button type="button" class="btn btn-ghost justify-start text-lg font-bold" on:click={() => selectSuggestion(suggestion)}>
                {activeField === "rim" ? `${rimLetter}${suggestion}` : suggestion}
              </button>
            </li>
          {/each}
          {#if suggestions().length === 0}
            <li class="px-3 py-4 text-sm text-base-content/60">
              {locale === "no" ? "Ingen forslag for det du skrev ennå." : "No suggestions for that input yet."}
            </li>
          {/if}
        </ul>
      </div>

      {#if activeField === "rim"}
        <div class="join join-horizontal w-full">
          {#each ["R", "ZR", "C"] as letter}
            <button
              type="button"
              class={`btn join-item flex-1 ${rimLetter === letter ? "btn-primary" : "btn-outline"}`}
              on:click={() => (rimLetter = letter)}
            >
              {letter}
            </button>
          {/each}
        </div>
      {/if}

      <button type="button" class="btn btn-primary btn-lg btn-block" disabled={!valid} on:click={() => dispatch("submit")}>
        {locale === "no" ? "Finn dekk" : "Find tires"}
      </button>
    </div>
  </section>
{/if}
