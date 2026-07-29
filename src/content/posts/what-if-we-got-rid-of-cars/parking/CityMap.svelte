<script lang="ts">
  /**
   * The map instrument: the city's name and three headline figures, the canvas
   * itself, its controls, and the full-screen mode.
   *
   * This is a *thin wrapper*. All the drawing lives in `map/ParkMap` — a plain
   * class with an imperative API — and this component's only job is to create
   * it, feed it the shared `view` state from effects, and render the chrome
   * around it. The render loop, the LRU caches and the neighbour prefetch are
   * deliberately not Svelte state.
   *
   * Every browser API is reached from `onMount` or an effect: the site is
   * prerendered by `adapter-static`, so module scope runs in Node.
   */
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { view } from './state.svelte';
  import { cities } from './cities';
  import type { CityRow } from './types';
  import { ParkMap } from './map';
  import type { UhiInfo } from './map';
  import { fmt1 } from './map/format';
  import { heat } from './map/heat.svelte';
  import HeatLegend from './HeatLegend.svelte';

  let {
    /** The cities, in the order the full-screen prev/next steps through and
     *  the order neighbour prefetch follows. Defaults to the data module's
     *  order; pass the ranked order to match the visible list. */
    rows = cities
  }: { rows?: CityRow[] } = $props();

  let canvasEl: HTMLCanvasElement;
  let surfaceEl: HTMLElement;
  let wrapEl: HTMLElement;
  let expandBtn = $state<HTMLButtonElement | null>(null);

  let map = $state<ParkMap | null>(null);
  let overlayMsg = $state<string | null>(null);
  let zoomed = $state(false);
  let restoreFocus: HTMLElement | null = null;

  const selected = $derived(rows.find((c) => c.slug === view.slug) ?? rows[0]);
  const converted = $derived(view.stateKey === 'scenario');
  const metrics = $derived(converted ? selected.scenario : selected.now);
  const sub = $derived(
    selected.country +
      (selected.popShare
        ? ` · urban core, home to ${Math.round(selected.popShare)}% of the city’s residents`
        : '')
  );

  /**
   * "No green" collapses to ~0 for every city once the asphalt is planted —
   * every inhabited square holds some street or parking, so every square gains
   * something. The endpoint carries no information; the drop does.
   */
  function zeroText(c: CityRow, suffix = ''): string {
    const now = Math.round(c.now.zeroGreen);
    if (!converted) return `${now}%${suffix}`;
    return `${now}% → ${Math.round(c.scenario.zeroGreen)}%${suffix}`;
  }

  onMount(() => {
    const instance = new ParkMap(canvasEl, {
      surface: surfaceEl,
      geoBase: `${base}/posts/what-if-we-got-rid-of-cars/geo`,
      onOverlay: (msg: string | null) => (overlayMsg = msg),
      onZoom: (z: boolean) => (zoomed = z),
      onUhi: (info: UhiInfo | null) => (heat.info = info),
      onRequestFullscreen: () => openFullscreen()
    });
    map = instance;
    return () => {
      instance.destroy();
      map = null;
      document.body.classList.remove('parking-fslock');
      liftAncestors(false);
    };
  });

  // --- drive the renderer from the shared state -----------------------------

  $effect(() => {
    const m = map;
    if (!m) return;
    const slug = view.slug;
    const i = rows.findIndex((c) => c.slug === slug);
    m.setNeighbours([rows[i - 1]?.slug, rows[i + 1]?.slug].filter(Boolean) as string[]);
    void m.setCity(slug, rows[i]?.city ?? slug);
  });

  $effect(() => {
    map?.setStateKey(view.stateKey);
  });

  $effect(() => {
    void map?.setHeat(view.heat);
  });

  // The heat key needs to know, before the geometry lands, whether this city
  // is modelled at all — that comes from the city row, not the geo file.
  $effect(() => {
    heat.available = Boolean(selected.uhi);
    heat.city = selected.city;
  });

  // --- full screen ----------------------------------------------------------

  $effect(() => {
    const on = view.fullscreen;
    document.body.classList.toggle('parking-fslock', on);
    liftAncestors(on);
    map?.setFullscreen(on);
    map?.resize();
  });

  /**
   * The map sits inside a sticky column, and `position: sticky` creates a
   * stacking context — which traps the full-screen overlay behind anything the
   * surrounding layout paints later (the ranked list's bars). Nothing inside
   * this component can escape that, so while full screen is open we raise the
   * z-index of every ancestor that owns a stacking context, and put back
   * whatever was there on the way out. Layout CSS stays the layout's own.
   */
  let lifted: Array<[HTMLElement, string]> = [];
  function liftAncestors(on: boolean): void {
    for (const [el, prev] of lifted) el.style.zIndex = prev;
    lifted = [];
    if (!on || !wrapEl) return;
    for (let el = wrapEl.parentElement; el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.position === 'sticky' || cs.position === 'fixed' || cs.zIndex !== 'auto') {
        lifted.push([el, el.style.zIndex]);
        el.style.zIndex = '60';
      }
    }
  }

  function openFullscreen(): void {
    if (view.fullscreen) return;
    restoreFocus = document.activeElement as HTMLElement | null;
    view.fullscreen = true;
    queueMicrotask(() => surfaceEl?.focus());
  }

  function closeFullscreen(): void {
    if (!view.fullscreen) return;
    view.fullscreen = false;
    const back =
      restoreFocus && document.contains(restoreFocus) && restoreFocus !== document.body
        ? restoreFocus
        : expandBtn;
    queueMicrotask(() => back?.focus());
  }

  function stepCity(d: number): void {
    const i = rows.findIndex((c) => c.slug === view.slug);
    const n = rows.length;
    view.slug = rows[(((i + d) % n) + n) % n].slug;
  }

  /** Full screen: Esc closes, Tab is trapped inside the overlay. */
  function onWindowKeydown(e: KeyboardEvent): void {
    if (!view.fullscreen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeFullscreen();
      return;
    }
    if (e.key !== 'Tab' || !wrapEl) return;
    const f = Array.from(
      wrapEl.querySelectorAll<HTMLElement>('button, select, [tabindex="0"]')
    ).filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="mapwrap" class:fs={view.fullscreen} bind:this={wrapEl}>
  <h3 class="mapname" aria-live="polite">{selected.city}</h3>
  <p class="mapsub">{sub}</p>

  {#if view.fullscreen}
    <button class="mapbtn fsclose" onclick={closeFullscreen} aria-label="Close full-screen map"
      >×</button
    >
  {/if}

  <dl class="mapfigs">
    <div><dt>Median green</dt><dd class="g">{fmt1(metrics.medGreen)}% of land</dd></div>
    <div><dt>Median car</dt><dd class="a">{fmt1(metrics.medCar)}% of land</dd></div>
    <div><dt>No green</dt><dd class="z">{zeroText(selected, ' of people')}</dd></div>
  </dl>

  {#if view.fullscreen}
    <div class="fsnav">
      <button class="mapbtn" onclick={() => stepCity(-1)} aria-label="Previous city">
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"
          ><path d="M9 1 L2 6 L9 11" fill="none" stroke="currentColor" stroke-width="1.8" /></svg
        >
      </button>
      <select
        class="fssel"
        aria-label="Choose a city"
        value={view.slug}
        onchange={(e) => (view.slug = e.currentTarget.value)}
      >
        {#each rows as c (c.slug)}
          <option value={c.slug}>{c.city}</option>
        {/each}
      </select>
      <button class="mapbtn" onclick={() => stepCity(1)} aria-label="Next city">
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"
          ><path d="M1 1 L8 6 L1 11" fill="none" stroke="currentColor" stroke-width="1.8" /></svg
        >
      </button>
    </div>
  {/if}

  <div class="mapbox">
    <!-- Gestures are bound imperatively by ParkMap: pointer capture, wheel,
         double-tap zoom and the keyboard shortcuts all live in the renderer.
         The tabindex is deliberate — role="application" hands the arrow keys to
         the map, and the label above tells a screen reader what they do. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="mapview"
      bind:this={surfaceEl}
      tabindex="0"
      role="application"
      aria-label="Interactive city map. Zoom with plus and minus keys, pan with arrow keys."
    >
      <canvas
        bind:this={canvasEl}
        aria-label="City map showing car infrastructure and public green space"
      ></canvas>
      {#if overlayMsg}<p class="overlay">{overlayMsg}</p>{/if}
    </div>
    <div class="mapctl">
      <button
        class="mapbtn"
        class:on={view.heat && selected.uhi}
        disabled={!selected.uhi}
        aria-pressed={view.heat && selected.uhi}
        title={selected.uhi
          ? 'Summer urban heat island, modelled °C above the rural surroundings'
          : 'No heat-island model for this city'}
        aria-label="Toggle summer heat island overlay"
        onclick={() => (view.heat = !view.heat)}>Heat</button
      >
      {#if zoomed}
        <button class="mapbtn" onclick={() => map?.resetView()} aria-label="Reset zoom">Reset</button
        >
      {/if}
      {#if !view.fullscreen}
        <button
          class="mapbtn"
          bind:this={expandBtn}
          onclick={openFullscreen}
          aria-label="Expand map to full screen"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"
            ><path
              d="M7.5 1 H11 V4.5 M11 1 L7 5 M4.5 11 H1 V7.5 M1 11 L5 7"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            /></svg
          >
        </button>
      {/if}
    </div>
  </div>

  {#if converted}
    <p class="convkey">
      <i></i><span
        >Converted: every surface parking lot and every calm street drawn as green. The figures
        convert the parking in full and 60% of the calm-street area; the map has no way to show a
        fraction of a street, so it shows all of them.</span
      >
    </p>
  {/if}

  <!-- In full screen the whole instrument is a fixed overlay, so the key comes
       with it; the inline copy under the map stands down while it is open. -->
  {#if view.fullscreen}
    <HeatLegend fullscreen />
  {/if}
</div>

<style>
  /* Component-scoped copies of the piece's palette. The park-ing prototype put
     these on :root; here they must not leak into the rest of the site. */
  .mapwrap {
    --pk-parking: #6d3f96;
    --pk-park: #0a6b40;
    --pk-asphalt: #7d4a9e;
    --pk-plate: #fdf5f0;
  }

  .mapname {
    font-family: var(--display);
    font-size: 1.3rem;
    margin: 0;
    line-height: 1.1;
  }
  .mapsub {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0.15rem 0 0.5rem;
  }

  .mapbox {
    position: relative;
    border: 1.5px solid var(--ink);
    background: var(--pk-plate);
  }
  .mapbox canvas {
    display: block;
    width: 100%;
    /* --map-h is published by the layout around the map, so the canvas sizes
       itself from the column rather than measuring the viewport. */
    height: var(--map-h, 15rem);
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--body-soft);
  }
  .mapview:focus-visible {
    outline-offset: -3px;
  }

  .mapfigs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    margin: 0;
    background: var(--ink);
    border: 1.5px solid var(--ink);
    border-bottom: 0;
  }
  .mapfigs > div {
    background: var(--bg);
    padding: 0.45rem 0.5rem;
  }
  .mapfigs dt {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
    font-weight: 600;
  }
  .mapfigs dd {
    margin: 0.15rem 0 0;
    font-family: var(--slab);
    font-weight: 700;
    font-size: 0.92rem;
    font-variant-numeric: tabular-nums;
  }
  .mapfigs dd.g {
    color: var(--pk-park);
  }
  .mapfigs dd.a {
    color: var(--pk-asphalt);
  }
  .mapfigs dd.z {
    color: var(--ink);
  }

  .mapctl {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    display: flex;
    gap: 0.35rem;
    z-index: 3;
  }
  .mapbtn {
    display: inline-grid;
    place-items: center;
    min-width: 1.9rem;
    height: 1.9rem;
    padding: 0 0.4rem;
    border: 1.5px solid var(--ink);
    background: var(--bg);
    color: var(--ink);
    font: 700 0.66rem/1 var(--sans);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .mapbtn:hover {
    background: var(--pk-plate);
  }
  .mapbtn.on,
  .mapbtn.on:hover {
    background: var(--ink);
    color: var(--bg);
  }
  .mapbtn:disabled {
    color: var(--muted);
    border-color: #bbb;
    background: var(--bg);
    cursor: default;
  }
  .mapbtn :global(svg) {
    display: block;
  }

  /* converted-state key: same shape as the heat key, sits above it */
  .convkey {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.45rem;
    font-size: 0.72rem;
    line-height: 1.35;
    color: var(--muted);
    margin: 0.4rem 0 0;
  }
  .convkey i {
    flex: none;
    width: 0.8rem;
    height: 0.8rem;
    border: 1.5px solid var(--ink);
    background: var(--pk-park);
  }

  /* --- full screen: the whole map instrument becomes a fixed overlay ------- */
  :global(body.parking-fslock) {
    overflow: hidden;
  }
  .mapwrap.fs {
    position: fixed;
    inset: 0;
    z-index: 60;
    margin: 0;
    background: var(--bg);
    box-shadow: none;
    padding: 0.8rem clamp(0.8rem, 2.5vw, 1.6rem) clamp(0.8rem, 2.5vw, 1.2rem);
    display: flex;
    flex-direction: column;
  }
  .mapwrap.fs .mapname {
    font-size: clamp(1.3rem, 3vw, 1.7rem);
    padding-right: 3rem;
  }
  .mapwrap.fs .fsclose {
    position: absolute;
    top: 0.8rem;
    right: clamp(0.8rem, 2.5vw, 1.6rem);
    width: 2.2rem;
    height: 2.2rem;
    font-size: 1.1rem;
  }
  .mapwrap.fs .mapfigs,
  .mapwrap.fs .fsnav {
    max-width: 30rem;
  }
  .mapwrap.fs .mapfigs {
    border-bottom: 1.5px solid var(--ink);
  }
  .fsnav {
    display: flex;
    gap: 0.35rem;
    margin: 0.6rem 0;
  }
  .fsnav .mapbtn {
    height: 2.2rem;
    min-width: 2.6rem;
  }
  .fssel {
    flex: 1;
    min-width: 0;
    border: 1.5px solid var(--ink);
    border-radius: 0;
    background: var(--bg);
    color: var(--ink);
    font: 600 0.9rem var(--sans);
    padding: 0 0.5rem;
  }
  .mapwrap.fs .mapbox {
    flex: 1 1 auto;
    min-height: 0;
  }
  .mapwrap.fs .mapview {
    height: 100%;
    touch-action: none;
  }
  .mapwrap.fs .mapview canvas {
    height: 100%;
  }

  @media (max-width: 899px) {
    .mapname {
      font-size: 1.15rem;
    }
    .mapsub {
      display: none;
    }
    .mapwrap.fs .mapsub {
      display: block;
    }
    .mapfigs > div {
      padding: 0.3rem 0.45rem;
    }
    .mapfigs dt {
      font-size: 0.6rem;
    }
    .mapfigs dd {
      font-size: 0.85rem;
      margin-top: 0.05rem;
    }
  }
</style>
