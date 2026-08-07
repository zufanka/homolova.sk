<script lang="ts">
  /**
   * The map instrument: three headline figures, the canvas itself, the heat key
   * under it, and the one control that belongs on the map rather than beside it.
   *
   * The city's name is *not* here. It is the select in `<MapPanel />`, which is
   * both the title and the way to change it; everything this component renders
   * is a reading of whichever city that control has chosen.
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
  import HeatLegend from './HeatLegend.svelte';

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

  /**
   * "No green" collapses to ~0 for every city once the asphalt is planted —
   * every inhabited square holds some street or parking, so every square gains
   * something.
   *
   * Both states now state where the city lands and nothing else. Converted used
   * to spell the drop out as `13% → 0%`, and that arrow cost more than it said:
   * the before-value is one toggle away, the fall is what the map behind it is
   * already showing, and it made this the only figure in the strip long enough
   * to wrap onto a second line on a phone. `<Ranking />` dropped the same arrow
   * for the same reasons and keeps its own copy of this function — the two are
   * parallel, not shared, because the ranking has 39 rows to fit and this has
   * one cell.
   */
  const zeroText = $derived(`${Math.round(metrics.zeroGreen)}% of people`);

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
  <dl class="mapfigs">
    <div><dt>Median green</dt><dd class="g">{fmt1(metrics.medGreen)}% of land</dd></div>
    <div><dt>Median car</dt><dd class="a">{fmt1(metrics.medCar)}% of land</dd></div>
    <div><dt>No green</dt><dd class="z">{zeroText}</dd></div>
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
    <!-- The only control still on the plate, and only while it has something to
         undo. RESET is not one of the reader's choices — those (which city,
         which state, whether the heat is on) are panel chrome above the map now
         — it is the way back out of a zoom the reader made on this surface, so
         it belongs on the surface, beside the thing it puts back. Rendering it
         with the zoom also keeps the chrome above from reflowing every time a
         pinch lands. -->
    {#if zoomed}
      <div class="mapctl">
        <button class="mapbtn" onclick={() => map?.resetView()} aria-label="Reset zoom">Reset</button
        >
      </div>
    {/if}
  </div>

  <!-- The scale, directly under the thing it scales. It renders only while the
       overlay does — `<HeatLegend />` gates itself on `view.heat` — because a
       temperature ramp with no raster on the map describes nothing, and a key
       that is always there would put a strip of colour between the map and its
       note for every reader who never turns the overlay on. -->
  <HeatLegend />

  {#if converted}
    <p class="convkey">
      Converted: every surface parking lot and every calm street drawn as green. The figures convert
      the parking in full and 60% of the calm-street area; the map has no way to show a fraction of a
      street, so it shows all of them.
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

  /* `--map-bleed` is published by the layout around the map — how far the plate
     may reach past the column it sits in, 0 unless the layout says otherwise.
     The tiles are joined to the top of the plate, so they travel with it; the
     heat ramp follows the plate the same way, and the wording under both stays
     inside the column where text belongs. */
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
  /* The gesture contract with ParkMap, and the reason it is `pan-y` and never
     `none`. Vertical page scroll passes straight through the map, so a finger
     landing on a plate that is half a phone tall still advances the article —
     the map is never a trap. What `pan-y` denies the browser is horizontal
     panning and pinch-zoom, and denying pinch-zoom is what delivers two-finger
     gestures to the renderer instead of to the compositor. One finger is the
     page's, two are the map's; see the gesture comment in `map/park-map.ts`. */
  .mapview {
    touch-action: pan-y;
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .mapview:focus-visible {
    outline-offset: -3px;
  }

  .mapfigs {
    display: grid;
    /* `minmax(0, 1fr)`, never a bare `1fr`. A bare `1fr` floors each track at
       its cell's min-content, so a value too long for a third of the strip
       widens the tracks instead of wrapping inside them — and the strip is bled
       to both edges of a phone screen with the page clipping its own overflow,
       so the third figure is the one that goes over the right edge with nothing
       to scroll to it. Zero-floored tracks always divide the strip in three;
       `overflow-wrap` on the value below is what absorbs the length. */
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    overflow-wrap: break-word;
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

  /* RESET only, and only while zoomed — the reader's own choices moved up into
     the panel's chrome, so nothing that is always on screen sits over the city
     any more. */
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

  /* converted-state note, under the heat key when that is showing. Plain prose:
     it carried a green swatch, and a one-colour key with no second entry names
     a colour the sentence beside it has already named. */
  .convkey {
    max-width: var(--measure);
    font-size: 0.72rem;
    line-height: 1.35;
    color: var(--muted);
    margin: 0.4rem 0 0;
  }

  @media (max-width: 899px) {
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
