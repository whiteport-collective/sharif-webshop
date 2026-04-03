<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let locale: "no" | "en" = "no";
  export let cartCount = 0;

  const dispatch = createEventDispatcher<{
    locale: "no" | "en";
    support: void;
    cart: void;
    menu: void;
  }>();

  function setLocale(nextLocale: "no" | "en") {
    if (nextLocale === locale) {
      return;
    }
    dispatch("locale", nextLocale);
  }
</script>

<header class="fixed top-0 left-0 right-0 z-30 bg-[#fff8f6]/80 backdrop-blur-xl">
  <div class="page-shell flex min-h-[76px] items-center justify-between gap-4">
    <a href="/" class="flex items-center no-underline">
      <img src="/sharif-logo.png" alt="Sharif" class="h-8" />
    </a>

    <div class="flex items-center gap-2">
      <div class="join rounded-full border border-base-300 bg-base-200 p-1">
        <button
          type="button"
          class={`btn join-item btn-sm rounded-full ${locale === "no" ? "btn-neutral" : "btn-ghost"}`}
          on:click={() => setLocale("no")}
        >
          NO
        </button>
        <button
          type="button"
          class={`btn join-item btn-sm rounded-full ${locale === "en" ? "btn-neutral" : "btn-ghost"}`}
          on:click={() => setLocale("en")}
        >
          EN
        </button>
      </div>

      <button type="button" class="btn btn-circle btn-ghost border border-base-300 bg-base-100" on:click={() => dispatch("support")}>
        ☎
      </button>
      <button type="button" class="btn btn-circle btn-ghost relative border border-base-300 bg-base-100" on:click={() => dispatch("cart")}>
        🛒
        <span class="badge badge-primary absolute -right-1 -top-1 min-w-5 text-[0.7rem]">{cartCount}</span>
      </button>
      <button type="button" class="btn btn-circle btn-ghost border border-base-300 bg-base-100" on:click={() => dispatch("menu")}>
        ☰
      </button>
    </div>
  </div>
</header>
