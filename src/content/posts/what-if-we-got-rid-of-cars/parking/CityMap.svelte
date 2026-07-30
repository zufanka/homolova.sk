<script lang="ts">
  /**
   * The map instrument: the city's name and three headline figures, the canvas
   * itself, and its controls.
   *
   * This is a *thin wrapper*. All the drawing lives in `map/ParkMap` — a plain
   * class with an imperative API — and this component's only job is to create
   * it, feed it its instrument's `view` state from effects, and render the
   * chrome around it. The render loop, the LRU caches and the neighbour
   * prefetch are deliberately not Svelte state.
   *
   * Every browser API is reached from `onMount` or an effect: the site is
   * prerendered by `adapter-static`, so module scope runs in Node.
   */
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { useView } from './state.svelte';
  import { cities } from './cities';
  import type { CityRow } from './types';
  import { ParkMap } from './map';
  import type { UhiInfo } from './map';
  import { fmt1 } from './map/format';
  import { heat } from './map/heat.svelte';

  let {
    /** The cities, in the order neighbour prefetch follows. Defaults to the
     *  data module's order; pass the ranked order to match the visible list. */
    rows = cities
  }: { rows?: CityRow[] } = $props();

  const view = useView();

  let canvasEl: HTMLCanvasElement;
  let surfaceEl: HTMLElement;

  let map = $state<ParkMap | null>(null);
  let overlayMsg = $state<string | null>(null);
  let zoomed = $state(false);

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
      onUhi: (info: UhiInfo | null) => (heat.info = info)
    });
    map = instance;
    return () => {
      instance.destroy();
      map = null;
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

</script>

<div class="mapwrap">
  <h3 class="mapname" aria-live="polite">{selected.city}</h3>
  <p class="mapsub">{sub}</p>

  <dl class="mapfigs">
    <div><dt>Median green</dt><dd class="g">{fmt1(metrics.medGreen)}% of land</dd></div>
    <div><dt>Median car</dt><dd class="a">{fmt1(metrics.medCar)}% of land</dd></div>
    <div><dt>No green</dt><dd class="z">{zeroText(selected, ' of people')}</dd></div>
  </dl>

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

  /* `--map-bleed` is published by the layout around the map — how far the plate
     may reach past the column it sits in, 0 unless the layout says otherwise.
     The tiles are joined to the top of the plate, so they travel with it; the
     name, the sub and the keys stay inside the column where text belongs. */
  .mapbox {
    position: relative;
    margin-inline: calc(-1 * var(--map-bleed, 0px));
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
    margin: 0 calc(-1 * var(--map-bleed, 0px));
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

  @media (max-width: 899px) {
    .mapname {
      font-size: 1.15rem;
    }
    .mapsub {
      display: none;
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
